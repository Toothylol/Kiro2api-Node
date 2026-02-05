window.RenameApiKeyModal = function RenameApiKeyModal() {
    return (
        <div id="renameApiKeyModal" className="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-scaleIn">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">重命名 API 密钥</h3>
                    <button onClick={() => hideModal('renameApiKeyModal')} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div className="p-6">
                    <input type="text" id="rename-key-name" placeholder="输入新的密钥名称" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
                    <button onClick={() => hideModal('renameApiKeyModal')} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">取消</button>
                    <button onClick={() => confirmRenameApiKey()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition">确认</button>
                </div>
            </div>
        </div>
    );
};
