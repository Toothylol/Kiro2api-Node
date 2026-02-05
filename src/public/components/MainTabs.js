window.MainTabs = function(props) {
    const tabs = [
        { id: 'accounts', label: '账号管理' },
        { id: 'logs', label: '请求记录' },
        { id: 'analytics', label: '数据分析' },
        { id: 'settings', label: '设置' }
    ];

    return (
        <div className="border-b border-gray-100">
            <nav className="flex space-x-8 px-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => props.onTabChange(tab.id)}
                        className={`tab-btn border-b-2 py-4 px-1 text-sm font-medium ${
                            props.activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                        data-tab={tab.id}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
};
