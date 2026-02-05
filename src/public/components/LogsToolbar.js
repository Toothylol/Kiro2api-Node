window.LogsToolbar = function(props) {
    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">请求记录</h2>
                <div className="flex gap-3 items-center">
                    <button onClick={props.onRefresh} className="border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 transition">刷新</button>
                    <label className="flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={props.autoRefresh}
                            onChange={props.onToggleAutoRefresh}
                            className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-700">自动刷新</span>
                    </label>
                </div>
            </div>
            <div id="logs-table" className="overflow-x-auto"></div>
            
            {/* 分页器 */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">共 {props.totalRecords} 条记录</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">每页显示：</span>
                        <select 
                            value={props.pageSize}
                            onChange={(e) => props.onPageSizeChange(Number(e.target.value))}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => props.onPageChange(-1)}
                        disabled={props.currentPage <= 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        上一页
                    </button>
                    <span className="text-sm text-gray-600">第 {props.currentPage} 页 / 共 {props.totalPages} 页</span>
                    <button 
                        onClick={() => props.onPageChange(1)}
                        disabled={props.currentPage >= props.totalPages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        下一页
                    </button>
                </div>
            </div>
        </>
    );
};
