const express = require('express');
const router = express.Router();
const { db } = require('../database.js');

// ===================================================
//  РОУТЫ БЕЗ ПАРАМЕТРОВ (/api/projects)
// ===================================================

// GET /api/projects - Получить список всех проектов пользователя
router.get('/', (req, res) => {
  const userId = req.user.userId;
  const sql = `SELECT id, name, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC`;
  db.all(sql, [userId], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Ошибка сервера при получении проектов' });
    }
    res.json(rows);
  });
});

// POST /api/projects - Создать новый проект
router.post('/', (req, res) => {
  const { name } = req.body;
  const userId = req.user.userId;
  const projectSql = 'INSERT INTO projects (user_id, name) VALUES (?, ?)';
  
  db.run(projectSql, [userId, name || 'Новый проект'], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Ошибка сервера при создании проекта' });
    }
    const projectId = this.lastID;
    res.status(201).json({ id: projectId, name: name || 'Новый проект' });
  });
});

// ===================================================
//  РОУТЫ С КОНКРЕТНЫМИ ПУТЯМИ ПОСЛЕ ID (/api/projects/:id/...)
// ===================================================

// PATCH /api/projects/:id/rename - Переименовать проект
router.patch('/:id/rename', (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.userId;
    const { newName } = req.body;

    if (!newName || newName.trim() === '') {
        return res.status(400).json({ error: 'Новое имя не может быть пустым' });
    }

    const checkOwnerSql = 'SELECT user_id FROM projects WHERE id = ?';
    db.get(checkOwnerSql, [projectId], (err, project) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!project || project.user_id !== userId) {
            return res.status(403).json({ error: "Доступ запрещен" });
        }

        const renameSql = 'UPDATE projects SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        db.run(renameSql, [newName, projectId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: 'Проект успешно переименован' });
        });
    });
});

// ===================================================
//  РОУТЫ ТОЛЬКО С ПАРАМЕТРОМ ID (/api/projects/:id)
// ===================================================

// GET /api/projects/:id - Получить последнее состояние проекта
router.get('/:id', (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.userId;

  const checkOwnerSql = 'SELECT user_id FROM projects WHERE id = ?';
  db.get(checkOwnerSql, [projectId], (err, project) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!project || project.user_id !== userId) {
      return res.status(403).json({ error: "Доступ запрещен" });
    }

    const sql = `SELECT * FROM project_states WHERE project_id = ? ORDER BY created_at DESC LIMIT 1`;
    db.get(sql, [projectId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row || {}); // Возвращаем пустой объект, если состояний нет
    });
  });
});

// PUT /api/projects/:id - Обновить/сохранить проект
router.put('/:id', (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.userId;
    const { nodes, edges, messages, suggestions } = req.body;

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

// DELETE /api/projects/:id - Удалить проект
router.delete('/:id', (req, res) => {
    const projectId = req.params.id;
    const userId = req.user.userId;

    const checkOwnerSql = 'SELECT user_id FROM projects WHERE id = ?';
    db.get(checkOwnerSql, [projectId], (err, project) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!project || project.user_id !== userId) {
            return res.status(403).json({ error: "Доступ запрещен" });
        }

        db.serialize(() => {
            const deleteStatesSql = 'DELETE FROM project_states WHERE project_id = ?';
            db.run(deleteStatesSql, [projectId], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                
                const deleteProjectSql = 'DELETE FROM projects WHERE id = ?';
                db.run(deleteProjectSql, [projectId], (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.status(200).json({ message: 'Проект успешно удален' });
                });
            });
        });
    });
});

module.exports = router;