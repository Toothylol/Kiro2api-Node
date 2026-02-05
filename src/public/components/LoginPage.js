// React 登录组件
function LoginPage({ onLoginSuccess }) {
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState(false);

    const handleLogin = async () => {
        if (!password.trim()) {
            setError(true);
            return;
        }
        try {
            const res = await fetch('/api/status', {
                headers: { 'Authorization': 'Bearer ' + password }
            });
            if (res.ok) {
                adminKey = password;
                localStorage.setItem('kiro_admin_key', password);
                onLoginSuccess();
            } else {
                setError(true);
            }
        } catch {
            setError(true);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleLogin();
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Kiro2api-Node</h1>
                <p className="text-gray-500 mt-2">请输入管理密钥登录</p>
            </div>
            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">密钥错误，请重试</div>
            )}
            <input
                type="password"
                placeholder="管理密钥"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition mb-4"
            />
            <button
                onClick={handleLogin}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition duration-200"
            >
                登录
            </button>
        </div>
    );
}
