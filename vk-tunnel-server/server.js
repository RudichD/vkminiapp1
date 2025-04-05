Вот обновленный код с правильным использованием ключей:

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Получаем ключи из переменных окружения
const VK_CLIENT_SECRET = process.env.VK_CLIENT_SECRET;
const VK_ACCESS_KEY = process.env.VK_ACCESS_KEY;

// Проверяем, что ключи заданы
if (!VK_CLIENT_SECRET || !VK_ACCESS_KEY) {
    console.error('Ошибка: Не заданы ключи доступа!');
    process.exit(1);
}

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
            // Проверяем подпись сообщения
            if (!verifySignature(data, VK_CLIENT_SECRET)) {
                throw new Error('Неверная подпись сообщения');
            }

            // Обрабатываем действия
            if (data.action === 'save_agreement') {
                const { status, user_id } = data.data;

                // Проверяем, есть ли уже такой пользователь
                if (!db.agreements[user_id]) {
                    db.agreements[user_id] = {
                        status: status,
                        timestamp: new Date().getTime(),
                        agreement_id: uuidv4()
                    };
                    saveDatabase();

                    // Отправляем ответ
                    socket.emit('response', {
                        success: true,
                        message: 'Соглашение успешно сохранено',
                        agreement_id: db.agreements[user_id].agreement_id
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

// Функция верификации подписи
function verifySignature(data, secret) {
    // Здесь ваша логика верификации
    return true; // Заглушка
}

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

// Функция для получения статуса