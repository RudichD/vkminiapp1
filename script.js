// Инициализация VK Bridge и Tunnel
document.addEventListener('DOMContentLoaded', async () => {
 try {
 // Инициализируем VK Bridge
 VK.init({
 apiId: 53391802,
 onlyWidgets: false
 });

 // Получаем токен
 const tokenData = await VK.bridge.send('VKWebAppGetAuthToken', {
 scope: 'friends,photos,messages'
 });
 console.log('Получен токен:', tokenData.access_token);

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
 // Если соглашение уже принято, загружаем основной контент
 loadMainContent();
 } else {
 // Показываем форму соглашения
 showAgreementModal();
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

 // Загружаем основной контент
 loadMainContent();
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
 loadMainContent();
 } else {
 throw new Error('Ошибка сохранения соглашения');
 }
 } catch (error) {
 console.error('Ошибка:', error);
 alert('Произошла ошибка при обработке. Попробуйте позже.');
 }
 });
}

// Функция для загрузки основного контента
async function loadMainContent() {
 try {
 // Здесь ваш код для загрузки основного контента
 document.querySelector('.container').style.display = 'block';
 // Дополнительные действия при загрузке контента
 } catch (error) {
 console.error('Ошибка загрузки контента:', error);
 }
}