window.TopNavBar = function(props) {
    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-gray-900">Kiro2api-Node</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={props.onLogout} className="text-gray-500 hover:text-gray-700 text-sm font-medium transition">退出登录</button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
