/**
 * 数据迁移脚本：初始化模型管理和映射表
 */
export async function migrateModels(dbManager, dataDir) {
  try {
    // 检查表是否已有数据
    const modelsCount = dbManager.db.prepare('SELECT COUNT(*) as count FROM models').get().count;
    const mappingsCount = dbManager.db.prepare('SELECT COUNT(*) as count FROM model_mappings').get().count;

    if (modelsCount > 0 && mappingsCount > 0) {
      console.log('⚠ 模型数据已存在，跳过初始化');
      return { migrated: 0, skipped: true };
    }

    console.log('📦 开始初始化模型数据...');

    // 使用事务插入默认数据
    const migrate = dbManager.db.transaction(() => {
      // 插入默认模型
      const modelStmt = dbManager.db.prepare(`
        INSERT OR IGNORE INTO models (id, display_name, max_tokens, created, owned_by, enabled, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const defaultModels = [
        ['claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5', 32000, 1727568000, 'anthropic', 1, 1],
        ['claude-opus-4-5-20251101', 'Claude Opus 4.5', 32000, 1730419200, 'anthropic', 1, 2],
        ['claude-haiku-4-5-20251001', 'Claude Haiku 4.5', 32000, 1727740800, 'anthropic', 1, 3]
      ];

      for (const model of defaultModels) {
        modelStmt.run(...model);
      }

      // 插入默认映射规则
      const mappingStmt = dbManager.db.prepare(`
        INSERT OR IGNORE INTO model_mappings (external_pattern, internal_id, match_type, priority, enabled)
        VALUES (?, ?, ?, ?, ?)
      `);

      const defaultMappings = [
        ['sonnet', 'claude-sonnet-4.5', 'contains', 10, 1],
        ['opus', 'claude-sonnet-4.5', 'contains', 10, 1],
        ['haiku', 'claude-haiku-4.5', 'contains', 10, 1]
      ];

      for (const mapping of defaultMappings) {
        mappingStmt.run(...mapping);
      }
    });

    migrate();

    console.log('✓ 成功初始化模型数据到数据库');

    return { migrated: 1, skipped: false };
  } catch (error) {
    console.error('❌ 模型数据初始化失败:', error.message);
    return { migrated: 0, skipped: false, error: error.message };
  }
}
