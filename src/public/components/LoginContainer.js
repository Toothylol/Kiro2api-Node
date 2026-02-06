window.LoginContainer = function LoginContainer() {
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const checkAuth = async () => {
            const adminKey = localStorage.getItem('kiro_admin_key') || '';
            if (adminKey) {
                try {
                    const res = await fetch('/api/status', {
                        headers: { 'Authorization': 'Bearer ' + adminKey }
                    });
                    if (res.ok) {
                        window.adminKey = adminKey;
                        setIsLoggedIn(true);
                        setIsLoading(false);
                        // 触发主面板显示
                        setTimeout(() => window.showMainPanel && window.showMainPanel(), 0);
                        return;
                    } else {
                        localStorage.removeItem('kiro_admin_key');
                    }
                } catch (e) {
                    console.error('Auth check failed:', e);
                }
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
        window.showMainPanel && window.showMainPanel();
        window.showToast && window.showToast('登录成功', 'success');
    };

    if (isLoading) {
        return (
            <div id="loginPage" className="min-h-screen flex items-center justify-center animate-fadeIn">
                <div className="text-gray-500">加载中...</div>
            </div>
        );
    }

    if (isLoggedIn) {
        return <div id="loginPage" className="hidden"></div>;
    }

    return (
        <div id="loginPage" className="min-h-screen flex items-center justify-center animate-fadeIn">
            <LoginPage onLoginSuccess={handleLoginSuccess} />
        </div>
    );
};
