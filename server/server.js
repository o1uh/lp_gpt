// Импортируем переменные окружения
require('dotenv').config();


const db = require('./database.js'); 
const express = require('express');
const cors = require('cors');
const { initializeAllKBs } = require('./services/kbService');

// Импортируем наши роуты
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const authMiddleware = require('./middleware/authMiddleware'); 
const teacherRoutes = require('./routes/teacherRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- РОУТЫ ---

// Подключаем роуты авторизации по префиксу 
app.use('/api/auth', authRoutes);
app.use('/api/projects', authMiddleware, projectRoutes); 
app.use('/api/teacher', authMiddleware, teacherRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// TODO: Здесь будут роуты для авторизации, проектов и т.д.

// --- ЗАПУСК СЕРВЕРА ---
app.listen(PORT, async () => { 
  console.log(`Server is listening on port ${PORT}`);
  await initializeAllKBs(); 
});