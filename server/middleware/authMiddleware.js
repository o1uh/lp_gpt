const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  if (req.method === 'OPTIONS') {
    next();
  }
  try {
    // Ожидаем, что токен будет в заголовке Authorization в формате "Bearer <token>"
    const token = req.headers.authorization.split(' ')[1]; 
    if (!token) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }
    // Расшифровываем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Добавляем данные из токена в объект запроса, чтобы они были доступны в следующих обработчиках
    req.user = decoded; 
    next(); // Передаем управление дальше
  } catch (e) {
    res.status(401).json({ message: 'Пользователь не авторизован' });
  }
};