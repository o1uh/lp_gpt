// Импортируем переменные окружения в самом начале
require('dotenv').config();

// Импортируем наши модули
const { db, createTables } = require('./database.js'); 
const { initializeAllKBs } = require('./services/kbService.js');
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/authMiddleware.js');
const authRoutes = require('./routes/authRoutes.js');
const projectRoutes = require('./routes/projectRoutes.js');
const teacherRoutes = require('./routes/teacherRoutes.js');
const aiRoutes = require('./routes/aiRoutes.js'); 

// Создаем приложение Express
const app = express();
const PORT = process.env.PORT || 3001;

// Подключаем middleware
app.use(cors());
app.use(express.json());

// --- РОУТЫ (Маршруты API) ---
app.use('/api/auth', authRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/teacher', authMiddleware, teacherRoutes);
app.use('/api/ai', authMiddleware, aiRoutes); 

// Простой роут для проверки работоспособности
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running!' });
});

// Главная асинхронная функция для запуска сервера
const startServer = async () => {
  try {
    // 1. Сначала дожидаемся создания таблиц
    await createTables();
    console.log("Database tables are ready.");

    // 2. Только потом инициализируем Базу Знаний, которая читает из этих таблиц
    await initializeAllKBs();
    console.log("Knowledge Base is ready.");

    // 3. И только потом запускаем сервер, который слушает запросы
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1); // Выходим из приложения, если старт не удался
  }
};

// Запускаем наш сервер
startServer();