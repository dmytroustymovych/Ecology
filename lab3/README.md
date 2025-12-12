# Air Quality Index Calculator

# Встановити backend
npm install

# Встановити frontend
npm run client:install

# Використовувати MongoDB для DB(вписати шлях у .env)

# Заповнення тестових даних

npm run seed:airindex

# 4. Запуск

**Terminal 1:**
npm run dev

Backend на http://localhost:5000

**Terminal 2:**
npm run client

Frontend на http://localhost:3000

# Параметри моделі

| Забруднювач | Одиниця | Діапазон | Ліміт |
|-------------|---------|----------|-------|
| PM2.5       | µg/m³   | 5-150    | 50    |
| PM10        | µg/m³   | 10-300   | 300   |
| NO₂         | µg/m³   | 10-400   | 400   |
| SO₂         | µg/m³   | 5-200    | 200   |
| O₃          | µg/m³   | 10-250   | 150   |


# Основні можливості

**API REST** з CRUD операціями  
**React UI** з формою та графіками  
**MongoDB** для збереження даних  
**Unit тести** 25+ тестів  
**Валідація** Joi на frontend/backend  
**Обробка помилок** та null значень  
**Seed дані** з добовою циклічністю  
**Адаптивний дизайн** мобіль + десктоп  

## Формула розрахунку

# Sub-Index для кожного забруднювача:
$$\text{SubIndex}_i = \frac{C_i}{\text{Limit}_i} \times 100$$

# Інтегральний AQI:
$$\text{AQI} = \max(\text{SubIndex}_{\text{PM2.5}}, ..., \text{SubIndex}_{\text{O}_3})$$

**Приклад:**
- PM2.5 = 45 µg/m³ → SubIndex = (45/50)×100 = 90
- PM10 = 120 µg/m³ → SubIndex = (120/300)×100 = 40
- **AQI = max(90, 40, ...) = 90** → **Moderate (Помірно)** 🟡

---

# Категорії якості повітря

| AQI     | Категорія               | Колір  | Опис |
|---------|-------------------------|------- |------|
| 0-50    | Good                    | 🟢    | Добре |
| 51-100  | Moderate                | 🟡    | Помірно |
| 101-150 | Unhealthy for Sensitive | 🟠    | Нездорово для чутливих |
| 151-200 | Unhealthy               | 🔴    | Нездорово |
| 201-300 | Very Unhealthy          | 🟣    | Дуже нездорово |
| 301+    | Hazardous               | 🟤    | Небезпечно |

---

# API Endpoints

# POST /api/airindex/calc — Розрахунок

```bash
curl -X POST http://localhost:5000/api/airindex/calc \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "station-001",
    "datetime": "2025-12-11T12:00:00Z",
    "pollutants": {
      "PM25": 45.5,
      "PM10": 125,
      "NO2": 95,
      "SO2": 55,
      "O3": 115
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "index": 91.0,
    "category": "moderate",
    "categoryLabel": "Помірно",
    "color": "#FFFF00",
    "subIndices": { ... }
  }
}
```

### GET /api/airindex/generate — Синтетичні дані

```bash
curl http://localhost:5000/api/airindex/generate?hour=12
```

### GET /api/airindex — Список записів

```bash
curl "http://localhost:5000/api/airindex?limit=10&category=moderate"
```

### GET /api/airindex/stats — Статистика

```bash
curl http://localhost:5000/api/airindex/stats
```

---

## 🧪 Тестування

```powershell
# Запуск тестів
npm test

# З покриттям коду
npm test -- --coverage

# Watch режим
npm run test:watch
```

**Результат:** 25+ тестів
- calculateSubIndex() — 6 тестів
- getCategory() — 6 тестів
- compute() — 8 тестів
- generateSyntheticData() — 4 тести

---

# Тестуємо API (cURL)

```powershell
# Розрахунок
curl -X POST http://localhost:5000/api/airindex/calc `
  -H "Content-Type: application/json" `
  -d '{"stationId":"s1","datetime":"2025-12-11T12:00:00Z","pollutants":{"PM25":45.5,"PM10":125,"NO2":95,"SO2":55,"O3":115}}'

# Список
curl "http://localhost:5000/api/airindex?limit=5"

# Статистика
curl http://localhost:5000/api/airindex/stats