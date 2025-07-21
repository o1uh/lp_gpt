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
router.get('/knowledge-bases/:kbId/courses', (req, res) => {
  const kbId = parseInt(req.params.kbId, 10);
  const userId = req.user.userId; // Мы получаем пользователя из middleware
  
  const sql = 'SELECT id, topic as name FROM courses WHERE kb_id = ? AND user_id = ? ORDER BY created_at DESC';
  
  db.all(sql, [kbId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Ошибка сервера' });
    res.json(rows);
  });
});

// POST /api/teacher/knowledge-bases/:kbId/courses - Создать новый курс (без плана)
router.post('/knowledge-bases/:kbId/courses', (req, res) => {
  const kbId = parseInt(req.params.kbId, 10);
  const { topic } = req.body;
  const userId = req.user.userId;
  // Теперь эта функция создает курс со статусом 'planning' и БЕЗ плана
  const sql = `INSERT INTO courses (kb_id, user_id, topic, status) VALUES (?, ?, ?, 'planning')`;
  
  db.run(sql, [kbId, userId, topic], function(err) {
    if (err) return res.status(500).json({ error: 'Ошибка сервера' });
    res.status(201).json({ course: { id: this.lastID, name: topic } });
  });
});

// НОВЫЙ ЭНДПОИНТ: PUT /api/teacher/courses/:courseId/approve - Утвердить план
router.put('/courses/:courseId/approve', (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const { plan } = req.body;
  const userId = req.user.userId;

  // TODO: Добавить проверку, что курс принадлежит userId

  const planJson = JSON.stringify(plan);
  const sql = `UPDATE courses SET plan_json = ?, status = 'approved' WHERE id = ?`;
  
  db.run(sql, [planJson, courseId], function(err) {
    if (err) return res.status(500).json({ error: 'Ошибка сохранения плана' });
    res.status(200).json({ message: 'План успешно утвержден' });
  });
});

// GET /api/teacher/courses/:courseId - Получить полную (почти) информацию о курсе
router.get('/courses/:courseId', (req, res) => {
    // TODO: Добавить проверку владения курсом
    const courseId = req.params.courseId;

    const courseSql = 'SELECT * FROM courses WHERE id = ?';
    const messagesSql = 'SELECT id, sender, content as text FROM course_messages WHERE course_id = ? ORDER BY timestamp ASC';

    db.get(courseSql, [courseId], (err, course) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        if (!course) return res.status(404).json({ error: 'Курс не найден' });

        db.all(messagesSql, [courseId], (err, messages) => {
            if (err) return res.status(500).json({ error: 'Ошибка сервера' });
            
            res.json({
                course: {
                    id: course.id,
                    topic: course.topic,
                    status: course.status,
                    plan: JSON.parse(course.plan_json || '[]')
                },
                messages: messages
            });
        });
    });
});

// POST /api/teacher/courses/:courseId/messages - Отправить сообщение в главный чат
router.post('/courses/:courseId/messages', (req, res) => {
    // TODO: Добавить проверку владения курсом
    const courseId = req.params.courseId;
    const { sender, text } = req.body;
    const sql = 'INSERT INTO course_messages (course_id, sender, content) VALUES (?, ?, ?)';
    db.run(sql, [courseId, sender, text], function(err) {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        // TODO: Здесь будет вызов AI для ответа
        res.status(201).json({ id: this.lastID });
    });
});

module.exports = router;