window.SettingsPanel = function(props) {
    const subTabs = [
        { id: 'general', label: '常规设置' },
        { id: 'models', label: '模型管理' },
        { id: 'mappings', label: '模型映射' }
    ];

    return (
        <>
            {/* 子标签导航 */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="flex space-x-8">
                    {subTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => props.onSubTabChange(tab.id)}
                            className={`settings-tab-btn py-2 px-1 border-b-2 font-medium text-sm ${
                                props.activeSubTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* 常规设置 */}
            <div className={`settings-content ${props.activeSubTab !== 'general' ? 'hidden' : ''}`}>
                <div className="max-w-2xl">
                    {/* API 端点信息 */}
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">API 端点</h3>
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2 font-medium">Anthropic 格式</p>
                            <div className="space-y-2 font-mono text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">GET</span>
                                    <span className="text-gray-700">/v1/models</span>
                                    <button onClick={() => copyText(location.origin + '/v1/models')} className="text-blue-500 hover:text-blue-700 text-xs">复制</button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">POST</span>
                                    <span className="text-gray-700">/v1/messages</span>
                                    <button onClick={() => copyText(location.origin + '/v1/messages')} className="text-blue-500 hover:text-blue-700 text-xs">复制</button>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">Base URL: <span className="text-gray-700">{props.baseUrl}</span></p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">管理密钥</h3>
                        <p className="text-sm text-gray-500 mb-4">用于登录管理面板</p>
                        <div className="flex gap-3">
                            <input type="password" id="new-admin-key" placeholder="输入新的管理密钥" className="flex-1 max-w-xs px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <button onClick={props.onChangeAdminKey} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">修改密钥</button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">API 密钥</h3>
                        <p className="text-sm text-gray-500 mb-4">用于 API 调用认证，支持多个</p>
                        <div className="flex gap-3 mb-4">
                            <button onClick={props.onCreateApiKey} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">创建密钥</button>
                            <button onClick={props.onLoadApiKeys} className="border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 transition">刷新</button>
                        </div>
                        <div id="api-keys-list"></div>
                    </div>
                </div>
            </div>

            {/* 模型管理 */}
            <div className={`settings-content ${props.activeSubTab !== 'models' ? 'hidden' : ''}`}>
                <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">模型列表</h3>
                    <div className="flex gap-2">
                        <button onClick={props.onAddModel} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">添加模型</button>
                        <button onClick={props.onResetModels} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">重置默认</button>
                        <button onClick={props.onLoadModels} className="border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 transition">刷新</button>
                    </div>
                </div>
                <div id="models-table" className="bg-white rounded-lg shadow overflow-hidden"></div>
            </div>

            {/* 模型映射 */}
            <div className={`settings-content ${props.activeSubTab !== 'mappings' ? 'hidden' : ''}`}>
                <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">映射规则</h3>
                    <div className="flex gap-2">
                        <button onClick={props.onAddMapping} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">添加映射</button>
                        <button onClick={props.onResetMappings} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">重置默认</button>
                        <button onClick={props.onLoadMappings} className="border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 transition">刷新</button>
                    </div>
                </div>
                <div id="mappings-table" className="bg-white rounded-lg shadow overflow-hidden"></div>
            </div>
        </>
    );
};
