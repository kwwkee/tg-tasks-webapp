// admin-ui.js - Функции интерфейса админки

let selectedIcon = '🎮';

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`).classList.add('active');
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    if (section === 'users') loadUsers();
    if (section === 'tasks') loadTasksAdmin();
    if (section === 'submissions') loadSubmissions();
    if (section === 'codes') loadCodes();
    if (section === 'shop') loadShopAdmin();
    if (section === 'news') loadNewsAdmin();
}

function showNotification(text) {
    document.getElementById('notificationText').textContent = text;
    document.getElementById('notification').classList.add('show');
    setTimeout(() => document.getElementById('notification').classList.remove('show'), 3000);
}

// Иконки
function initIconPicker() {
    const icons = ['🎮', '🏆', '💰', '🎯', '⚔️', '🔫', '📱', '📢', '🎁', '⚡', '🔥', '💎'];
    const picker = document.getElementById('iconPicker');
    
    if (picker) {
        picker.innerHTML = icons.map(icon => 
            `<div class="icon-option ${icon === '🎮' ? 'selected' : ''}" data-icon="${icon}" onclick="selectIcon('${icon}')">${icon}</div>`
        ).join('');
    }
}

function selectIcon(icon) {
    document.querySelectorAll('.icon-option').forEach(i => i.classList.remove('selected'));
    event.target.classList.add('selected');
    selectedIcon = icon;
}
