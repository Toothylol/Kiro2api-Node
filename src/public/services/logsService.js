// 请求记录服务层
window.logsService = {
    // 获取请求记录（分页）
    async fetchLogs({ page = 1, pageSize = 20 } = {}) {
        const response = await fetchApi(`/api/logs?page=${page}&pageSize=${pageSize}`);
        return {
            data: response.data || [],
            pagination: response.pagination || {
                page: 1,
                pageSize: 20,
                total: 0,
                totalPages: 1
            }
        };
    },

    // 获取日志统计
    async fetchLogsStats() {
        return await fetchApi('/api/logs/stats');
    }
};
