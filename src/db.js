import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class DatabaseManager {
  constructor(config) {
    this.config = config;
    this.db = null;
  }

  async init() {
    const dbPath = path.join(this.config.dataDir, 'kiro.db');
    
    // 确保数据目录存在
    if (!fs.existsSync(this.config.dataDir)) {
      fs.mkdirSync(this.config.dataDir, { recursive: true });
    }

    // 初始化数据库连接
    this.db = new Database(dbPath);
    
    // 启用 WAL 模式（提升并发性能）
    this.db.pragma('journal_mode = WAL');
    
    // 创建表结构
    this.createTables();
    
    console.log('✓ 数据库初始化完成:', dbPath);
  }

  createTables() {
    // 请求日志表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS request_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        account_id TEXT NOT NULL,
        account_name TEXT NOT NULL,
        model TEXT,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        duration_ms INTEGER DEFAULT 0,
        success INTEGER DEFAULT 1,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引以优化查询性能
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON request_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_account_id ON request_logs(account_id);
      CREATE INDEX IF NOT EXISTS idx_model ON request_logs(model);
      CREATE INDEX IF NOT EXISTS idx_success ON request_logs(success);
      CREATE INDEX IF NOT EXISTS idx_created_at ON request_logs(created_at);
    `);

    // 账号表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        credentials TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        request_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        last_used_at TEXT,
        usage TEXT,
        db_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        db_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 账号表索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
      CREATE INDEX IF NOT EXISTS idx_accounts_last_used ON accounts(last_used_at);
      CREATE INDEX IF NOT EXISTS idx_accounts_created ON accounts(created_at);
    `);

    // 设置表（单例模式）
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        admin_key TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // API 密钥表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        key TEXT PRIMARY KEY,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 触发器：防止删除最后一个 API 密钥
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS prevent_last_api_key_deletion
      BEFORE DELETE ON api_keys
      BEGIN
        SELECT CASE
          WHEN (SELECT COUNT(*) FROM api_keys) <= 1
          THEN RAISE(ABORT, '无法删除最后一个 API 密钥')
        END;
      END;
    `);

    // 触发器：自动更新 accounts 表的 updated_at
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_accounts_timestamp
      AFTER UPDATE ON accounts
      BEGIN
        UPDATE accounts SET db_updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    // 触发器：自动更新 settings 表的 updated_at
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_settings_timestamp
      AFTER UPDATE ON settings
      BEGIN
        UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    console.log('✓ 数据库表结构创建完成');
  }

  // 插入请求日志
  insertLog(log) {
    const stmt = this.db.prepare(`
      INSERT INTO request_logs (
        timestamp, account_id, account_name, model, 
        input_tokens, output_tokens, duration_ms, success, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      log.timestamp,
      log.accountId,
      log.accountName,
      log.model || null,
      log.inputTokens || 0,
      log.outputTokens || 0,
      log.durationMs || 0,
      log.success ? 1 : 0,
      log.errorMessage || null
    );
  }

  // 获取最近的日志（分页）
  getRecentLogs(limit = 100, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        timestamp,
        account_id as accountId,
        account_name as accountName,
        model,
        input_tokens as inputTokens,
        output_tokens as outputTokens,
        duration_ms as durationMs,
        success,
        error_message as errorMessage
      FROM request_logs
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(limit, offset);
  }

  // 获取日志统计信息
  getLogStats() {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as totalLogs,
        SUM(input_tokens) as totalInputTokens,
        SUM(output_tokens) as totalOutputTokens,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successCount,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failureCount
      FROM request_logs
    `);

    return stmt.get();
  }

  // 清空所有日志
  clearLogs() {
    this.db.exec('DELETE FROM request_logs');
    this.db.exec('VACUUM'); // 回收空间
  }

  // 自动清理旧日志（保留最近 N 条）
  cleanupOldLogs(keepCount = 100000) {
    const stmt = this.db.prepare(`
      DELETE FROM request_logs
      WHERE id NOT IN (
        SELECT id FROM request_logs
        ORDER BY timestamp DESC
        LIMIT ?
      )
    `);
    
    const result = stmt.run(keepCount);
    
    if (result.changes > 0) {
      this.db.exec('VACUUM');
      console.log(`✓ 清理了 ${result.changes} 条旧日志`);
    }
    
    return result.changes;
  }

  // 按时间范围统计（用于图表，动态聚合粒度）
  getTimeSeriesStats(timeRange = '24h') {
    let timeCondition = '';
    let timeFormat = '';

    switch (timeRange) {
      case '24h':
        timeCondition = "datetime(timestamp, 'localtime') >= datetime('now', 'localtime', '-1 day')";
        timeFormat = '%Y-%m-%d %H:00:00'; // 按小时
        break;
      case '7d':
        timeCondition = "datetime(timestamp, 'localtime') >= datetime('now', 'localtime', '-7 days')";
        timeFormat = '%Y-%m-%d'; // 按天
        break;
      default:
        timeCondition = "datetime(timestamp, 'localtime') >= datetime('now', 'localtime', '-1 day')";
        timeFormat = '%Y-%m-%d %H:00:00';
    }

    const stmt = this.db.prepare(`
      SELECT 
        strftime('${timeFormat}', timestamp, 'localtime') as hour,
        model,
        COUNT(*) as count,
        SUM(input_tokens) as inputTokens,
        SUM(output_tokens) as outputTokens,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successCount
      FROM request_logs
      WHERE ${timeCondition}
      GROUP BY hour, model
      ORDER BY hour ASC
    `);

    return stmt.all();
  }

  // 按模型统计
  getStatsByModel(timeRange = '24h') {
    let timeCondition = '';
    
    switch (timeRange) {
      case '24h':
        timeCondition = "datetime(timestamp) >= datetime('now', '-1 day')";
        break;
      case '7d':
        timeCondition = "datetime(timestamp) >= datetime('now', '-7 days')";
        break;
      case '30d':
        timeCondition = "datetime(timestamp) >= datetime('now', '-30 days')";
        break;
      default:
        timeCondition = '1=1';
    }

    const stmt = this.db.prepare(`
      SELECT 
        model,
        COUNT(*) as count,
        SUM(input_tokens) as inputTokens,
        SUM(output_tokens) as outputTokens,
        AVG(duration_ms) as avgDuration,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successCount
      FROM request_logs
      WHERE ${timeCondition} AND model IS NOT NULL
      GROUP BY model
      ORDER BY count DESC
    `);

    return stmt.all();
  }

  // 按账号统计（Top N）
  getStatsByAccount(limit = 10, timeRange = '24h') {
    let timeCondition = '';
    
    switch (timeRange) {
      case '24h':
        timeCondition = "datetime(timestamp) >= datetime('now', '-1 day')";
        break;
      case '7d':
        timeCondition = "datetime(timestamp) >= datetime('now', '-7 days')";
        break;
      case '30d':
        timeCondition = "datetime(timestamp) >= datetime('now', '-30 days')";
        break;
      default:
        timeCondition = '1=1';
    }

    const stmt = this.db.prepare(`
      SELECT 
        account_name as accountName,
        COUNT(*) as count,
        SUM(input_tokens) as inputTokens,
        SUM(output_tokens) as outputTokens,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successCount
      FROM request_logs
      WHERE ${timeCondition}
      GROUP BY account_id, account_name
      ORDER BY count DESC
      LIMIT ?
    `);

    return stmt.all(limit);
  }

  // 获取成功率统计
  getSuccessRateStats(timeRange = '24h') {
    let timeCondition = '';
    
    switch (timeRange) {
      case '24h':
        timeCondition = "datetime(timestamp) >= datetime('now', '-1 day')";
        break;
      case '7d':
        timeCondition = "datetime(timestamp) >= datetime('now', '-7 days')";
        break;
      case '30d':
        timeCondition = "datetime(timestamp) >= datetime('now', '-30 days')";
        break;
      default:
        timeCondition = '1=1';
    }

    const stmt = this.db.prepare(`
      SELECT 
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successCount,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failureCount,
        COUNT(*) as totalCount
      FROM request_logs
      WHERE ${timeCondition}
    `);

    return stmt.get();
  }

  // Token 消耗趋势（动态聚合粒度）
  getTokenTrends(timeRange = '24h') {
    let timeCondition = '';
    let timeFormat = '';

    switch (timeRange) {
      case '24h':
        timeCondition = "datetime(timestamp, 'localtime') >= datetime('now', 'localtime', '-1 day')";
        timeFormat = '%Y-%m-%d %H:00:00'; // 按小时
        break;
      case '7d':
        timeCondition = "datetime(timestamp, 'localtime') >= datetime('now', 'localtime', '-7 days')";
        timeFormat = '%Y-%m-%d'; // 按天
        break;
      default:
        timeCondition = "datetime(timestamp, 'localtime') >= datetime('now', 'localtime', '-1 day')";
        timeFormat = '%Y-%m-%d %H:00:00';
    }

    const stmt = this.db.prepare(`
      SELECT
        strftime('${timeFormat}', timestamp, 'localtime') as hour,
        SUM(input_tokens) as inputTokens,
        SUM(output_tokens) as outputTokens
      FROM request_logs
      WHERE ${timeCondition}
      GROUP BY hour
      ORDER BY hour ASC
    `);

    return stmt.all();
  }

  // ============ 账号管理方法 ============

  // 获取所有账号
  getAllAccounts() {
    const stmt = this.db.prepare(`
      SELECT
        id,
        name,
        credentials,
        status,
        request_count as requestCount,
        error_count as errorCount,
        created_at as createdAt,
        last_used_at as lastUsedAt,
        usage
      FROM accounts
      ORDER BY created_at DESC
    `);
    return stmt.all();
  }

  // 获取单个账号
  getAccount(id) {
    const stmt = this.db.prepare(`
      SELECT
        id,
        name,
        credentials,
        status,
        request_count as requestCount,
        error_count as errorCount,
        created_at as createdAt,
        last_used_at as lastUsedAt,
        usage
      FROM accounts
      WHERE id = ?
    `);
    return stmt.get(id);
  }

  // 插入账号
  insertAccount(account) {
    const stmt = this.db.prepare(`
      INSERT INTO accounts (
        id, name, credentials, status, request_count, error_count,
        created_at, last_used_at, usage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      account.id,
      account.name,
      JSON.stringify(account.credentials),
      account.status || 'active',
      account.requestCount || 0,
      account.errorCount || 0,
      account.createdAt,
      account.lastUsedAt || null,
      account.usage ? JSON.stringify(account.usage) : null
    );
  }

  // 更新账号
  updateAccount(id, updates) {
    const fields = [];
    const values = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.requestCount !== undefined) {
      fields.push('request_count = ?');
      values.push(updates.requestCount);
    }
    if (updates.errorCount !== undefined) {
      fields.push('error_count = ?');
      values.push(updates.errorCount);
    }
    if (updates.lastUsedAt !== undefined) {
      fields.push('last_used_at = ?');
      values.push(updates.lastUsedAt);
    }
    if (updates.usage !== undefined) {
      fields.push('usage = ?');
      values.push(updates.usage ? JSON.stringify(updates.usage) : null);
    }

    if (fields.length === 0) return;

    values.push(id);
    const stmt = this.db.prepare(`
      UPDATE accounts
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    stmt.run(...values);
  }

  // 删除账号
  deleteAccount(id) {
    const stmt = this.db.prepare('DELETE FROM accounts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // 批量删除账号
  deleteAccounts(ids) {
    const stmt = this.db.prepare(`
      DELETE FROM accounts
      WHERE id = ?
    `);

    const deleteMany = this.db.transaction((ids) => {
      let deleted = 0;
      for (const id of ids) {
        const result = stmt.run(id);
        deleted += result.changes;
      }
      return deleted;
    });

    return deleteMany(ids);
  }

  // ============ 设置管理方法 ============

  // 获取设置
  getSettings() {
    const stmt = this.db.prepare('SELECT admin_key as adminKey FROM settings WHERE id = 1');
    const row = stmt.get();

    const keysStmt = this.db.prepare('SELECT key FROM api_keys ORDER BY created_at');
    const keysRows = keysStmt.all();

    return {
      adminKey: row?.adminKey || null,
      apiKeys: keysRows.map(r => r.key)
    };
  }

  // 更新管理员密钥
  updateAdminKey(adminKey) {
    const stmt = this.db.prepare(`
      INSERT INTO settings (id, admin_key)
      VALUES (1, ?)
      ON CONFLICT(id) DO UPDATE SET admin_key = excluded.admin_key
    `);
    stmt.run(adminKey);
  }

  // 添加 API 密钥
  addApiKey(key) {
    const stmt = this.db.prepare('INSERT OR IGNORE INTO api_keys (key) VALUES (?)');
    const result = stmt.run(key);
    return result.changes > 0;
  }

  // 删除 API 密钥
  removeApiKey(key) {
    const stmt = this.db.prepare('DELETE FROM api_keys WHERE key = ?');
    const result = stmt.run(key);
    return result.changes > 0;
  }

  // 列出所有 API 密钥
  listApiKeys() {
    const stmt = this.db.prepare('SELECT key FROM api_keys ORDER BY created_at');
    return stmt.all().map(r => r.key);
  }

  // 关闭数据库连接
  close() {
    if (this.db) {
      this.db.close();
      console.log('✓ 数据库连接已关闭');
    }
  }
}
