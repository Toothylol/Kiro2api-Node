// React 图表容器组件
function AnalyticsDashboard() {
    const [timeRange, setTimeRange] = React.useState('24h');

    const timeRanges = [
        { value: '24h', label: '24小时' },
        { value: '7d', label: '7天' }
    ];

    return (
        <div>
            {/* 时间范围选择器 */}
            <div className="flex justify-end mb-6 space-x-2">
                {timeRanges.map(range => (
                    <button
                        key={range.value}
                        onClick={() => setTimeRange(range.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            timeRange === range.value
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                        {range.label}
                    </button>
                ))}
            </div>

            {/* 图表网格 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 按模型统计 */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">按模型统计</h3>
                    <div className="h-80">
                        <ModelChart timeRange={timeRange} />
                    </div>
                </div>

                {/* 成功率 */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">请求成功率</h3>
                    <div className="h-80">
                        <SuccessRateChart timeRange={timeRange} />
                    </div>
                </div>

                {/* Token消耗趋势 */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Token 消耗趋势</h3>
                    <div className="h-80">
                        <TokenTrendsChart timeRange={timeRange} />
                    </div>
                </div>

                {/* Top账号 */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 账号</h3>
                    <div className="h-80">
                        <TopAccountsChart timeRange={timeRange} />
                    </div>
                </div>

                {/* API Key统计 */}
                <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">API Key 统计</h3>
                    <div className="h-80">
                        <ApiKeyStatsChart timeRange={timeRange} />
                    </div>
                </div>
            </div>
        </div>
    );
}
