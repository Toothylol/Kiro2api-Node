import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { TokenManager } from './token.js';
import { checkUsageLimits } from './usage.js';

const ACCOUNTS_FILE = 'accounts.json';

export class AccountPool {
  constructor(config, db = null) {
    this.config = config;
    this.accounts = new Map();
    this.tokenManagers = new Map();
    this.strategy = 'round-robin';
    this.roundRobinIndex = 0;
    this.db = db; // 数据库管理器（可选）
  }

  async load() {
    try {
      await fs.mkdir(this.config.dataDir, { recursive: true });

      // 从数据库加载账号
      if (this.db) {
        const accounts = this.db.getAllAccounts();
        for (const acc of accounts) {
          // 解析 JSON 字段
          const credentials = typeof acc.credentials === 'string'
            ? JSON.parse(acc.credentials)
            : acc.credentials;
          const usage = acc.usage && typeof acc.usage === 'string'
            ? JSON.parse(acc.usage)
            : acc.usage;

          const account = {
            id: acc.id,
            name: acc.name,
            credentials,
            status: acc.status,
            requestCount: acc.requestCount,
            errorCount: acc.errorCount,
            createdAt: acc.createdAt,
            lastUsedAt: acc.lastUsedAt,
            usage
          };

          this.accounts.set(acc.id, account);
          this.tokenManagers.set(acc.id, new TokenManager(this.config, credentials));
        }
        console.log(`✓ 从数据库加载了 ${accounts.length} 个账号`);
      }
    } catch (e) {
      console.error('加载账号池失败:', e);
    }
  }

  async save() {
    // 保留空实现以向后兼容，实际数据操作直接写入数据库
  }

  async addAccount(account, skipValidation = false) {
    const id = account.id || uuidv4();
    const newAccount = {
      id,
      name: account.name || '未命名账号',
      credentials: account.credentials,
      status: 'active',
      requestCount: 0,
      errorCount: 0,
      createdAt: new Date().toISOString(),
      lastUsedAt: null
    };

    // 验证凭证（可跳过）
    if (!skipValidation) {
      const tm = new TokenManager(this.config, newAccount.credentials);
      await tm.ensureValidToken(); // 会抛出错误如果无效
    }

    // 写入数据库
    if (this.db) {
      this.db.insertAccount(newAccount);
    }

    this.accounts.set(id, newAccount);
    this.tokenManagers.set(id, new TokenManager(this.config, newAccount.credentials));
    return id;
  }

  async removeAccount(id) {
    const removed = this.accounts.delete(id);
    this.tokenManagers.delete(id);
    if (removed && this.db) {
      this.db.deleteAccount(id);
    }
    return removed;
  }

  listAccounts() {
    return Array.from(this.accounts.values()).map(a => ({
      id: a.id,
      name: a.name,
      status: a.status,
      requestCount: a.requestCount,
      errorCount: a.errorCount,
      createdAt: a.createdAt,
      lastUsedAt: a.lastUsedAt,
      usage: a.usage || null
    }));
  }

  async refreshAccountUsage(id) {
    const account = this.accounts.get(id);
    if (!account) return null;

    try {
      const tm = this.tokenManagers.get(id);
      const token = await tm.ensureValidToken();
      const usage = await checkUsageLimits(token, this.config);

      account.usage = {
        usageLimit: usage.usageLimit,
        currentUsage: usage.currentUsage,
        available: usage.available,
        userEmail: usage.userEmail,
        subscriptionType: usage.subscriptionType,
        nextReset: usage.nextReset,
        updatedAt: new Date().toISOString()
      };

      // 写入数据库
      if (this.db) {
        this.db.updateAccount(id, { usage: account.usage });
      }

      return account.usage;
    } catch (e) {
      console.error(`刷新账号 ${id} 额度失败:`, e.message);
      return { error: e.message };
    }
  }

  async refreshAllUsage() {
    const results = [];
    for (const [id, account] of this.accounts) {
      if (account.status !== 'invalid') {
        const usage = await this.refreshAccountUsage(id);
        results.push({ id, name: account.name, usage });
      }
    }
    return results;
  }

