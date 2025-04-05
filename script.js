// Инициализация VK Bridge и Tunnel
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Инициализируем VK Bridge
        VK.init({
            apiId: 53391802,
            onlyWidgets: false
        });

        // Инициализируем VK Tunnel
        await VK.webApp.tunnel.init();

        // Проверяем подключение
        VK.webApp.tunnel.on('connect', () => {
            console.log('VK Tunnel connected');
        });

        // Обработчик отключения
        VK.webApp.tunnel.on('disconnect', () => {
            console.log('VK Tunnel disconnected');
        });

        // Обработчик ошибок
        VK.webApp.tunnel.on('error', (error) => {
            console.error('VK Tunnel error:', error);
        });

        // Функция проверки статуса соглашения
        async function checkAgreementStatus() {
            try {
                // Проверяем, принято ли соглашение
                const response = await VK.bridge.send('AL_get_agreement_status');
                if (response.status === 'accepted') {
                    // Если соглашение уже принято, скрываем форму
                    document.querySelector('.container').style.display = 'none';
                }
            } catch (error) {
                console.error('Ошибка получения статуса:', error);
            }
        }

        // Обработка нажатия кнопки
        document.getElementById('acceptBtn').addEventListener('click', async () => {
            try {
                // Получаем информацию о пользователе
                const userInfo = await VK.webApp.getUserInfo();

                // Отправляем данные через туннель
                const tunnelResponse = await VK.webApp.tunnel.send({
                    action: 'save_agreement',
                    data: {
                        status: 'accepted',
                        user_id: userInfo.id
                    }
                });

                // Проверяем ответ от сервера
                if (tunnelResponse.success) {
                    // Показываем успешное принятие
                    alert('Соглашение принято!');

                    // Скрываем форму
                    document.querySelector('.container').style.display = 'none';
                } else {
                    throw new Error('Ошибка сохранения соглашения');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при обработке. Попробуйте позже.');
            }
        });

        // Инициализация и проверка статуса
        await VK.webApp.init();
        console.log('VK Bridge initialized');
        checkAgreementStatus();

    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});

// Дополнительные функции

// Функция для отображения модального окна с соглашением
function showAgreementModal() {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Пользовательское соглашение</h2>
            <div class="agreement-text">
                <p>Текст соглашения...</p>
            </div>
            <button class="accept-button">Принять</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Обработчик кнопки принятия
    modal.querySelector('.accept-button').addEventListener('click', async () => {
        try {
            const userInfo = await VK.webApp.getUserInfo();
            const response = await VK.webApp.tunnel.send({
                action: 'save_agreement',
                data: {
                    status: 'accepted',
                    user_id: userInfo.id
                }
            });

            if (response.success) {
                modal.remove();
                alert('Соглашение принято!');
            } else {
                throw new Error('Ошибка сохранения соглашения');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при обработке. Попробуйте позже.');
        }
    });
}

// Функция для проверки и загрузки контента
async function loadContent() {
    try {
        const agreementStatus = await checkAgreementStatus();
        if (agreementStatus === 'accepted') {
            // Загружаем основной контент
            loadMainContent();
        } else {
            // Показываем форму соглашения
            show