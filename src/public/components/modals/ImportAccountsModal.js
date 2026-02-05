window.ImportAccountsModal = function ImportAccountsModal() {
    return (
        <div id="importModal" className="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 animate-scaleIn">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">批量导入账号</h3>
                    <button onClick={() => hideModal('importModal')} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-4">支持导入 JSON 文件或粘贴 JSON 内容</p>
                    <input type="file" id="import-file" accept=".json" className="hidden" onChange={handleFileSelect} />
                    <button onClick={() => document.getElementById('import-file').click()} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border-2 border-dashed border-blue-200 rounded-lg py-4 text-sm font-medium transition mb-2">选择 JSON 文件</button>
                    <div id="file-name" className="text-sm text-gray-500 mb-4"></div>
                    <div className="text-center text-gray-400 text-sm mb-4">— 或者 —</div>
                    <textarea id="import-json" placeholder="粘贴 JSON 内容" rows="6" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"></textarea>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
                    <button onClick={() => hideModal('importModal')} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">取消</button>
                    <button onClick={() => importAccounts()} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition">开始导入</button>
                </div>
            </div>
        </div>
    );
};
