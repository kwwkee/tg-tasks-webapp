// profile.js - Управление профилем

let userData = null;
let allUsers = {};

async function createProfile() {
    const nickname = document.getElementById('nicknameInput').value.trim();
    const firstName = document.getElementById('firstNameInput').value.trim();
    const lastName = document.getElementById('lastNameInput').value.trim();
    const errorEl = document.getElementById('registrationError');
    
    if (!nickname || nickname.length < 3) {
        errorEl.textContent = 'Никнейм минимум 3 символа';
        errorEl.style.display = 'block';
        return;
    }

    userData = {
        telegramId: window.telegramId,
        nickname,
        firstName: firstName || window.telegramUser?.first_name || '',
        lastName: lastName || window.telegramUser?.last_name || '',
        username: window.telegramUser?.username || '',
        balance: 0,
        createdAt: new Date().toISOString()
    };

    await saveToCloud(`user_${window.telegramId}`, userData);
    
    allUsers = await loadFromCloud('all_users') || {};
    allUsers[window.telegramId] = userData;
    await saveToCloud('all_users', allUsers);

    document.getElementById('registrationModal').style.display = 'none';
    updateProfile();
    showNotification('Профиль создан! 🎉');
}

async function loadUserData() {
    userData = await loadFromCloud(`user_${window.telegramId}`);
    
    if (!userData) {
        document.getElementById('registrationModal').style.display = 'flex';
        if (window.telegramUser) {
            document.getElementById('firstNameInput').value = window.telegramUser.first_name || '';
            document.getElementById('lastNameInput').value = window.telegramUser.last_name || '';
        }
        return false;
    }
    
    updateProfile();
    return true;
}

function updateProfile() {
    if (!userData) return;
    
    const fullName = `${userData.firstName} ${userData.lastName}`.trim();
    document.getElementById('profileName').textContent = fullName || userData.nickname;
    document.getElementById('profileId').textContent = `#${window.telegramId}`;
    document.getElementById('profileUsername').textContent = userData.username ? `@${userData.username}` : '';
    document.getElementById('profileBalance').textContent = userData.balance;
    
    const completed = Object.values(window.userTasks || {}).filter(t => t.status === 'completed').length;
    const checking = Object.values(window.userTasks || {}).filter(t => t.status === 'checking').length;
    
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statChecking').textContent = checking;
}

async function renderRating() {
    allUsers = await loadFromCloud('all_users') || {};
    const container = document.getElementById('rating-container');
    
    const sorted = Object.values(allUsers).sort((a, b) => b.balance - a.balance).slice(0, 50);
    
    if (sorted.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: #aaa;"><div style="font-size: 80px; margin-bottom: 20px;">🏆</div><div>Рейтинг пока пуст</div></div>';
        return;
    }
    
    container.innerHTML = sorted.map((user, idx) => `
        <div class="leaderboard-item">
            <div class="leaderboard-rank ${idx === 0 ? 'top1' : idx === 1 ? 'top2' : idx === 2 ? 'top3' : ''}">#${idx + 1}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${user.nickname}</div>
                <div class="leaderboard-balance">💰 ${user.balance}</div>
            </div>
        </div>
    `).join('');
}

async function activateCode() {
    const code = document.getElementById('codeInput').value.trim().toUpperCase();
    if (!code) return showNotification('Введи код', '❌');
    
    const allCodes = await loadFromCloud('promo_codes') || {};
    
    const codeData = allCodes[code];
    if (!codeData) return showNotification('Неверный код', '❌');
    if (codeData.used && codeData.used.includes(window.telegramId)) {
        return showNotification('Код уже использован', '❌');
    }
    
    userData.balance += codeData.reward;
    await saveToCloud(`user_${window.telegramId}`, userData);
    
    allUsers[window.telegramId] = userData;
    await saveToCloud('all_users', allUsers);
    
    codeData.used = codeData.used || [];
    codeData.used.push(window.telegramId);
    allCodes[code] = codeData;
    await saveToCloud('promo_codes', allCodes);
    
    document.getElementById('codeInput').value = '';
    updateProfile();
    showNotification(`+${codeData.reward} монет!`, '🎉');
}