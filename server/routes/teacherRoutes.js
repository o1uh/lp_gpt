const express = require('express');
const router = express.Router();
const db = require('../database.js');

// GET /api/teacher/knowledge-bases - Получить список всех "учебных проектов"
router.get('/knowledge-bases', (req, res) => {
  const sql = `SELECT id, name, description FROM knowledge_bases ORDER BY name ASC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Ошибка сервера при получении баз знаний' });
    }
    res.json(rows);
  });
});

// GET /api/teacher/knowledge-bases/:kbId/courses - Получить список курсов для конкретной БЗ
// TODO: Заменить фейковые данные на реальные запросы к таблице `courses`
router.get('/knowledge-bases/:kbId/courses', (req, res) => {
  const kbId = parseInt(req.params.kbId, 10);
  
  // Фейковые данные (заглушка), пока мы не создали таблицу курсов
  const coursesData = {
    1: [ { id: 201, name: "База данных (v1)" }, { id: 202, name: "Авторизация (v1)" } ],
    2: [ { id: 301, name: "Платежные шлюзы" } ],
  };

  res.json(coursesData[kbId] || []);
});

// POST /api/teacher/knowledge-bases/:kbId/courses - Создать новый курс по теме
// TODO: Реализовать сохранение в БД и запуск генерации плана AI
router.post('/knowledge-bases/:kbId/courses', (req, res) => {
  const kbId = parseInt(req.params.kbId, 10);
  const { topic } = req.body;
  const userId = req.user.userId;

  if (!topic) {
    return res.status(400).json({ error: "Не указана тема курса" });
  }

  console.log(`Получен запрос на создание курса по теме "${topic}" для БЗ с ID ${kbId} от пользователя ${userId}`);
  
  // Возвращаем фейковый успешный ответ, имитируя создание
  res.status(201).json({ 
    message: "Курс успешно создан (симуляция)",
    course: { id: Date.now(), name: topic } // Возвращаем фейковый объект курса
  });
});

module.exports = router;