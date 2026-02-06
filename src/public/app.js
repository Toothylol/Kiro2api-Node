// 首页入口脚本
function renderPageShell() {
    const rootEl = document.getElementById("app");
    if (!rootEl) return;

    // 检查所有必需的依赖是否已加载
    const requiredDeps = ['React', 'ReactDOM', 'PageShell', 'LoginContainer', 'MainPanelShell', 'ToastContainer', 'ModalsRoot'];
    const missingDeps = requiredDeps.filter(dep => !window[dep]);

    if (missingDeps.length > 0) {
        console.warn('等待依赖加载:', missingDeps);
        return;
    }

    const root = ReactDOM.createRoot(rootEl);
    root.render(<PageShell />);
}

// 等待所有资源加载完成后再渲染
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // 使用 setTimeout 确保 Babel 编译完成
        setTimeout(renderPageShell, 100);
    });
} else {
    setTimeout(renderPageShell, 100);
}

const { useState, useEffect, useRef } = React;



        window.adminKey = localStorage.getItem('kiro_admin_key') || '';
        let adminKey = window.adminKey;
        let selectedAccounts = new Set();
        let autoRefreshInterval = null;
        let serverStartTime = null;
        let uptimeInterval = null;

        function toggleAutoRefresh() {
            autoRefreshEnabled = !autoRefreshEnabled;
            if (autoRefreshEnabled) {
                autoRefreshInterval = setInterval(() => {
                    loadLogs();
                }, 5000);
                showToast('已开启自动刷新', 'success');
            } else {
                if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                    autoRefreshInterval = null;
                }
                showToast('已关闭自动刷新', 'info');
            }
            renderLogsToolbar();
        }

        function startUptimeCounter() {
            if (uptimeInterval) {
                clearInterval(uptimeInterval);
            }
            uptimeInterval = setInterval(() => {
                if (serverStartTime) {
                    const uptime = Math.floor((Date.now() - serverStartTime) / 1000);
                    const uptimeEl = document.getElementById('stat-uptime');
                    if (uptimeEl) {
                        uptimeEl.textContent = formatUptime(uptime);
                    }
                }
            }, 1000);
        }

        function logout() {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
            }
            if (uptimeInterval) {
                clearInterval(uptimeInterval);
                uptimeInterval = null;
            }
            adminKey = '';
            window.adminKey = '';
            localStorage.removeItem('kiro_admin_key');
            // 重新加载页面以重置状态
            window.location.reload();
        }

        let currentActiveTab = 'accounts';
        let currentStrategy = 'round-robin';
        let currentSettingsTab = 'general';
        let autoRefreshEnabled = false;
        let accountsTableRoot = null;
        let logsTableRoot = null;
        let currentAccountsData = [];
        let topNavRoot = null;
        let mainTabsRoot = null;
        let accountsToolbarRoot = null;
        let logsToolbarRoot = null;
        let settingsPanelRoot = null;

        window.showMainPanel = function showMainPanel() {
            const mainPanel = document.getElementById('mainPanel');
            if (mainPanel) {
                mainPanel.classList.remove('hidden');
            }

            // 渲染 TopNavBar
            const topNavContainer = document.getElementById('top-nav-bar');
            if (topNavContainer) {
                if (!topNavRoot) {
                    topNavRoot = ReactDOM.createRoot(topNavContainer);
                }
                topNavRoot.render(<TopNavBar onLogout={logout} />);
            }

            // 渲染 MainTabs
            const mainTabsContainer = document.getElementById('main-tabs');
            if (mainTabsContainer) {
                if (!mainTabsRoot) {
                    mainTabsRoot = ReactDOM.createRoot(mainTabsContainer);
                }
                mainTabsRoot.render(<MainTabs activeTab={currentActiveTab} onTabChange={switchTab} />);
            }

            // 渲染React统计卡片
            const statsGridRoot = document.getElementById('stats-grid');
            if (statsGridRoot && !statsGridRoot.hasChildNodes()) {
                const root = ReactDOM.createRoot(statsGridRoot);
                root.render(<StatsGrid />);
            }

            // 渲染 AccountsToolbar
            renderAccountsToolbar();

            // 渲染 LogsToolbar
            renderLogsToolbar();

            // 渲染 SettingsPanel
            renderSettingsPanel();

            refresh();
        }

        function renderMainTabs() {
            const mainTabsContainer = document.getElementById('main-tabs');
            if (mainTabsContainer) {
                if (!mainTabsRoot) {
                    mainTabsRoot = ReactDOM.createRoot(mainTabsContainer);
                }
                mainTabsRoot.render(<MainTabs activeTab={currentActiveTab} onTabChange={switchTab} />);
            }
        }

        function renderAccountsToolbar() {
            const toolbarContainer = document.getElementById('accounts-toolbar');
            if (toolbarContainer) {
                if (!accountsToolbarRoot) {
                    accountsToolbarRoot = ReactDOM.createRoot(toolbarContainer);
                }
                accountsToolbarRoot.render(<AccountsToolbar 
                    onAdd={() => showModal('addModal')}
                    onImport={() => showModal('importModal')}
                    onRefreshAll={refreshAllUsage}
                    onBatchDelete={batchDeleteAccounts}
                    selectedCount={selectedAccounts.size}
                    strategy={currentStrategy}
                    onStrategyChange={setStrategy}
                    onRefresh={refresh}
                />);
            }
        }

        function renderLogsToolbar() {
            const toolbarContainer = document.getElementById('logs-toolbar');
            if (toolbarContainer) {
                if (!logsToolbarRoot) {
                    logsToolbarRoot = ReactDOM.createRoot(toolbarContainer);
                }
                logsToolbarRoot.render(<LogsToolbar 
                    onRefresh={loadLogs}
                    autoRefresh={autoRefreshEnabled}
                    onToggleAutoRefresh={toggleAutoRefresh}
                    currentPage={currentPage}
                    pageSize={currentPageSize}
                    totalPages={totalPages}
                    totalRecords={totalRecords}
                    onPageChange={changePage}
                    onPageSizeChange={changePageSize}
                />);
            }
        }

        function renderSettingsPanel() {
            const panelContainer = document.getElementById('settings-panel');
            if (panelContainer) {
                if (!settingsPanelRoot) {
                    settingsPanelRoot = ReactDOM.createRoot(panelContainer);
                }
                settingsPanelRoot.render(<SettingsPanel 
                    activeSubTab={currentSettingsTab}
                    onSubTabChange={switchSettingsTab}
                    baseUrl={location.origin}
                    onChangeAdminKey={changeAdminKey}
                    onCreateApiKey={() => showModal('createApiKeyModal')}
                    onLoadApiKeys={loadApiKeys}
                    onAddModel={() => showModal('addModelModal')}
                    onResetModels={resetModels}
                    onLoadModels={loadModels}
                    onAddMapping={() => showModal('addMappingModal')}
                    onResetMappings={resetMappings}
                    onLoadMappings={loadMappings}
                />);
            }
        }

        function renderAccountsTable(accounts) {
            currentAccountsData = accounts;
            const tableRoot = document.getElementById('accounts-table');
            if (tableRoot) {
                if (!accountsTableRoot) {
                    accountsTableRoot = ReactDOM.createRoot(tableRoot);
                }
                accountsTableRoot.render(<AccountsTable 
                    accounts={accounts}
                    selectedAccounts={selectedAccounts}
                    onToggleSelect={toggleSelect}
                    onSelectAll={toggleSelectAll}
                    onRefreshUsage={refreshUsage}
                    onEnable={enableAccount}
                    onDisable={disableAccount}
                    onRemove={removeAccount}
                />);
            }
        }

        function renderLogsTable(logs) {
            const tableRoot = document.getElementById('logs-table');
            if (tableRoot) {
                if (!logsTableRoot) {
                    logsTableRoot = ReactDOM.createRoot(tableRoot);
                }
                logsTableRoot.render(<LogsTable logs={logs} />);
            }
        }

        async function loadStatus() {
            // 统计数据现在由React StatsGrid组件自动管理
            // 保留此函数以兼容其他调用，但不再更新DOM
            try {
                const data = await fetchApi('/api/status');
                serverStartTime = Date.now() - (data.uptimeSecs * 1000);
                startUptimeCounter();
            } catch (e) {
                console.error(e);
            }
        }

        async function loadAccounts() {
            try {
                const accounts = await fetchApi('/api/accounts');
                selectedAccounts.clear();
                updateBatchDeleteBtn();
                renderAccountsTable(accounts);
            } catch (e) { console.error(e); }
        }

        function toggleSelect(id, checked) {
            if (checked) selectedAccounts.add(id);
            else selectedAccounts.delete(id);
            updateBatchDeleteBtn();
            loadAccounts();
        }

        function toggleSelectAll(checked) {
            const accounts = window.currentAccountsData || [];
            accounts.forEach(acc => {
                if (checked) selectedAccounts.add(acc.id);
                else selectedAccounts.delete(acc.id);
            });
            updateBatchDeleteBtn();
            loadAccounts();
        }

        function updateBatchDeleteBtn() {
            renderAccountsToolbar();
        }

        async function batchDeleteAccounts() {
            if (selectedAccounts.size === 0) return;
            if (!confirm(`确定删除选中的 ${selectedAccounts.size} 个账号？`)) return;
            try {
                const result = await fetchApi('/api/accounts/batch', { method: 'DELETE', body: JSON.stringify({ ids: Array.from(selectedAccounts) }) });
                showToast(`成功删除 ${result.removed} 个账号`, 'success');
                refresh();
            } catch (e) { showToast('批量删除失败: ' + e.message, 'error'); }
        }

        // 分页状态
        let currentPage = 1;
        let currentPageSize = 20;
        let totalPages = 1;
        let totalRecords = 0;

        async function refreshUsage(id) {
            try { await fetchApi(`/api/accounts/${id}/refresh-usage`, { method: 'POST' }); loadAccounts(); showToast('刷新成功', 'success'); }
            catch (e) { showToast('刷新失败: ' + e.message, 'error'); }
        }

        async function refreshAllUsage() {
            try { showToast('正在刷新...', 'info'); await fetchApi('/api/accounts/refresh-all-usage', { method: 'POST' }); loadAccounts(); showToast('刷新完成！', 'success'); }
            catch (e) { showToast('刷新失败: ' + e.message, 'error'); }
        }

        async function loadLogs() {
            try {
                const response = await fetchApi(`/api/logs?page=${currentPage}&pageSize=${currentPageSize}`);
                const logs = response.data || [];
                const pagination = response.pagination || {};
                
                totalPages = pagination.totalPages || 1;
                totalRecords = pagination.total || 0;
                
                renderLogsTable(logs);
                updatePaginationUI();
            } catch (e) { showToast('加载失败: ' + e.message, 'error'); }
        }

        function updatePaginationUI() {
            renderLogsToolbar();
        }

        function changePage(delta) {
            const newPage = currentPage + delta;
            if (newPage < 1 || newPage > totalPages) return;
            currentPage = newPage;
            loadLogs();
        }

        function changePageSize(size) {
            currentPageSize = size;
            currentPage = 1;
            loadLogs();
        }

        async function loadStrategy() {
            try { 
                const data = await fetchApi('/api/strategy'); 
                currentStrategy = data.strategy;
                renderAccountsToolbar();
            }
            catch (e) { console.error(e); }
        }

        async function setStrategy(value) {
            try { 
                await fetchApi('/api/strategy', { method: 'POST', body: JSON.stringify({ strategy: value }) }); 
                currentStrategy = value;
                showToast('策略已更新', 'success'); 
            }
            catch (e) { showToast('设置失败: ' + e.message, 'error'); }
        }

        function switchTab(tab) {
            currentActiveTab = tab;
            renderMainTabs();
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById('tab-' + tab).classList.remove('hidden');
            if (tab === 'logs') {
                loadLogs();
                const toggle = document.getElementById('autoRefreshToggle');
                if (toggle && toggle.checked && !autoRefreshInterval) {
                    autoRefreshInterval = setInterval(() => { loadLogs(); }, 5000);
                }
            } else {
                if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                    autoRefreshInterval = null;
                }
            }
            if (tab === 'analytics') {
                // 渲染React图表组件
                const dashboardRoot = document.getElementById('analytics-dashboard');
                if (dashboardRoot && !dashboardRoot.hasChildNodes()) {
                    const root = ReactDOM.createRoot(dashboardRoot);
                    root.render(<AnalyticsDashboard />);
                }
            }
            if (tab === 'settings') { loadApiKeys(); }
        }

        function toggleIdcFields() { document.getElementById('idc-fields').classList.toggle('hidden', document.getElementById('acc-auth').value !== 'idc'); }

        async function addAccount() {
            const data = { name: document.getElementById('acc-name').value || '未命名账号', auth_method: document.getElementById('acc-auth').value, refresh_token: document.getElementById('acc-refresh').value, client_id: document.getElementById('acc-client-id').value || null, client_secret: document.getElementById('acc-client-secret').value || null };
            if (!data.refresh_token) { showToast('请填写 Refresh Token', 'warning'); return; }
            try { await fetchApi('/api/accounts', { method: 'POST', body: JSON.stringify(data) }); hideModal('addModal'); refresh(); showToast('添加成功', 'success'); }
            catch (e) { showToast('添加失败: ' + e.message, 'error'); }
        }

        async function importAccounts() {
            let jsonContent = document.getElementById('import-json').value.trim();
            if (!jsonContent) { showToast('请选择文件或粘贴 JSON 内容', 'warning'); return; }
            try { JSON.parse(jsonContent); } catch { showToast('JSON 格式错误', 'error'); return; }
            try {
                const result = await fetchApi('/api/accounts/import', { method: 'POST', body: JSON.stringify({ raw_json: jsonContent }) });
                hideModal('importModal'); document.getElementById('import-json').value = ''; document.getElementById('file-name').textContent = ''; refresh();
                showToast(`导入完成！成功: ${result.success} 个，失败: ${result.failed} 个`, result.failed > 0 ? 'warning' : 'success');
            } catch (e) { showToast('导入失败: ' + e.message, 'error'); }
        }

        function handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            document.getElementById('file-name').textContent = `已选择: ${file.name}`;
            const reader = new FileReader();
            reader.onload = (e) => { document.getElementById('import-json').value = e.target.result; };
            reader.readAsText(file);
        }

        async function removeAccount(id) {
            if (!confirm('确定删除？')) return;
            try { await fetchApi(`/api/accounts/${id}`, { method: 'DELETE' }); refresh(); showToast('删除成功', 'success'); }
            catch (e) { showToast('删除失败: ' + e.message, 'error'); }
        }

        async function enableAccount(id) {
            try { await fetchApi(`/api/accounts/${id}/enable`, { method: 'POST' }); refresh(); showToast('已启用', 'success'); }
            catch (e) { showToast('启用失败: ' + e.message, 'error'); }
        }

        async function disableAccount(id) {
            try { await fetchApi(`/api/accounts/${id}/disable`, { method: 'POST' }); refresh(); showToast('已禁用', 'success'); }
            catch (e) { showToast('禁用失败: ' + e.message, 'error'); }
        }

        async function changeAdminKey() {
            const newKey = document.getElementById('new-admin-key').value.trim();
            if (!newKey) { showToast('请输入新的管理密钥', 'warning'); return; }
            if (newKey.length < 6) { showToast('密钥长度至少 6 位', 'warning'); return; }
            if (!confirm('确定修改管理密钥？修改后需要重新登录。')) return;
            try { await fetchApi('/api/settings/admin-key', { method: 'POST', body: JSON.stringify({ new_key: newKey }) }); showToast('修改成功！请重新登录', 'success'); logout(); }
            catch (e) { showToast('修改失败: ' + e.message, 'error'); }
        }

        function maskKey(key) {
            if (key.length <= 10) return key;
            return key.substring(0, 7) + '****' + key.substring(key.length - 4);
        }

        async function loadApiKeys() {
            try {
                const keys = await fetchApi('/api/settings/api-keys');
                const container = document.getElementById('api-keys-list');
                if (!keys || keys.length === 0) { 
                    container.innerHTML = '<div class="text-gray-500 text-sm">暂无 API 密钥</div>'; 
                    return; 
                }
                container.innerHTML = `
                    <table class="w-full">
                        <thead>
                            <tr class="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <th class="px-4 py-3 rounded-tl-lg">名称</th>
                                <th class="px-4 py-3">密钥</th>
                                <th class="px-4 py-3">创建时间</th>
                                <th class="px-4 py-3 rounded-tr-lg text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            ${keys.map(item => `
                                <tr class="hover:bg-gray-50 transition">
                                    <td class="px-4 py-3">
                                        <span class="font-medium text-gray-900">${item.name || '(未命名)'}</span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="font-mono text-sm text-gray-600">${maskKey(item.key)}</span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="text-sm text-gray-500">${new Date(item.createdAt).toLocaleString('zh-CN')}</span>
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <button onclick="editKeyName('${item.key}')" class="text-blue-500 hover:text-blue-700 text-sm font-medium mr-2">编辑</button>
                                        <button onclick="copyText('${item.key}')" class="text-green-500 hover:text-green-700 text-sm font-medium mr-2">复制</button>
                                        <button onclick="removeApiKey('${item.key}')" class="text-red-500 hover:text-red-700 text-sm font-medium">删除</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } catch (e) { console.error(e); }
        }

        async function createApiKey() {
            const name = document.getElementById('api-key-name').value.trim();
            const createBtn = document.getElementById('create-key-btn');
            const cancelBtn = document.getElementById('cancel-key-btn');
            const confirmBtn = document.getElementById('confirm-key-btn');
            
            createBtn.disabled = true;
            createBtn.textContent = '创建中...';
            
            try {
                const res = await fetchApi('/api/settings/api-keys', {
                    method: 'POST',
                    body: JSON.stringify({ name: name || null })
                });
                
                if (res.success) {
                    document.getElementById('generated-key-value').value = res.key;
                    document.getElementById('generated-key-display').classList.remove('hidden');
                    document.getElementById('api-key-name').disabled = true;
                    
                    // 隐藏创建和取消按钮，显示确认按钮
                    createBtn.classList.add('hidden');
                    cancelBtn.classList.add('hidden');
                    confirmBtn.classList.remove('hidden');
                    
                    showToast('密钥创建成功', 'success');
                    loadApiKeys();
                }
            } catch (e) {
                showToast('创建失败: ' + e.message, 'error');
                createBtn.disabled = false;
                createBtn.textContent = '创建';
            }
        }

        function copyGeneratedKey() {
            const input = document.getElementById('generated-key-value');
            input.select();
            document.execCommand('copy');
            showToast('密钥已复制', 'success');
        }

        let currentEditingKey = null;

        function editKeyName(key) {
            currentEditingKey = key;
            document.getElementById('rename-key-name').value = '';
            showModal('renameApiKeyModal');
            // 聚焦输入框
            setTimeout(() => {
                document.getElementById('rename-key-name').focus();
            }, 100);
        }

        async function confirmRenameApiKey() {
            if (!currentEditingKey) return;
            
            const newName = document.getElementById('rename-key-name').value.trim();
            
            try {
                const res = await fetchApi(`/api/settings/api-keys/${encodeURIComponent(currentEditingKey)}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ name: newName || null })
                });
                
                if (res.success) {
                    showToast('名称已更新', 'success');
                    hideModal('renameApiKeyModal');
                    loadApiKeys();
                    currentEditingKey = null;
                }
            } catch (e) {
                showToast('更新失败: ' + e.message, 'error');
            }
        }

        async function removeApiKey(key) {
            if (!confirm('确定删除此 API 密钥？')) return;
            try { await fetchApi('/api/settings/api-keys', { method: 'DELETE', body: JSON.stringify({ key }) }); loadApiKeys(); showToast('删除成功', 'success'); }
            catch (e) { showToast('删除失败: ' + e.message, 'error'); }
        }

        function copyText(text) {
            navigator.clipboard.writeText(text).then(() => showToast('已复制到剪贴板', 'success')).catch(() => prompt('复制失败，请手动复制:', text));
        }

        async function refresh() { loadStatus(); loadAccounts(); loadStrategy(); }

        // ========== 数据分析相关函数 ==========
        let chartInstances = {};

        async function loadAnalytics(timeRange = '24h') {
            // 更新时间范围按钮样式
            document.querySelectorAll('.time-range-btn').forEach(btn => {
                if (btn.dataset.range === timeRange) {
                    btn.classList.remove('bg-gray-100', 'hover:bg-gray-200', 'text-gray-700');
                    btn.classList.add('bg-blue-500', 'text-white');
                } else {
                    btn.classList.remove('bg-blue-500', 'text-white');
                    btn.classList.add('bg-gray-100', 'hover:bg-gray-200', 'text-gray-700');
                }
            });

            try {
                // 并行获取所有统计数据
                const [timeseriesData, modelData, accountData, successRateData, tokenData, apiKeyData] = await Promise.all([
                    fetchApi(`/api/stats/timeseries?range=${timeRange}`),
                    fetchApi(`/api/stats/by-model?range=${timeRange}`),
                    fetchApi(`/api/stats/by-account?limit=10&range=${timeRange}`),
                    fetchApi(`/api/stats/success-rate?range=${timeRange}`),
                    fetchApi(`/api/stats/tokens?range=${timeRange}`),
                    fetchApi(`/api/stats/by-api-key?limit=10&range=${timeRange}`)
                ]);

                renderModelChart(timeseriesData.data);
                renderSuccessRateChart(successRateData.data);
                renderTokenTrendsChart(tokenData.data);
                renderTopAccountsChart(accountData.data);
                renderApiKeyStatsChart(apiKeyData.data);
            } catch (e) {
                showToast('加载数据失败: ' + e.message, 'error');
            }
        }

        function formatTimeLabel(timeStr) {
            // 格式化时间标签
            // 24小时格式: "2026-02-04 10:00:00" -> "10:00"
            // 7天格式: "2026-02-04" -> "02-04"
            if (timeStr.includes(':')) {
                // 24小时格式，提取小时
                const hour = timeStr.split(' ')[1].split(':')[0];
                return `${parseInt(hour)}:00`;
            } else {
                // 7天格式，提取月-日
                const parts = timeStr.split('-');
                return `${parts[1]}-${parts[2]}`;
            }
        }

        function renderModelChart(data) {
            const ctx = document.getElementById('modelChart');
            if (!ctx) return;

            // 销毁旧图表
            if (chartInstances.modelChart) {
                chartInstances.modelChart.destroy();
            }

            // 按模型分组数据
            const modelMap = {};
            data.forEach(item => {
                if (!modelMap[item.model]) {
                    modelMap[item.model] = [];
                }
                modelMap[item.model].push({ hour: item.hour, count: item.count });
            });

            // 获取所有时间点
            const hours = [...new Set(data.map(d => d.hour))].sort();
            
            // 格式化时间标签
            const formattedLabels = hours.map(h => formatTimeLabel(h));
            
            // 生成数据集
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
            const datasets = Object.keys(modelMap).map((model, idx) => {
                const modelData = hours.map(hour => {
                    const found = modelMap[model].find(d => d.hour === hour);
                    return found ? found.count : 0;
                });
                return {
                    label: model,
                    data: modelData,
                    backgroundColor: colors[idx % colors.length] + '40',
                    borderColor: colors[idx % colors.length],
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                };
            });

            chartInstances.modelChart = new Chart(ctx, {
                type: 'line',
                data: { labels: formattedLabels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        x: { stacked: true, grid: { display: false } },
                        y: { stacked: true, beginAtZero: true }
                    }
                }
            });
        }

        function renderSuccessRateChart(data) {
            const ctx = document.getElementById('successRateChart');
            if (!ctx) return;

            if (chartInstances.successRateChart) {
                chartInstances.successRateChart.destroy();
            }

            const successCount = data.successCount || 0;
            const failureCount = data.failureCount || 0;
            const total = successCount + failureCount;

            chartInstances.successRateChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['成功', '失败'],
                    datasets: [{
                        data: [successCount, failureCount],
                        backgroundColor: ['#10b981', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const value = context.parsed;
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${context.label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        function renderTokenTrendsChart(data) {
            const ctx = document.getElementById('tokenTrendsChart');
            if (!ctx) return;

            if (chartInstances.tokenTrendsChart) {
                chartInstances.tokenTrendsChart.destroy();
            }

            const hours = data.map(d => d.hour);
            const formattedLabels = hours.map(h => formatTimeLabel(h));
            const inputTokens = data.map(d => d.inputTokens || 0);
            const outputTokens = data.map(d => d.outputTokens || 0);

            chartInstances.tokenTrendsChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: formattedLabels,
                    datasets: [
                        {
                            label: '输入 Tokens',
                            data: inputTokens,
                            borderColor: '#3b82f6',
                            backgroundColor: '#3b82f640',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: '输出 Tokens',
                            data: outputTokens,
                            borderColor: '#10b981',
                            backgroundColor: '#10b98140',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            yAxisID: 'y'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: (context) => {
                                    const value = context.parsed.y;
                                    return `${context.dataset.label}: ${formatNumber(value)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { grid: { display: false } },
                        y: {
                            type: 'linear',
                            position: 'left',
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => formatNumber(value)
                            }
                        }
                    }
                }
            });
        }

        function renderTopAccountsChart(data) {
            const ctx = document.getElementById('topAccountsChart');
            if (!ctx) return;

            if (chartInstances.topAccountsChart) {
                chartInstances.topAccountsChart.destroy();
            }

            const accounts = data.map(d => d.accountName);
            const counts = data.map(d => d.count);

            chartInstances.topAccountsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: accounts,
                    datasets: [{
                        label: '请求次数',
                        data: counts,
                        backgroundColor: '#3b82f6',
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => `请求次数: ${context.parsed.x}`
                            }
                        }
                    },
                    scales: {
                        x: { beginAtZero: true, grid: { display: true } },
                        y: { grid: { display: false } }
                    }
                }
            });
        }

        function renderApiKeyStatsChart(data) {
            const ctx = document.getElementById('apiKeyStatsChart');
            if (!ctx) return;

            if (chartInstances.apiKeyStatsChart) {
                chartInstances.apiKeyStatsChart.destroy();
            }

            if (!data || data.length === 0) {
                ctx.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-sm">暂无数据</div>';
                return;
            }

            const labels = data.map(item => item.apiKey || '(未命名)');
            const requestCounts = data.map(item => item.count || 0);
            const inputTokens = data.map(item => item.inputTokens || 0);
            const outputTokens = data.map(item => item.outputTokens || 0);
            const successRates = data.map(item => {
                const total = item.count || 0;
                const success = item.successCount || 0;
                return total > 0 ? ((success / total) * 100).toFixed(1) : 0;
            });

            chartInstances.apiKeyStatsChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: '请求数',
                            data: requestCounts,
                            backgroundColor: 'rgba(59, 130, 246, 0.8)',
                            borderColor: 'rgb(59, 130, 246)',
                            borderWidth: 1,
                            yAxisID: 'y'
                        },
                        {
                            label: '成功率 (%)',
                            data: successRates,
                            backgroundColor: 'rgba(34, 197, 94, 0.8)',
                            borderColor: 'rgb(34, 197, 94)',
                            borderWidth: 1,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                afterLabel: function(context) {
                                    const index = context.dataIndex;
                                    const input = inputTokens[index];
                                    const output = outputTokens[index];
                                    return `输入: ${input.toLocaleString()} tokens\n输出: ${output.toLocaleString()} tokens`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 0,
                                font: {
                                    size: 11
                                }
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: '请求数'
                            },
                            beginAtZero: true
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: '成功率 (%)'
                            },
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    }
                }
            });
        }

        // ============ 设置标签切换 ============
        function switchSettingsTab(tab) {
            currentSettingsTab = tab;
            renderSettingsPanel();
            if (tab === 'general') {
                        loadApiKeys();
            } else if (tab === 'models') {
                loadModels();
            } else if (tab === 'mappings') {
                loadMappings();
            }
        }

        // ============ 模型管理 ============
        async function loadModels() {
            try {
                const models = await fetchApi('/api/models');
                const container = document.getElementById('models-table');

                if (models.length === 0) {
                    container.innerHTML = '<div class="text-center py-12 text-gray-500">暂无模型</div>';
                    return;
                }

                container.innerHTML = `
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">模型 ID</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">显示名称</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Tokens</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${models.map(m => `
                                <tr>
                                    <td class="px-6 py-4 text-sm text-gray-900 font-mono">${m.id}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">${m.displayName}</td>
                                    <td class="px-6 py-4 text-sm text-gray-600">${m.maxTokens}</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs rounded ${m.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
                                            ${m.enabled ? '启用' : '禁用'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-right text-sm space-x-2">
                                        <button onclick="editModel('${m.id}')" class="text-blue-600 hover:text-blue-800">编辑</button>
                                        <button onclick="toggleModel('${m.id}')" class="text-yellow-600 hover:text-yellow-800">${m.enabled ? '禁用' : '启用'}</button>
                                        <button onclick="deleteModel('${m.id}')" class="text-red-600 hover:text-red-800">删除</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } catch (e) {
                showToast('加载模型失败: ' + e.message, 'error');
            }
        }

        async function confirmAddModel() {
            const id = document.getElementById('model-id').value.trim();
            const displayName = document.getElementById('model-display-name').value.trim();
            const maxTokens = parseInt(document.getElementById('model-max-tokens').value) || 32000;
            const displayOrder = parseInt(document.getElementById('model-display-order').value) || 0;

            if (!id || !displayName) {
                showToast('请填写必填项', 'warning');
                return;
            }

            try {
                await fetchApi('/api/models', {
                    method: 'POST',
                    body: JSON.stringify({ id, displayName, maxTokens, displayOrder })
                });
                hideModal('addModelModal');
                loadModels();
                showToast('添加成功', 'success');
                // 清空表单
                document.getElementById('model-id').value = '';
                document.getElementById('model-display-name').value = '';
                document.getElementById('model-max-tokens').value = '';
                document.getElementById('model-display-order').value = '';
            } catch (e) {
                showToast('添加失败: ' + e.message, 'error');
            }
        }

        async function editModel(id) {
            try {
                const models = await fetchApi('/api/models');
                const model = models.find(m => m.id === id);
                if (!model) return;

                document.getElementById('edit-model-id').value = model.id;
                document.getElementById('edit-model-display-name').value = model.displayName;
                document.getElementById('edit-model-max-tokens').value = model.maxTokens;
                document.getElementById('edit-model-display-order').value = model.displayOrder;
                showModal('editModelModal');
            } catch (e) {
                showToast('加载模型失败: ' + e.message, 'error');
            }
        }

        async function confirmEditModel() {
            const id = document.getElementById('edit-model-id').value;
            const displayName = document.getElementById('edit-model-display-name').value.trim();
            const maxTokens = parseInt(document.getElementById('edit-model-max-tokens').value);
            const displayOrder = parseInt(document.getElementById('edit-model-display-order').value);

            try {
                await fetchApi(`/api/models/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ displayName, maxTokens, displayOrder })
                });
                hideModal('editModelModal');
                loadModels();
                showToast('更新成功', 'success');
            } catch (e) {
                showToast('更新失败: ' + e.message, 'error');
            }
        }

        async function deleteModel(id) {
            if (!confirm('确定要删除此模型吗？')) return;
            try {
                await fetchApi(`/api/models/${id}`, { method: 'DELETE' });
                loadModels();
                showToast('删除成功', 'success');
            } catch (e) {
                showToast('删除失败: ' + e.message, 'error');
            }
        }

        async function toggleModel(id) {
            try {
                await fetchApi(`/api/models/${id}/toggle`, { method: 'PATCH' });
                loadModels();
                showToast('状态已更新', 'success');
            } catch (e) {
                showToast('操作失败: ' + e.message, 'error');
            }
        }

        async function resetModels() {
            if (!confirm('确定要重置为默认模型列表吗？这将删除所有自定义模型。')) return;
            try {
                await fetchApi('/api/models/reset', { method: 'POST' });
                loadModels();
                showToast('已重置为默认模型', 'success');
            } catch (e) {
                showToast('重置失败: ' + e.message, 'error');
            }
        }

        // ============ 模型映射管理 ============
        async function loadMappings() {
            try {
                const mappings = await fetchApi('/api/model-mappings');
                const container = document.getElementById('mappings-table');

                if (mappings.length === 0) {
                    container.innerHTML = '<div class="text-center py-12 text-gray-500">暂无映射规则</div>';
                    return;
                }

                container.innerHTML = `
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">匹配模式</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">匹配类型</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">内部模型 ID</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">优先级</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${mappings.map(m => `
                                <tr>
                                    <td class="px-6 py-4 text-sm text-gray-900 font-mono">${m.externalPattern}</td>
                                    <td class="px-6 py-4 text-sm text-gray-600">
                                        <span class="px-2 py-1 text-xs rounded ${m.matchType === 'regex' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">
                                            ${m.matchType === 'regex' ? '正则' : '包含'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-600 font-mono">${m.internalId}</td>
                                    <td class="px-6 py-4 text-sm text-gray-600">${m.priority}</td>
                                    <td class="px-6 py-4">
                                        <span class="px-2 py-1 text-xs rounded ${m.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}">
                                            ${m.enabled ? '启用' : '禁用'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 text-right text-sm space-x-2">
                                        <button onclick="editMapping(${m.id})" class="text-blue-600 hover:text-blue-800">编辑</button>
                                        <button onclick="toggleMapping(${m.id})" class="text-yellow-600 hover:text-yellow-800">${m.enabled ? '禁用' : '启用'}</button>
                                        <button onclick="deleteMapping(${m.id})" class="text-red-600 hover:text-red-800">删除</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } catch (e) {
                showToast('加载映射失败: ' + e.message, 'error');
            }
        }

        async function confirmAddMapping() {
            const externalPattern = document.getElementById('mapping-pattern').value.trim();
            const matchType = document.getElementById('mapping-match-type').value;
            const internalId = document.getElementById('mapping-internal-id').value.trim();
            const priority = parseInt(document.getElementById('mapping-priority').value) || 0;

            if (!externalPattern || !internalId) {
                showToast('请填写必填项', 'warning');
                return;
            }

            // 验证正则表达式
            if (matchType === 'regex') {
                try {
                    new RegExp(externalPattern, 'i');
                } catch (e) {
                    showToast('无效的正则表达式: ' + e.message, 'error');
                    return;
                }
            }

            try {
                await fetchApi('/api/model-mappings', {
                    method: 'POST',
                    body: JSON.stringify({ externalPattern, matchType, internalId, priority })
                });
                hideModal('addMappingModal');
                loadMappings();
                showToast('添加成功', 'success');
                // 清空表单
                document.getElementById('mapping-pattern').value = '';
                document.getElementById('mapping-match-type').value = 'contains';
                document.getElementById('mapping-internal-id').value = '';
                document.getElementById('mapping-priority').value = '';
            } catch (e) {
                showToast('添加失败: ' + e.message, 'error');
            }
        }

        async function editMapping(id) {
            try {
                const mappings = await fetchApi('/api/model-mappings');
                const mapping = mappings.find(m => m.id === id);
                if (!mapping) return;

                document.getElementById('edit-mapping-id').value = mapping.id;
                document.getElementById('edit-mapping-pattern').value = mapping.externalPattern;
                document.getElementById('edit-mapping-match-type').value = mapping.matchType;
                document.getElementById('edit-mapping-internal-id').value = mapping.internalId;
                document.getElementById('edit-mapping-priority').value = mapping.priority;
                showModal('editMappingModal');
            } catch (e) {
                showToast('加载映射失败: ' + e.message, 'error');
            }
        }

        async function confirmEditMapping() {
            const id = document.getElementById('edit-mapping-id').value;
            const externalPattern = document.getElementById('edit-mapping-pattern').value.trim();
            const matchType = document.getElementById('edit-mapping-match-type').value;
            const internalId = document.getElementById('edit-mapping-internal-id').value.trim();
            const priority = parseInt(document.getElementById('edit-mapping-priority').value);

            // 验证正则表达式
            if (matchType === 'regex') {
                try {
                    new RegExp(externalPattern, 'i');
                } catch (e) {
                    showToast('无效的正则表达式: ' + e.message, 'error');
                    return;
                }
            }

            try {
                await fetchApi(`/api/model-mappings/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ externalPattern, matchType, internalId, priority })
                });
                hideModal('editMappingModal');
                loadMappings();
                showToast('更新成功', 'success');
            } catch (e) {
                showToast('更新失败: ' + e.message, 'error');
            }
        }

        async function deleteMapping(id) {
            if (!confirm('确定要删除此映射规则吗？')) return;
            try {
                await fetchApi(`/api/model-mappings/${id}`, { method: 'DELETE' });
                loadMappings();
                showToast('删除成功', 'success');
            } catch (e) {
                showToast('删除失败: ' + e.message, 'error');
            }
        }

        async function toggleMapping(id) {
            try {
                await fetchApi(`/api/model-mappings/${id}/toggle`, { method: 'PATCH' });
                loadMappings();
                showToast('状态已更新', 'success');
            } catch (e) {
                showToast('操作失败: ' + e.message, 'error');
            }
        }

        async function resetMappings() {
            if (!confirm('确定要重置为默认映射规则吗？这将删除所有自定义映射。')) return;
            try {
                await fetchApi('/api/model-mappings/reset', { method: 'POST' });
                loadMappings();
                showToast('已重置为默认映射', 'success');
            } catch (e) {
                showToast('重置失败: ' + e.message, 'error');
            }
        }

        // 自动刷新定时器
        setInterval(() => {
            if (adminKey && !document.getElementById('mainPanel')?.classList.contains('hidden')) {
                loadStatus();
                loadAccounts();
            }
        }, 5000);
    
