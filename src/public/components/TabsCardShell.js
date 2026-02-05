window.TabsCardShell = function TabsCardShell() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div id="main-tabs"></div>
            <AccountsTabShell />
            <LogsTabShell />
            <AnalyticsTabShell />
            <SettingsTabShell />
        </div>
    );
};