  async selectAccount() {
    const available = Array.from(this.accounts.values())
      .filter(a => a.status === 'active');

    if (available.length === 0) return null;

    let selected;
    switch (this.strategy) {
      case 'random':
        selected = available[Math.floor(Math.random() * available.length)];
        break;
      case 'least-used':
        selected = available.reduce((a, b) => a.requestCount < b.requestCount ? a : b);
        break;
      default: // round-robin
        selected = available[this.roundRobinIndex % available.length];
        this.roundRobinIndex++;
    }

    selected.requestCount++;
    selected.lastUsedAt = new Date().toISOString();

    // 异步写入数据库，不阻塞请求
    if (this.db) {
      setImmediate(() => {
        this.db.updateAccount(selected.id, {
          requestCount: selected.requestCount,
          lastUsedAt: selected.lastUsedAt
        });
      });
    }

    return {
      id: selected.id,
      name: selected.name,
      tokenManager: this.tokenManagers.get(selected.id)
    };
  }

  async recordError(id, isRateLimit) {
    const account = this.accounts.get(id);
    if (!account) return;

    account.errorCount++;
    if (isRateLimit) {
      account.status = 'cooldown';
      setTimeout(() => {
        if (account.status === 'cooldown') {
          account.status = 'active';
          if (this.db) {
            this.db.updateAccount(id, { status: 'active' });
          }
        }
      }, 5 * 60 * 1000); // 5分钟冷却
    }

    // 写入数据库
    if (this.db) {
      this.db.updateAccount(id, {
        errorCount: account.errorCount,
        status: account.status
      });
    }
  }

  async markInvalid(id) {
    const account = this.accounts.get(id);
    if (account) {
      account.status = 'invalid';
      if (this.db) {
        this.db.updateAccount(id, { status: 'invalid' });
      }
    }
  }

  async enableAccount(id) {
    const account = this.accounts.get(id);
    if (account) {
      account.status = 'active';
      if (this.db) {
        this.db.updateAccount(id, { status: 'active' });
      }
      return true;
    }
    return false;
  }

  async disableAccount(id) {
    const account = this.accounts.get(id);
    if (account) {
      account.status = 'disabled';
      if (this.db) {
        this.db.updateAccount(id, { status: 'disabled' });
      }
      return true;
    }
    return false;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  getStrategy() {
    return this.strategy;
  }

  getStats() {
    const accounts = Array.from(this.accounts.values());
    return {
      total: accounts.length,
      active: accounts.filter(a => a.status === 'active').length,
      cooldown: accounts.filter(a => a.status === 'cooldown').length,
      invalid: accounts.filter(a => a.status === 'invalid').length,
      disabled: accounts.filter(a => a.status === 'disabled').length,
      totalRequests: accounts.reduce((sum, a) => sum + a.requestCount, 0),
      totalErrors: accounts.reduce((sum, a) => sum + a.errorCount, 0)
    };
  }

  addLog(log) {
    if (this.db) {
      this.db.insertLog({
        timestamp: log.timestamp || new Date().toISOString(),
        accountId: log.accountId,
        accountName: log.accountName,
        model: log.model,
        inputTokens: log.inputTokens,
        outputTokens: log.outputTokens,
        durationMs: log.durationMs,
        success: log.success,
        errorMessage: log.errorMessage,
        apiKey: log.apiKey,
        stream: log.stream,
        upstreamModel: log.upstreamModel
      });
    }
  }

  getRecentLogs(limit = 100, offset = 0) {
    if (this.db) {
      return this.db.getRecentLogs(limit, offset);
    }
    return [];
  }

  async removeAccounts(ids) {
    let removed = 0;
    for (const id of ids) {
      if (this.accounts.delete(id)) {
        this.tokenManagers.delete(id);
        removed++;
      }
    }
    if (removed > 0 && this.db) {
      this.db.deleteAccounts(ids);
    }
    return { total: ids.length, removed };
  }

  getLogStats() {
    if (this.db) {
      return this.db.getLogStats();
    }
    return {
      totalLogs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      successCount: 0,
      failureCount: 0
    };
  }
}
