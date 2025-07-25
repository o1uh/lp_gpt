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

// PUT /api/teacher/courses/:courseId/approve - Утвердить план
router.put('/courses/:courseId/approve', (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const { plan } = req.body;
  const userId = req.user.userId;

  const planJson = JSON.stringify(plan);
  const updateCourseSql = `UPDATE courses SET plan_json = ?, status = 'approved' WHERE id = ? AND user_id = ?`;
  
  db.run(updateCourseSql, [planJson, courseId, userId], function(err) {
    if (err) return res.status(500).json({ error: 'Ошибка сохранения плана' });
    if (this.changes === 0) return res.status(403).json({ error: "Доступ запрещен или курс не найден"});

    // Создаем запись в course_progress
    const progressSql = `INSERT INTO course_progress (course_id, user_id, status) VALUES (?, ?, 'in_progress')`;
    db.run(progressSql, [courseId, userId], function(err) {
        if (err) return res.status(500).json({ error: 'Ошибка инициализации прогресса' });
        
        const courseProgressId = this.lastID;
        
        // Создаем записи для каждого шага в step_progress
        const stepSql = `INSERT INTO step_progress (course_progress_id, step_id, status) VALUES (?, ?, ?)`;
        plan.forEach((step, index) => {
            // Первый шаг делаем разблокированным, остальные - заблокированными
            const status = index === 0 ? 'unlocked' : 'locked';
            db.run(stepSql, [courseProgressId, step.id, status]);
        });
        
        res.status(200).json({ message: 'План успешно утвержден и прогресс инициализирован' });
    });
  });
});

// GET /api/teacher/courses/:courseId - Получить полную информацию о курсе
router.get('/courses/:courseId', (req, res) => {
    const courseId = parseInt(req.params.courseId, 10);
    const userId = req.user.userId;

    // Сначала получаем основную информацию о курсе
    const courseSql = 'SELECT * FROM courses WHERE id = ? AND user_id = ?';
    db.get(courseSql, [courseId, userId], (err, course) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Ошибка сервера при поиске курса' });
        }
        if (!course) {
            return res.status(404).json({ error: 'Курс не найден или у вас нет к нему доступа' });
        }

        // Затем получаем сообщения главного чата этого курса
        const messagesSql = 'SELECT id, sender, content as text FROM course_messages WHERE course_id = ? ORDER BY timestamp ASC';
        db.all(messagesSql, [courseId], (err, messages) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Ошибка сервера при загрузке сообщений' });
            }

            // Затем получаем прогресс по всем шагам этого курса для данного пользователя
            const progressSql = `
                SELECT sp.step_id, sp.status
                FROM course_progress cp
                JOIN step_progress sp ON cp.id = sp.course_progress_id
                WHERE cp.course_id = ? AND cp.user_id = ?
            `;
            db.all(progressSql, [courseId, userId], (err, stepsProgress) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Ошибка сервера при загрузке прогресса' });
                }

                // Объединяем план из курса с данными о прогрессе
                const planFromDb = JSON.parse(course.plan_json || '[]');
                const planWithProgress = planFromDb.map(step => {
                    const progress = stepsProgress.find(s => s.step_id === step.id);
                    return {
                        ...step,
                        // Если прогресса для шага нет, считаем его заблокированным
                        status: progress ? progress.status : 'locked' 
                    };
                });

                // Собираем и отправляем финальный ответ
                res.json({
                    course: {
                        id: course.id,
                        topic: course.topic,
                        status: course.status,
                        plan: planWithProgress // Отправляем план, обогащенный статусами
                    },
                    messages: messages
                });
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

// PUT /api/teacher/courses/:courseId/plan - Обновить JSON плана
router.put('/courses/:courseId/plan', (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const { plan } = req.body; // Ожидаем только plan
  const userId = req.user.userId;

  // TODO: Добавить проверку, что курс принадлежит userId

  if (!plan) {
    return res.status(400).json({ error: "План не может быть пустым" });
  }

  const planJson = JSON.stringify(plan);
  const sql = `UPDATE courses SET plan_json = ? WHERE id = ?`;
  
  db.run(sql, [planJson, courseId], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Ошибка обновления плана' });
    }
    res.status(200).json({ message: 'План успешно обновлен' });
  });
});

// GET /api/teacher/steps/:stepProgressId - Получить полное состояние шага (сообщения, схемы)
router.get('/steps/:stepProgressId', (req, res) => {
    // TODO: Проверка владения
    const stepProgressId = req.params.stepProgressId;
    const sql = 'SELECT * FROM step_progress WHERE id = ?';
    db.get(sql, [stepProgressId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.json(row);
    });
});

// PUT /api/teacher/steps/:stepProgressId/complete - Пометить шаг как пройденный
router.put('/steps/:stepProgressId/complete', (req, res) => {
    // TODO: Проверка владения
    const stepProgressId = req.params.stepProgressId;
    const sql = `UPDATE step_progress SET status = 'completed' WHERE id = ?`;
    db.run(sql, [stepProgressId], function(err) {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        res.status(200).json({ message: 'Шаг завершен' });
    });
});

// PUT /api/teacher/steps/:stepProgressId - Сохранить текущее состояние шага
router.put('/steps/:stepProgressId', (req, res) => {
    const stepProgressId = parseInt(req.params.stepProgressId, 10);
    const userId = req.user.userId;
    const { messages, lessonNodes, lessonEdges, clarificationNodes, clarificationEdges } = req.body;

    // TODO: Добавить проверку, что stepProgressId принадлежит курсу, который принадлежит userId

    const sql = `
        UPDATE step_progress SET
            messages_json = ?,
            lesson_nodes_json = ?,
            lesson_edges_json = ?,
            clarification_nodes_json = ?,
            clarification_edges_json = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    const params = [
        JSON.stringify(messages),
        JSON.stringify(lessonNodes),
        JSON.stringify(lessonEdges),
        JSON.stringify(clarificationNodes),
        JSON.stringify(clarificationEdges),
        stepProgressId
    ];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Ошибка сохранения прогресса шага' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Запись о прогрессе шага не найдена' });
        }
        res.status(200).json({ message: 'Прогресс шага успешно сохранен' });
    });
});

module.exports = router;