// Toast 通知和模态框管理

window.showToast = function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500', warning: 'bg-yellow-500' };
    const toast = document.createElement('div');
    toast.className = `${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slideIn`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('animate-slideOut'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function showModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideModal(id) {
    document.getElementById(id).classList.add('hidden');
}
