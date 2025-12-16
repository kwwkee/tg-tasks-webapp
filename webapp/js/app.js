// app.js - Главный файл приложения

const tg = window.Telegram.WebApp;
tg.expand();
tg.setHeaderColor('#1a1f3a');
tg.setBackgroundColor('#1a1f3a');

// Глобальные переменные
window.telegramId = null;
window.telegramUser = null;
window.userTasks = {};

async function init() {
    window.telegramUser = tg.initDataUnsafe?.user;
    
    if (window.telegramUser) {
        window.telegramId = window.telegramUser.id;
        const emoji = window.telegramUser.first_name?.[0] || '👤';
        document.getElementById('userAvatarIcon').textContent = emoji;
        document.getElementById('profileAvatarIcon').textContent = emoji;
    } else {
        // Для теста без Telegram
        window.telegramId = 123456789;
    }

    // Загружаем данные пользователя
    window.userTasks = await loadFromCloud(`user_tasks_${window.telegramId}`) || {};
    const userExists = await loadUserData();
    
    // Загружаем задания
    await loadTasks();
    
    if (userExists) {
        updateProfile();
        allUsers = await loadFromCloud('all_users') || {};
    }
}

// Запускаем приложение
init();