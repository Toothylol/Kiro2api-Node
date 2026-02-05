// 账号管理服务层
window.accountsService = {
    // 获取所有账号
    async fetchAccounts() {
        return await fetchApi('/api/accounts');
    },

    // 创建账号
    async createAccount(payload) {
        return await fetchApi('/api/accounts', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },

    // 删除账号
    async deleteAccount(id) {
        return await fetchApi(`/api/accounts/${id}`, {
            method: 'DELETE'
        });
    },

    // 启用账号
    async enableAccount(id) {
        return await fetchApi(`/api/accounts/${id}/enable`, {
            method: 'POST'
        });
    },

    // 禁用账号
    async disableAccount(id) {
        return await fetchApi(`/api/accounts/${id}/disable`, {
            method: 'POST'
        });
    },

    // 刷新单个账号额度
    async refreshAccountUsage(id) {
        return await fetchApi(`/api/accounts/${id}/refresh-usage`, {
            method: 'POST'
        });
    },

    // 刷新所有账号额度
    async refreshAllAccountUsage() {
        return await fetchApi('/api/accounts/refresh-all-usage', {
            method: 'POST'
        });
    },

    // 批量删除账号
    async batchDeleteAccounts(ids) {
        return await fetchApi('/api/accounts/batch', {
            method: 'DELETE',
            body: JSON.stringify({ ids })
        });
    },

    // 导入账号
    async importAccounts(accounts) {
        return await fetchApi('/api/accounts/import', {
            method: 'POST',
            body: JSON.stringify({ accounts })
        });
    },

    // 获取策略
    async getStrategy() {
        return await fetchApi('/api/strategy');
    },

    // 设置策略
    async setStrategy(strategy) {
        return await fetchApi('/api/strategy', {
            method: 'POST',
            body: JSON.stringify({ strategy })
        });
    }
};
