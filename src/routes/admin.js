import { Router } from 'express';
import crypto from 'crypto';

// 生成 API 密钥
function generateApiKey(prefix = 'sk') {
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes
    .toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=/g, '');
  return `${prefix}-${key}`;
}

// SSE 客户端连接池
const sseClients = new Set();

// 广播更新给所有连接的客户端
export function broadcastUpdate(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(message);
  }
}

export function createAdminRouter(state) {
  const router = Router();

  // Admin Key 认证中间件
  const authMiddleware = (req, res, next) => {
    const adminKey = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!adminKey || !state.settingsManager.verifyAdminKey(adminKey)) {
      return res.status(401).json({ error: '需要认证，请提供管理密钥' });
    }
    next();
  };

  router.use(authMiddleware);

  // SSE 实时更新端点
  router.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);
    
    // 发送初始数据
    const initialData = {
      type: 'init',
      stats: state.accountPool.getStats(),
      accounts: state.accountPool.listAccounts(),
      logStats: state.accountPool.getLogStats()
    };
    res.write(`data: ${JSON.stringify(initialData)}\n\n`);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // GET /api/status
  router.get('/status', (req, res) => {
    const stats = state.accountPool.getStats();
    res.json({
      status: 'running',
      version: '1.0.0',
      uptimeSecs: Math.floor((Date.now() - state.startTime) / 1000),
      pool: stats
    });
  });

  // GET /api/accounts
  router.get('/accounts', (req, res) => {
    res.json(state.accountPool.listAccounts());
  });

  // POST /api/accounts
  router.post('/accounts', async (req, res) => {
    try {
      const { name, refresh_token, auth_method, client_id, client_secret } = req.body;
      
      const id = await state.accountPool.addAccount({
        name,
        credentials: {
          refreshToken: refresh_token,
          authMethod: auth_method,
          clientId: client_id,
          clientSecret: client_secret
        }
      });
      
      res.status(201).json({ id });
    } catch (error) {
      res.status(400).json({ error: `凭证验证失败: ${error.message}` });
    }
  });

  // POST /api/accounts/import
  router.post('/accounts/import', async (req, res) => {
    try {
      const { raw_json, name } = req.body;
      const parsed = JSON.parse(raw_json);
      
      // 支持数组格式（批量导入）
      const accounts = Array.isArray(parsed) ? parsed : [parsed];
      const results = [];
      
      for (const raw of accounts) {
        try {
          const authMethod = (raw.clientId && raw.clientSecret) ? 'idc' : 'social';
          const accountName = raw.label || raw.email || name || '导入的账号';
          
          const id = await state.accountPool.addAccount({
            name: accountName,
            credentials: {
              refreshToken: raw.refreshToken,
              authMethod,
              clientId: raw.clientId,
              clientSecret: raw.clientSecret,
              region: raw.region,
              machineId: raw.machineId
            }
          }, true); // skipValidation = true，导入时跳过验证
          results.push({ success: true, id, name: accountName });
        } catch (e) {
          results.push({ success: false, name: raw.label || raw.email, error: e.message });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      res.status(201).json({ 
        total: accounts.length, 
        success: successCount, 
        failed: accounts.length - successCount,
        results 
      });
    } catch (error) {
      res.status(400).json({ error: `导入失败: ${error.message}` });
    }
  });

  // DELETE /api/accounts/:id
  router.delete('/accounts/:id', async (req, res) => {
    const removed = await state.accountPool.removeAccount(req.params.id);
    res.status(removed ? 204 : 404).end();
  });

  // POST /api/accounts/:id/enable
  router.post('/accounts/:id/enable', async (req, res) => {
    const success = await state.accountPool.enableAccount(req.params.id);
    res.json({ success });
  });

  // POST /api/accounts/:id/disable
  router.post('/accounts/:id/disable', async (req, res) => {
    const success = await state.accountPool.disableAccount(req.params.id);
    res.json({ success });
  });

  // POST /api/accounts/:id/refresh-usage - 刷新单个账号额度
  router.post('/accounts/:id/refresh-usage', async (req, res) => {
    try {
      const usage = await state.accountPool.refreshAccountUsage(req.params.id);
      if (!usage) {
        return res.status(404).json({ error: '账号不存在' });
      }
      res.json(usage);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // POST /api/accounts/refresh-all-usage - 刷新所有账号额度
  router.post('/accounts/refresh-all-usage', async (req, res) => {
    try {
      const results = await state.accountPool.refreshAllUsage();
      res.json(results);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // GET /api/strategy
  router.get('/strategy', (req, res) => {
    res.json({ strategy: state.accountPool.getStrategy() });
  });

  // POST /api/strategy
  router.post('/strategy', (req, res) => {
    const { strategy } = req.body;
    if (!['round-robin', 'random', 'least-used'].includes(strategy)) {
      return res.status(400).json({ error: '无效的策略' });
    }
    state.accountPool.setStrategy(strategy);
    res.json({ success: true });
  });

  // GET /api/logs - 分页获取日志
  router.get('/logs', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    // 验证pageSize
    const validPageSizes = [20, 50, 100];
    const finalPageSize = validPageSizes.includes(pageSize) ? pageSize : 20;

    const logs = state.accountPool.getRecentLogs(finalPageSize, offset);
    const stats = state.accountPool.getLogStats();
    const totalLogs = stats.totalLogs || 0;

    res.json({
      data: logs,
      pagination: {
        page,
        pageSize: finalPageSize,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / finalPageSize)
      }
    });
  });

  // GET /api/logs/stats
  router.get('/logs/stats', (req, res) => {
    res.json(state.accountPool.getLogStats());
  });

  // DELETE /api/accounts/batch - 批量删除账号
  router.delete('/accounts/batch', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: '请提供要删除的账号 ID 列表' });
    }
    const results = await state.accountPool.removeAccounts(ids);
    res.json(results);
  });

  // ============ 设置管理 API ============

  // POST /api/settings/admin-key
  router.post('/settings/admin-key', async (req, res) => {
    const { new_key } = req.body;
    if (!new_key || new_key.length < 6) {
      return res.status(400).json({ error: '密钥长度至少 6 位' });
    }
    await state.settingsManager.changeAdminKey(new_key);
    res.json({ success: true });
  });

  // GET /api/settings/api-keys
  router.get('/settings/api-keys', (req, res) => {
    const keys = state.settingsManager.listApiKeysWithDetails();
    res.json(keys);
  });

  // POST /api/settings/api-keys
  router.post('/settings/api-keys', async (req, res) => {
    const { name } = req.body;
    const key = generateApiKey();
    const added = await state.settingsManager.addApiKey(key, name || null);
    res.status(added ? 201 : 409).json({ success: added, key: added ? key : null, name: name || null, error: added ? null : '密钥创建失败' });
  });

  // DELETE /api/settings/api-keys
  router.delete('/settings/api-keys', async (req, res) => {
    const { key } = req.body;
    const removed = await state.settingsManager.removeApiKey(key);
    res.json({ success: removed, error: removed ? null : '无法删除，至少保留一个 API 密钥' });
  });

  // PATCH /api/settings/api-keys/:key - 更新密钥名称
  router.patch('/settings/api-keys/:key', async (req, res) => {
    const { key } = req.params;
    const { name } = req.body;
    const updated = await state.settingsManager.updateApiKeyName(key, name);
    res.json({ success: updated, error: updated ? null : '密钥不存在' });
  });

  // ============ 模型管理 API ============

  // GET /api/models - 获取所有模型
  router.get('/models', (req, res) => {
    const models = state.dbManager.getAllModels();
    res.json(models);
  });

  // POST /api/models - 添加模型
  router.post('/models', (req, res) => {
    try {
      const { id, displayName, maxTokens, created, ownedBy, enabled, displayOrder } = req.body;

      if (!id || !displayName) {
        return res.status(400).json({ error: 'id 和 displayName 为必填项' });
      }

      // 检查是否已存在
      const existing = state.dbManager.getModelById(id);
      if (existing) {
        return res.status(409).json({ error: '模型 ID 已存在' });
      }

      state.dbManager.addModel({
        id,
        displayName,
        maxTokens: maxTokens || 32000,
        created: created || 1727568000,
        ownedBy: ownedBy || 'anthropic',
        enabled: enabled !== undefined ? enabled : true,
        displayOrder: displayOrder || 0
      });

      res.status(201).json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // PUT /api/models/:id - 更新模型
  router.put('/models/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { displayName, maxTokens, created, ownedBy, enabled, displayOrder } = req.body;

      const updates = {};
      if (displayName !== undefined) updates.displayName = displayName;
      if (maxTokens !== undefined) updates.maxTokens = maxTokens;
      if (created !== undefined) updates.created = created;
      if (ownedBy !== undefined) updates.ownedBy = ownedBy;
      if (enabled !== undefined) updates.enabled = enabled;
      if (displayOrder !== undefined) updates.displayOrder = displayOrder;

      state.dbManager.updateModel(id, updates);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE /api/models/:id - 删除模型
  router.delete('/models/:id', (req, res) => {
    const deleted = state.dbManager.deleteModel(req.params.id);
    res.status(deleted ? 204 : 404).end();
  });

  // PATCH /api/models/:id/toggle - 切换启用状态
  router.patch('/models/:id/toggle', (req, res) => {
    const success = state.dbManager.toggleModelEnabled(req.params.id);
    res.json({ success });
  });

  // POST /api/models/reset - 重置默认模型
  router.post('/models/reset', (req, res) => {
    state.dbManager.resetDefaultModels();
    res.json({ success: true });
  });

  // ============ 模型映射管理 API ============

  // GET /api/model-mappings - 获取所有映射
  router.get('/model-mappings', (req, res) => {
    const mappings = state.dbManager.getAllModelMappings();
    res.json(mappings);
  });

  // POST /api/model-mappings - 添加映射
  router.post('/model-mappings', (req, res) => {
    try {
      const { externalPattern, internalId, matchType, priority, enabled } = req.body;

      if (!externalPattern || !internalId) {
        return res.status(400).json({ error: 'externalPattern 和 internalId 为必填项' });
      }

      // 验证正则表达式
      if (matchType === 'regex') {
        try {
          new RegExp(externalPattern, 'i');
        } catch (error) {
          return res.status(400).json({ error: '无效的正则表达式: ' + error.message });
        }
      }

      state.dbManager.addModelMapping({
        externalPattern,
        internalId,
        matchType: matchType || 'contains',
        priority: priority || 0,
        enabled: enabled !== undefined ? enabled : true
      });

      res.status(201).json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // PUT /api/model-mappings/:id - 更新映射
  router.put('/model-mappings/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { externalPattern, internalId, matchType, priority, enabled } = req.body;

      // 如果修改了正则表达式，需要验证
      if (matchType === 'regex' && externalPattern !== undefined) {
        try {
          new RegExp(externalPattern, 'i');
        } catch (error) {
          return res.status(400).json({ error: '无效的正则表达式: ' + error.message });
        }
      }

      const updates = {};
      if (externalPattern !== undefined) updates.externalPattern = externalPattern;
      if (internalId !== undefined) updates.internalId = internalId;
      if (matchType !== undefined) updates.matchType = matchType;
      if (priority !== undefined) updates.priority = priority;
      if (enabled !== undefined) updates.enabled = enabled;

      state.dbManager.updateModelMapping(id, updates);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE /api/model-mappings/:id - 删除映射
  router.delete('/model-mappings/:id', (req, res) => {
    const deleted = state.dbManager.deleteModelMapping(req.params.id);
    res.status(deleted ? 204 : 404).end();
  });

  // PATCH /api/model-mappings/:id/toggle - 切换启用状态
  router.patch('/model-mappings/:id/toggle', (req, res) => {
    const success = state.dbManager.toggleModelMappingEnabled(req.params.id);
    res.json({ success });
  });

  // POST /api/model-mappings/reset - 重置默认映射
  router.post('/model-mappings/reset', (req, res) => {
    state.dbManager.resetDefaultModelMappings();
    res.json({ success: true });
  });

  return router;
}
