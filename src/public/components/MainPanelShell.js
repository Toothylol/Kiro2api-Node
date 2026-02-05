window.MainPanelShell = function MainPanelShell() {
    return (
        <div id="mainPanel" className="hidden">
            <div id="top-nav-bar"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
                <div id="stats-grid"></div>
                <window.TabsCardShell />
            </div>
        </div>
    );
};
