// admin-app.js - Основная логика админки

const tg = window.Telegram.WebApp;
tg.expand();

// Dashboard
async function loadDashboard() {
    const users = await loadFromCloud('all_users') || {};
    const tasks = await loadFromCloud('tasks_list') || [];
    const submissions = await loadFromCloud('task_submissions') || [];
    const codes = await loadFromCloud('promo_codes') || {};
    
    const pending = submissions.filter(s => !s.approved && !s.rejected).length;
    
    document.getElementById('totalUsers').textContent = Object.keys(users).length;
    document.getElementById('totalTasks').textContent = tasks.length;
    document.getElementById('pendingSubmissions').textContent = pending;
    document.getElementById('totalCodes').textContent = Object.keys(codes).length;
    document.getElementById('pendingBadge').textContent = `${pending} на проверке`;
}

// Пользователи
async function loadUsers() {
    const users = await loadFromCloud('all_users') || {};
    const tbody = document.getElementById('usersTableBody');
    
    tbody.innerHTML = Object.values(users).map(user => `
        <tr>
            <td>${user.telegramId}</td>
            <td>${user.nickname}</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td>@${user.username || '-'}</td>
            <td>💰 ${user.balance}</td>
            <td>${new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
        </tr>
    `).join('');
}

// Задания
async function addTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const reward = parseInt(document.getElementById('taskReward').value);
    const category = document.getElementById('taskCategory').value.trim();
    
    if (!title || !description || !reward) return showNotification('Заполни все поля');
    
    const tasks = await loadFromCloud('tasks_list') || [];
    const newTask = {
        id: `task_${Date.now()}`,
        title,
        description,
        reward,
        category: category || 'Общие',
        icon: selectedIcon
    };
    
    tasks.push(newTask);
    await saveToCloud('tasks_list', tasks);
    
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskReward').value = '';
    document.getElementById('taskCategory').value = '';
    
    showNotification('Задание добавлено!');
    loadTasksAdmin();
    loadDashboard();
}

async function loadTasksAdmin() {
    const tasks = await loadFromCloud('tasks_list') || [];
    const container = document.getElementById('tasksContainer');
    
    container.innerHTML = tasks.map(task => `
        <div class="item-card">
            ${task.icon} <strong>${task.title}</strong><br>
            ${task.description}<br>
            <strong>Награда:</strong> 💰 ${task.reward} | <strong>Категория:</strong> ${task.category}<br>
            <button class="btn btn-danger" onclick="deleteTask('${task.id}')">Удалить</button>
        </div>
    `).join('');
}

async function deleteTask(taskId) {
    const tasks = await loadFromCloud('tasks_list') || [];
    const filtered = tasks.filter(t => t.id !== taskId);
    await saveToCloud('tasks_list', filtered);
    showNotification('Задание удалено');
    loadTasksAdmin();
    loadDashboard();
}

// Проверка заданий
async function loadSubmissions() {
    const submissions = await loadFromCloud('task_submissions') || [];
    const tasks = await loadFromCloud('tasks_list') || [];
    const container = document.getElementById('submissionsContainer');
    
    const pending = submissions.filter(s => !s.approved && !s.rejected);
    
    if (pending.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #aaa; padding: 40px;">Нет заданий на проверке</p>';
        return;
    }
    
    container.innerHTML = pending.map((sub, idx) => {
        const task = tasks.find(t => t.id === sub.taskId);
        return `
            <div class="submission-card">
                <strong>Пользователь:</strong> ${sub.userData.nickname} (@${sub.userData.username || '-'})<br>
                <strong>Задание:</strong> ${task?.title || sub.taskId}<br>
                <strong>Награда:</strong> 💰 ${task?.reward || 0}<br>
                <strong>Дата:</strong> ${new Date(sub.submittedAt).toLocaleString('ru-RU')}<br>
                <img src="${sub.photo}" class="submission-photo" alt="Screenshot">
                <div class="btn-group">
                    <button class="btn btn-success" onclick="approveSubmission(${submissions.indexOf(sub)}, ${task?.reward || 0})">✅ Одобрить</button>
                    <button class="btn btn-danger" onclick="rejectSubmission(${submissions.indexOf(sub)})">❌ Отклонить</button>
                </div>
            </div>
        `;
    }).join('');
}

async function approveSubmission(index, reward) {
    const submissions = await loadFromCloud('task_submissions') || [];
    const sub = submissions[index];
    
    sub.approved = true;
    sub.approvedAt = new Date().toISOString();
    
    const users = await loadFromCloud('all_users') || {};
    const user = users[sub.userId];
    if (user) {
        user.balance += reward;
        users[sub.userId] = user;
        await saveToCloud('all_users', users);
        await saveToCloud(`user_${sub.userId}`, user);
    }
    
    const userTasks = await loadFromCloud(`user_tasks_${sub.userId}`) || {};
    if (userTasks[sub.taskId]) {
        userTasks[sub.taskId].status = 'completed';
        await saveToCloud(`user_tasks_${sub.userId}`, userTasks);
    }
    
    submissions[index] = sub;
    await saveToCloud('task_submissions', submissions);
    
    showNotification('Задание одобрено!');
    loadSubmissions();
    loadDashboard();
}

