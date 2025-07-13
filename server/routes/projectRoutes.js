const express = require('express');
const router = express.Router();
const db = require('../database.js');

// GET /api/projects - Получить список проектов пользователя
router.get('/', (req, res) => {
  const userId = req.user.userId; // Получаем из middleware
  const sql = `SELECT id, name, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC`;
  db.all(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/projects/:id - Получить последнее состояние проекта
router.get('/:id', (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.userId;
  // Проверяем, что проект принадлежит текущему пользователю
  const checkOwnerSql = 'SELECT user_id FROM projects WHERE id = ?';
  db.get(checkOwnerSql, [projectId], (err, project) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!project || project.user_id !== userId) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    // Если все в порядке, получаем последнее состояние
    const sql = `SELECT * FROM project_states WHERE project_id = ? ORDER BY created_at DESC LIMIT 1`;
    db.get(sql, [projectId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    });
  });
});

// POST /api/projects - Создать новый проект
router.post('/', (req, res) => {
  const { name } = req.body;
  const userId = req.user.userId;

  const projectSql = 'INSERT INTO projects (user_id, name) VALUES (?, ?)';
  
  // Просто создаем запись в таблице `projects` и возвращаем ID
  db.run(projectSql, [userId, name || 'Новый проект'], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const projectId = this.lastID;
    // НЕ создаем здесь начальное состояние. Просто отвечаем.
    res.status(201).json({ id: projectId, name: name || 'Новый проект' });
  });
});

// PUT /api/projects/:id - Обновить/сохранить проект
router.put('/:id', (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.userId;
    const { nodes, edges, messages, suggestions } = req.body;
    
    // Проверяем, что проект принадлежит текущему пользователю
    const checkOwnerSql = 'SELECT user_id FROM projects WHERE id = ?';
    db.get(checkOwnerSql, [projectId], (err, project) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!project || project.user_id !== userId) {
            return res.status(403).json({ error: "Доступ запрещен" });
        }
        
        const updateProjectSql = 'UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        db.run(updateProjectSql, [projectId]);
        
        const stateSql = 'INSERT INTO project_states (project_id, nodes_json, edges_json, messages_json, suggestions_json) VALUES (?, ?, ?, ?, ?)';
        db.run(stateSql, [projectId, JSON.stringify(nodes), JSON.stringify(edges), JSON.stringify(messages), JSON.stringify(suggestions)], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: 'Проект успешно сохранен' });
        });
    });
});

module.exports = router;