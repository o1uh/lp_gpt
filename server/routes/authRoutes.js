const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database.js');

// --- Эндпоинт для входа в систему: POST /api/auth/login ---
router.post('/login', (req, res) => {
  const { login, password } = req.body;

  // Проверяем, что логин и пароль переданы
  if (!login || !password) {
    return res.status(400).json({ message: 'Пожалуйста, введите логин и пароль' });
  }

  // Ищем пользователя в базе данных
  const sql = 'SELECT * FROM users WHERE login = ?';
  db.get(sql, [login], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
    // Если пользователь не найден
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    // Если у пользователя еще нет пароля (первый вход)
    if (!user.password_hash) {
      return res.status(401).json({ message: 'Это ваш первый вход. Установите пароль.' });
    }

    // Сравниваем переданный пароль с хешем в базе
    const isPasswordCorrect = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Неверный пароль' });
    }

    // Если все верно, создаем JWT токен
    const token = jwt.sign(
      { userId: user.id, role: user.role }, // Данные, которые мы зашифруем в токен
      process.env.JWT_SECRET, // Секретный ключ (добавим его в .env)
      { expiresIn: '24h' } // Срок жизни токена
    );

    // Отправляем токен клиенту
    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: { id: user.id, login: user.login, role: user.role }
    });
  });
});


// --- Эндпоинт для установки пароля при первом входе: POST /api/auth/set-initial-password ---
router.post('/set-initial-password', (req, res) => {
  const { login, newPassword } = req.body;

  if (!login || !newPassword) {
    return res.status(400).json({ message: 'Необходимо указать логин и новый пароль' });
  }

  // Ищем пользователя, у которого еще нет пароля
  const findSql = 'SELECT * FROM users WHERE login = ? AND password_hash IS NULL';
  db.get(findSql, [login], (err, user) => {
    if (err) { return res.status(500).json({ message: 'Ошибка сервера' }); }
    if (!user) { return res.status(404).json({ message: 'Пользователь не найден или пароль уже установлен' }); }

    // Хешируем новый пароль
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword, salt);

    // Обновляем запись в базе данных
    const updateSql = 'UPDATE users SET password_hash = ? WHERE id = ?';
    db.run(updateSql, [passwordHash, user.id], function(err) {
      if (err) { return res.status(500).json({ message: 'Не удалось установить пароль' }); }
      res.status(200).json({ message: 'Пароль успешно установлен. Теперь вы можете войти.' });
    });
  });
});


module.exports = router;