const reportWebVitals = onPerfEntry => { // Функція для збору веб-віталів (web vitals) для аналізу продуктивності додатку
  if (onPerfEntry && onPerfEntry instanceof Function) { // Перевіряємо чи передана функція для обробки результатів
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => { // Динамічно імпортуємо бібліотеку web-vitals
      getCLS(onPerfEntry); // Cumulative Layout Shift (CLS) вимірює візуальну стабільність сторінки
      getFID(onPerfEntry); // First Input Delay (FID) вимірює час від першої взаємодії користувача з сайтом до моменту, коли браузер може почати обробляти цю взаємодію
      getFCP(onPerfEntry); // First Contentful Paint (FCP) вимірює час до першого відображеного тексту або зображення
      getLCP(onPerfEntry); // Largest Contentful Paint (LCP) вимірює час завантаження найбільшого елемента вікна перегляду
      getTTFB(onPerfEntry); // Time to First Byte (TTFB) вимірює час відправки запиту до отримання першого байта відповіді від сервера
    });
  }
}; // Функція для збору веб-віталів (web vitals) для аналізу продуктивності додатку

export default reportWebVitals; // Експортуємо функцію для використання в інших частинах додатку
// Якщо ви хочете почати збір веб-віталів, передайте функцію для обробки результатів (наприклад, відправку на аналітичний сервер)
// або просто виконайте console.log, щоб побачити результати в консолі.
// Наприклад: reportWebVitals(console.log)
// або
// reportWebVitals(metric => {
//   // Відправка метрики на аналітичний сервер
//   fetch('https://example.com/analytics', {
//     method: 'POST',
//     body: JSON.stringify(metric),
//     keepalive: true
//   });
// });
