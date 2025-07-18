const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

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
router.post('/knowledge-bases/:kbId/courses', (req, res) => {
  const kbId = parseInt(req.params.kbId, 10);
  const { topic } = req.body;
  const userId = req.user.userId;

  if (!topic) {
    return res.status(400).json({ error: "Не указана тема курса" });
  }

  const sql = `INSERT INTO courses (kb_id, user_id, topic) VALUES (?, ?, ?)`;
  
  // Создаем запись в таблице `courses`
  db.run(sql, [kbId, userId, topic], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Ошибка сервера при создании курса' });
    }
    
    const courseId = this.lastID;
    console.log(`User ${userId} created a new course "${topic}" with ID ${courseId} for KB #${kbId}`);
    
    // TODO: Здесь на следующем шаге мы будем вызывать AI для генерации плана
    // и сохранять его в поле `plan_json`

    // Возвращаем фронтенду созданный объект курса
    res.status(201).json({ 
      message: "Курс успешно создан в базе данных.",
      course: { id: courseId, name: topic }
    });
  });
});

module.exports = router;