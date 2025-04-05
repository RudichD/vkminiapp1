// Инициализация VK Bridge
VK.init({
    apiId: YOUR_APP_ID,
    onlyWidgets: false
});

// Обработка нажатия кнопки
document.getElementById('acceptBtn').addEventListener('click', function() {
    // Отправляем данные о принятии соглашения
    VK.bridge.send('AL_agreement_accepted', {
        status: 'accepted'
    });

    // Можно добавить дополнительную логику
    alert('Соглашение принято!');
});