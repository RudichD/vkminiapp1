const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const fs = require('fs');
const path = require('path');

// Загружаем базу данных
let db;
try {
    db = JSON.parse(fs.readFileSync(path.join(__dirname, 'database.json')));
} catch (error) {
    db = { agreements: {} };
}

// Функция сохранения базы данных
const saveDatabase = () => {
    fs.writeFileSync(path.join(__dirname, 'database.json'), JSON.stringify(db, null, 2));
};

// Настройка парсера для JSON
app.use(bodyParser.json());

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для получения сообщений
app.post('/api/messages', (req, res) => {
    const { message } = req.body;
    console.log('Received message:', message);
    res.json({ status: 'ok' });
});

// Маршрут для проверки статуса соглашения
app.get('/api/agreement/:userId', (req, res) => {
    const { userId } = req.params;
    const userAgreement = db.agreements[userId];
    if (userAgreement) {
        res.json({
            status: 'accepted',
            timestamp: userAgreement.timestamp
        });
    } else {
        res.json({ status: 'pending' });
    }
});

// Настройка Socket.IO для работы с туннелем
io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('message', async (data) => {
        console.log('Message from client:', data);

        try {
            // Обрабатываем действия
            if (data.action === 'save_agreement') {
                const { status, user_id } = data.data;

                // Проверяем, есть ли уже такой пользователь
                if (!db.agreements[user_id]) {
                    db.agreements[user_id] = {
                        status: status,
                        timestamp: new Date().getTime()
                    };
                    saveDatabase();

                    // Отправляем ответ
                    socket.emit('response', {
                        success: true,
                        message: 'Соглашение успешно сохранено'
                    });
                } else {
                    socket.emit('response', {
                        success: false,
                        message: 'Соглашение уже сохранено ранее'
                    });
                }
            }
        } catch (error) {
            console.error('Ошибка обработки сообщения:', error);
            socket.emit('response', {
                success: false,
                message: 'Произошла ошибка при обработке запроса'
            });
        }
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error'
    });
});

// Запускаем сервер
server.listen(3000, () => {
    console.log('Server started on port 3000');
});

// Функция для получения статуса соглашения
app.get('/api/status', (req, res) => {
    res.json({
        status: 'ready',
        message: 'Сервер готов к работе'
    });
});

// Функция для получения списка всех пользователей
app.get('/api/users', (req, res) => {
    const users = Object.keys(db.agreements).map(userId => ({
        userId,
        status: db.agreements[userId].status,
        timestamp: db.agreements[userId].timestamp
    }));
    res.json({ users });
});