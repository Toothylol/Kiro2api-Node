window.LogsTable = function(props) {
    if (!props.logs || props.logs.length === 0) {
        return <div className="text-center py-12 text-gray-500">暂无请求记录</div>;
    }

    return (
        <table className="w-full">
            <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 rounded-tl-lg">时间</th>
                    <th className="px-4 py-3">账号</th>
                    <th className="px-4 py-3">类型</th>
                    <th className="px-4 py-3">模型</th>
                    <th className="px-4 py-3">密钥</th>
                    <th className="px-4 py-3">输入</th>
                    <th className="px-4 py-3">输出</th>
                    <th className="px-4 py-3">耗时</th>
                    <th className="px-4 py-3 rounded-tr-lg">状态</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {props.logs.map((l, i) => {
                    const streamTag = l.stream === null 
                        ? <span className="text-gray-400">--</span>
                        : l.stream === 1 
                            ? <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">流式</span>
                            : <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">非流式</span>;
                    
                    return (
                        <tr key={i} className={`hover:bg-gray-50 transition ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                            <td className="px-4 py-3 text-sm text-gray-600">{new Date(l.timestamp).toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{l.accountName}</td>
                            <td className="px-4 py-3">{streamTag}</td>
                            <td className="px-4 py-3 text-xs text-gray-500" dangerouslySetInnerHTML={{ __html: formatModelDisplay(l.model, l.upstreamModel) }}></td>
                            <td className="px-4 py-3 text-xs text-gray-600">{l.apiKeyName || <span className="text-gray-400">--</span>}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{l.inputTokens || 0}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{l.outputTokens || 0}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{l.durationMs}ms</td>
                            <td className="px-4 py-3">
                                {l.success ? (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">成功</span>
                                ) : (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">失败</span>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};
