import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = 'settings.json';

export class SettingsManager {
  constructor(dataDir, db = null) {
    this.dataDir = dataDir;
    this.db = db;
    this.settings = {
      adminKey: '',
      apiKeys: new Set()
    };
  }

  async init(defaultAdminKey, defaultApiKey) {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });

      // 从数据库加载设置
      if (this.db) {
        const loaded = this.db.getSettings();
        if (loaded.adminKey) {
          this.settings.adminKey = loaded.adminKey;
          this.settings.apiKeys = new Set(loaded.apiKeys || []);
          console.log('✓ 从数据库加载了系统设置');
        } else {
          // 数据库中没有设置，使用默认值
          this.settings.adminKey = defaultAdminKey;
          this.settings.apiKeys.add(defaultApiKey);
          this.db.updateAdminKey(defaultAdminKey);
          this.db.addApiKey(defaultApiKey);
          console.log('✓ 使用默认值初始化系统设置');
        }
      }
    } catch (e) {
      console.error('初始化设置失败:', e);
    }
  }

  async save() {
    // 保留空实现以向后兼容，实际数据操作直接写入数据库
  }

  verifyAdminKey(key) {
    return this.settings.adminKey === key;
  }

  verifyApiKey(key) {
    return this.settings.apiKeys.has(key);
  }

  async changeAdminKey(newKey) {
    this.settings.adminKey = newKey;
    if (this.db) {
      this.db.updateAdminKey(newKey);
    }
  }

  async addApiKey(key, name = null) {
    if (this.settings.apiKeys.has(key)) return false;
    this.settings.apiKeys.add(key);
    if (this.db) {
      return this.db.addApiKey(key, name) > 0;
    }
    return true;
  }

  async updateApiKeyName(key, name) {
    if (!this.settings.apiKeys.has(key)) return false;
    if (this.db) {
      return this.db.updateApiKeyName(key, name);
    }
    return false;
  }

  async removeApiKey(key) {
    if (this.settings.apiKeys.size <= 1) return false;
    const removed = this.settings.apiKeys.delete(key);
    if (removed && this.db) {
      return this.db.removeApiKey(key);
    }
    return removed;
  }

  listApiKeys() {
    return Array.from(this.settings.apiKeys);
  }

  listApiKeysWithDetails() {
    if (this.db) {
      return this.db.listApiKeysWithDetails();
    }
    return Array.from(this.settings.apiKeys).map(key => ({ key, name: null, createdAt: null }));
  }
}
