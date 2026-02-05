import express from 'express';

export function createStatsRouter(state) {
  const router = express.Router();
  const { dbManager } = state;

  // 时间序列统计（按小时聚合）
  router.get('/timeseries', (req, res) => {
    try {
      const timeRange = req.query.range || '24h';
      const data = dbManager.getTimeSeriesStats(timeRange);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 按模型统计
  router.get('/by-model', (req, res) => {
    try {
      const timeRange = req.query.range || '24h';
      const data = dbManager.getStatsByModel(timeRange);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 按账号统计（Top N）
  router.get('/by-account', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const timeRange = req.query.range || '24h';
      const data = dbManager.getStatsByAccount(limit, timeRange);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 成功率统计
  router.get('/success-rate', (req, res) => {
    try {
      const timeRange = req.query.range || '24h';
      const data = dbManager.getSuccessRateStats(timeRange);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Token 消耗趋势
  router.get('/tokens', (req, res) => {
    try {
      const timeRange = req.query.range || '24h';
      const data = dbManager.getTokenTrends(timeRange);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 按 API 密钥统计
  router.get('/by-api-key', (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const timeRange = req.query.range || '24h';
      const data = dbManager.getStatsByApiKey(limit, timeRange);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
