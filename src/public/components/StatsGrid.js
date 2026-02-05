// React 统计卡片组件
function StatCard({ value, label, colorClass = 'text-gray-900' }) {
    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`text-2xl font-bold ${colorClass}`}>{value || '-'}</div>
            <div className="text-sm text-gray-500">{label}</div>
        </div>
    );
}

// React 统计卡片容器组件
function StatsGrid() {
    const [stats, setStats] = React.useState({
        active: '-',
        cooldown: '-',
        invalid: '-',
        requests: '-',
        input: '-',
        output: '-',
        uptime: '-'
    });

    const loadStatsData = async () => {
        try {
            const data = await fetchApi('/api/status');
            const logStats = await fetchApi('/api/logs/stats');

            serverStartTime = Date.now() - (data.uptimeSecs * 1000);

            setStats({
                active: data.pool.active,
                cooldown: data.pool.cooldown,
                invalid: data.pool.invalid,
                requests: formatNumber(data.pool.totalRequests),
                input: formatNumber(logStats.totalInputTokens || 0),
                output: formatNumber(logStats.totalOutputTokens || 0),
                uptime: formatUptime(data.uptimeSecs)
            });
        } catch (e) {
            console.error(e);
        }
    };

    // 每5秒刷新数据
    React.useEffect(() => {
        loadStatsData();
        const interval = setInterval(loadStatsData, 5000);
        return () => clearInterval(interval);
    }, []);

    // 每秒更新uptime显示
    React.useEffect(() => {
        const uptimeTimer = setInterval(() => {
            if (serverStartTime) {
                const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
                setStats(prev => ({ ...prev, uptime: formatUptime(uptime) }));
            }
        }, 1000);
        return () => clearInterval(uptimeTimer);
    }, []);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <StatCard value={stats.active} label="活跃账号" colorClass="text-gray-900" />
            <StatCard value={stats.cooldown} label="冷却中" colorClass="text-yellow-500" />
            <StatCard value={stats.invalid} label="已失效" colorClass="text-red-500" />
            <StatCard value={stats.requests} label="总请求" colorClass="text-gray-900" />
            <StatCard value={stats.input} label="输入Tokens" colorClass="text-blue-500" />
            <StatCard value={stats.output} label="输出Tokens" colorClass="text-green-500" />
            <StatCard value={stats.uptime} label="运行时间" colorClass="text-purple-500" />
        </div>
    );
}