async function rejectSubmission(index) {
    const submissions = await loadFromCloud('task_submissions') || [];
    const sub = submissions[index];
    
    sub.rejected = true;
    sub.rejectedAt = new Date().toISOString();
    
    const userTasks = await loadFromCloud(`user_tasks_${sub.userId}`) || {};
    if (userTasks[sub.taskId]) {
        userTasks[sub.taskId].status = 'pending';
        await saveToCloud(`user_tasks_${sub.userId}`, userTasks);
    }
    
    submissions[index] = sub;
    await saveToCloud('task_submissions', submissions);
    
    showNotification('Задание отклонено');
    loadSubmissions();
    loadDashboard();
}

// Промокоды
async function addCode() {
    const code = document.getElementById('codeText').value.trim().toUpperCase();
    const reward = parseInt(document.getElementById('codeReward').value);
    
    if (!code || !reward) return showNotification('Заполни все поля');
    
    const codes = await loadFromCloud('promo_codes') || {};
    codes[code] = {
        code,
        reward,
        createdAt: new Date().toISOString(),
        used: []
    };
    
    await saveToCloud('promo_codes', codes);
    
    document.getElementById('codeText').value = '';
    document.getElementById('codeReward').value = '';
    
    showNotification('Промокод создан!');
    loadCodes();
    loadDashboard();
}

async function loadCodes() {
    const codes = await loadFromCloud('promo_codes') || {};
    const container = document.getElementById('codesContainer');
    
    container.innerHTML = Object.values(codes).map(code => `
        <div class="item-card">
            <strong>Код:</strong> ${code.code}<br>
            <strong>Награда:</strong> 💰 ${code.reward}<br>
            <strong>Использований:</strong> ${code.used?.length || 0}<br>
            <button class="btn btn-danger" onclick="deleteCode('${code.code}')">Удалить</button>
        </div>
    `).join('');
}

async function deleteCode(code) {
    const codes = await loadFromCloud('promo_codes') || {};
    delete codes[code];
    await saveToCloud('promo_codes', codes);
    showNotification('Код удален');
    loadCodes();
    loadDashboard();
}

// Магазин
async function addShopItem() {
    const title = document.getElementById('shopTitle').value.trim();
    const description = document.getElementById('shopDescription').value.trim();
    const price = parseInt(document.getElementById('shopPrice').value);
    const icon = document.getElementById('shopIcon').value.trim();
    
    if (!title || !description || !price) return showNotification('Заполни все поля');
    
    const items = await loadFromCloud('shop_items') || [];
    items.push({
        id: `shop_${Date.now()}`,
        title,
        description,
        price,
        icon: icon || '🎁'
    });
    
    await saveToCloud('shop_items', items);
    
    document.getElementById('shopTitle').value = '';
    document.getElementById('shopDescription').value = '';
    document.getElementById('shopPrice').value = '';
    document.getElementById('shopIcon').value = '';
    
    showNotification('Товар добавлен!');
    loadShopAdmin();
}

async function loadShopAdmin() {
    const items = await loadFromCloud('shop_items') || [];
    const container = document.getElementById('shopContainer');
    
    container.innerHTML = items.map(item => `
        <div class="item-card">
            ${item.icon} <strong>${item.title}</strong><br>
            ${item.description}<br>
            <strong>Цена:</strong> 💰 ${item.price}<br>
            <button class="btn btn-danger" onclick="deleteShopItem('${item.id}')">Удалить</button>
        </div>
    `).join('');
}

async function deleteShopItem(id) {
    const items = await loadFromCloud('shop_items') || [];
    const filtered = items.filter(i => i.id !== id);
    await saveToCloud('shop_items', filtered);
    showNotification('Товар удален');
    loadShopAdmin();
}

// Новости
async function addNews() {
    const title = document.getElementById('newsTitle').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    
    if (!title || !content) return showNotification('Заполни все поля');
    
    const news = await loadFromCloud('news_list') || [];
    news.push({
        id: `news_${Date.now()}`,
        title,
        content,
        date: new Date().toISOString()
    });
    
    await saveToCloud('news_list', news);
    
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsContent').value = '';
    
    showNotification('Новость опубликована!');
    loadNewsAdmin();
}

async function loadNewsAdmin() {
    const news = await loadFromCloud('news_list') || [];
    const container = document.getElementById('newsContainer');
    
    container.innerHTML = news.sort((a, b) => new Date(b.date) - new Date(a.date)).map(item => `
        <div class="item-card">
            <strong>${item.title}</strong><br>
            ${item.content}<br>
            <small>${new Date(item.date).toLocaleString('ru-RU')}</small><br>
            <button class="btn btn-danger" onclick="deleteNews('${item.id}')">Удалить</button>
        </div>
    `).join('');
}

async function deleteNews(id) {
    const news = await loadFromCloud('news_list') || [];
    const filtered = news.filter(n => n.id !== id);
    await saveToCloud('news_list', filtered);
    showNotification('Новость удалена');
    loadNewsAdmin();
}

// Инициализация
initIconPicker();
loadDashboard();