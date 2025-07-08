// Импортируем переменные окружения
require('dotenv').config();

const db = require('./database.js'); 
const express = require('express');
const cors = require('cors');

// Импортируем наши роуты
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- РОУТЫ ---

// Подключаем роуты авторизации по префиксу /api/auth
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// TODO: Здесь будут роуты для авторизации, проектов и т.д.

// --- ЗАПУСК СЕРВЕРА ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});