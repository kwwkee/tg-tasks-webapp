// admin-storage.js - Работа с Cloud Storage для админки

async function saveToCloud(key, data) {
    return new Promise((resolve) => {
        window.Telegram.WebApp.CloudStorage.setItem(key, JSON.stringify(data), (err) => {
            resolve(!err);
        });
    });
}

async function loadFromCloud(key) {
    return new Promise((resolve) => {
        window.Telegram.WebApp.CloudStorage.getItem(key, (err, value) => {
            if (err || !value) {
                resolve(null);
            } else {
                try {
                    resolve(JSON.parse(value));
                } catch {
                    resolve(null);
                }
            }
        });
    });
}
