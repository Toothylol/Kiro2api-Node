window.AccountsTable = function(props) {
    if (!props.accounts || props.accounts.length === 0) {
        return <div className="text-center py-12 text-gray-500">暂无账号，点击上方按钮添加</div>;
    }

    return (
        <table className="w-full">
            <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 rounded-tl-lg w-10">
                        <input 
                            type="checkbox" 
                            id="selectAll" 
                            onChange={(e) => props.onSelectAll(e.target.checked)} 
                            className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                    </th>
                    <th className="px-4 py-3">名称</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">额度</th>
                    <th className="px-4 py-3">请求</th>
                    <th className="px-4 py-3">错误</th>
                    <th className="px-4 py-3 rounded-tr-lg">操作</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {props.accounts.map((a, i) => (
                    <tr key={a.id} className={`hover:bg-gray-50 transition ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                        <td className="px-4 py-4">
                            <input 
                                type="checkbox" 
                                data-id={a.id}
                                checked={props.selectedAccounts.has(a.id)}
                                onChange={(e) => props.onToggleSelect(a.id, e.target.checked)} 
                                className="account-checkbox rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                        </td>
                        <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">{a.name}</div>
                            {a.usage?.userEmail && <div className="text-xs text-gray-500">{a.usage.userEmail}</div>}
                        </td>
                        <td className="px-4 py-4" dangerouslySetInnerHTML={{ __html: formatStatus(a.status) }}></td>
                        <td className="px-4 py-4" dangerouslySetInnerHTML={{ __html: formatUsage(a.usage) }}></td>
                        <td className="px-4 py-4 text-gray-600">{a.requestCount}</td>
                        <td className="px-4 py-4 text-gray-600">{a.errorCount}</td>
                        <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                                <button onClick={() => props.onRefreshUsage(a.id)} className="text-blue-500 hover:text-blue-700 text-sm" title="刷新额度">🔄</button>
                                {a.status === 'disabled' ? (
                                    <button onClick={() => props.onEnable(a.id)} className="text-green-500 hover:text-green-700 text-sm font-medium">启用</button>
                                ) : (
                                    <button onClick={() => props.onDisable(a.id)} className="text-gray-500 hover:text-gray-700 text-sm font-medium">禁用</button>
                                )}
                                <button onClick={() => props.onRemove(a.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">删除</button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
