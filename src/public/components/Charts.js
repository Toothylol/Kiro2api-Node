// React 图表组件 - 按模型统计
function ModelChart({ timeRange }) {
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetchApi(`/api/stats/timeseries?range=${timeRange}`);
                const data = response.data;

                if (!chartRef.current) return;

                // 销毁旧图表
                if (chartInstance.current) {
                    chartInstance.current.destroy();
                }

                // 按模型分组数据
                const modelMap = {};
                data.forEach(item => {
                    if (!modelMap[item.model]) {
                        modelMap[item.model] = [];
                    }
                    modelMap[item.model].push({ hour: item.hour, count: item.count });
                });

                // 获取所有时间点
                const hours = [...new Set(data.map(d => d.hour))].sort();
                const formattedLabels = hours.map(h => formatTimeLabel(h));

                // 生成数据集
                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
                const datasets = Object.keys(modelMap).map((model, idx) => {
                    const modelData = hours.map(hour => {
                        const found = modelMap[model].find(d => d.hour === hour);
                        return found ? found.count : 0;
                    });
                    return {
                        label: model,
                        data: modelData,
                        backgroundColor: colors[idx % colors.length] + '40',
                        borderColor: colors[idx % colors.length],
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    };
                });

                chartInstance.current = new Chart(chartRef.current, {
                    type: 'line',
                    data: { labels: formattedLabels, datasets },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                            legend: { position: 'top' },
                            tooltip: { mode: 'index', intersect: false }
                        },
                        scales: {
                            x: { stacked: true, grid: { display: false } },
                            y: { stacked: true, beginAtZero: true }
                        }
                    }
                });
            } catch (e) {
                console.error('加载图表数据失败:', e);
            }
        };

        loadData();

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [timeRange]);

    return <canvas ref={chartRef} />;
}

// React 图表组件 - 成功率
function SuccessRateChart({ timeRange }) {
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetchApi(`/api/stats/success-rate?range=${timeRange}`);
                const data = response.data;

                if (!chartRef.current) return;

                if (chartInstance.current) {
                    chartInstance.current.destroy();
                }

                const successCount = data.successCount || 0;
                const failureCount = data.failureCount || 0;
                const total = successCount + failureCount;

                chartInstance.current = new Chart(chartRef.current, {
                    type: 'doughnut',
                    data: {
                        labels: ['成功', '失败'],
                        datasets: [{
                            data: [successCount, failureCount],
                            backgroundColor: ['#10b981', '#ef4444'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const value = context.parsed;
                                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                        return `${context.label}: ${value} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            } catch (e) {
                console.error('加载图表数据失败:', e);
            }
        };

        loadData();

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [timeRange]);

    return <canvas ref={chartRef} />;
}

// React 图表组件 - Token趋势
function TokenTrendsChart({ timeRange }) {
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetchApi(`/api/stats/tokens?range=${timeRange}`);
                const data = response.data;

                if (!chartRef.current) return;

                if (chartInstance.current) {
                    chartInstance.current.destroy();
                }

                const hours = data.map(d => d.hour);
                const formattedLabels = hours.map(h => formatTimeLabel(h));
                const inputTokens = data.map(d => d.inputTokens || 0);
                const outputTokens = data.map(d => d.outputTokens || 0);

                chartInstance.current = new Chart(chartRef.current, {
                    type: 'line',
                    data: {
                        labels: formattedLabels,
                        datasets: [
                            {
                                label: '输入 Tokens',
                                data: inputTokens,
                                borderColor: '#3b82f6',
                                backgroundColor: '#3b82f640',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.4,
                                yAxisID: 'y'
                            },
                            {
                                label: '输出 Tokens',
                                data: outputTokens,
                                borderColor: '#10b981',
                                backgroundColor: '#10b98140',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.4,
                                yAxisID: 'y'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                            legend: { position: 'top' },
                            tooltip: { mode: 'index', intersect: false }
                        },
                        scales: {
                            x: { grid: { display: false } },
                            y: { beginAtZero: true, position: 'left' }
                        }
                    }
                });
            } catch (e) {
                console.error('加载图表数据失败:', e);
            }
        };

        loadData();

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [timeRange]);

    return <canvas ref={chartRef} />;
}

// React 图表组件 - Top账号
function TopAccountsChart({ timeRange }) {
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetchApi(`/api/stats/by-account?limit=10&range=${timeRange}`);
                const data = response.data;

                if (!chartRef.current) return;

                if (chartInstance.current) {
                    chartInstance.current.destroy();
                }

                const accounts = data.map(d => d.accountName);
                const counts = data.map(d => d.count);

                chartInstance.current = new Chart(chartRef.current, {
                    type: 'bar',
                    data: {
                        labels: accounts,
                        datasets: [{
                            label: '请求次数',
                            data: counts,
                            backgroundColor: '#3b82f6',
                            borderRadius: 6
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (context) => `请求次数: ${context.parsed.x}`
                                }
                            }
                        },
                        scales: {
                            x: { beginAtZero: true, grid: { display: true } },
                            y: { grid: { display: false } }
                        }
                    }
                });
            } catch (e) {
                console.error('加载图表数据失败:', e);
            }
        };

        loadData();

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [timeRange]);

    return <canvas ref={chartRef} />;
}

// React 图表组件 - API Key统计
function ApiKeyStatsChart({ timeRange }) {
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const response = await fetchApi(`/api/stats/by-api-key?limit=10&range=${timeRange}`);
                const data = response.data;

                if (!chartRef.current) return;

                if (chartInstance.current) {
                    chartInstance.current.destroy();
                }

                // 检查是否有数据
                if (!data || data.length === 0) {
                    // 显示空状态
                    chartInstance.current = new Chart(chartRef.current, {
                        type: 'bar',
                        data: {
                            labels: ['暂无数据'],
                            datasets: [{
                                label: '请求数',
                                data: [0],
                                backgroundColor: 'rgba(156, 163, 175, 0.3)'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false }
                            }
                        }
                    });
                    return;
                }

                const labels = data.map(d => {
                    if (d.apiKey) return d.apiKey;
                    if (d.apiKeyValue) return d.apiKeyValue.substring(0, 12) + '...';
                    return '未命名密钥';
                });
                const requestCounts = data.map(d => d.count || 0);
                const successRates = data.map(d => {
                    const total = d.count || 0;
                    const success = d.successCount || 0;
                    return total > 0 ? ((success / total) * 100).toFixed(1) : 0;
                });

                chartInstance.current = new Chart(chartRef.current, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: '请求数',
                                data: requestCounts,
                                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                                borderColor: 'rgb(59, 130, 246)',
                                borderWidth: 1,
                                yAxisID: 'y'
                            },
                            {
                                label: '成功率 (%)',
                                data: successRates,
                                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                                borderColor: 'rgb(34, 197, 94)',
                                borderWidth: 1,
                                yAxisID: 'y1'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top' },
                            tooltip: { mode: 'index', intersect: false }
                        },
                        scales: {
                            x: { grid: { display: false } },
                            y: { type: 'linear', display: true, position: 'left', beginAtZero: true },
                            y1: { type: 'linear', display: true, position: 'right', beginAtZero: true, max: 100, grid: { drawOnChartArea: false } }
                        }
                    }
                });
            } catch (e) {
                console.error('加载图表数据失败:', e);
            }
        };

        loadData();

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [timeRange]);

    return <canvas ref={chartRef} />;
}
