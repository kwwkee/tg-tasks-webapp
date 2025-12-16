// ui.js - Функции интерфейса

function openMenu() {
    document.getElementById('menuOverlay').classList.add('active');
    document.getElementById('menuBackdrop').classList.add('active');
}

function closeMenu() {
    document.getElementById('menuOverlay').classList.remove('active');
    document.getElementById('menuBackdrop').classList.remove('active');
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageName}`).classList.add('active');
    
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    document.querySelector(`[data-page="${pageName}"]`)?.classList.add('active');
    
    closeMenu();
    
    if (pageName === 'profile') updateProfile();
    if (pageName === 'rating') renderRating();
    if (pageName === 'shop') loadShop();
    if (pageName === 'news') loadNews();
}

function showNotification(text, icon = '✅') {
    const notification = document.getElementById('notification');
    notification.querySelector('.notification-icon').textContent = icon;
    document.getElementById('notificationText').textContent = text;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Навигация меню
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            showPage(item.dataset.page);
        });
    });
});