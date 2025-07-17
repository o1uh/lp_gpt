const sqlite3 = require('sqlite3').verbose();

// Указываем путь к файлу БД. Если его нет, он будет создан.
const DB_PATH = './architect_trainer.db';

// Подключаемся к базе данных
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Функция для создания таблиц
const createTables = () => {
  // Мы возвращаем Promise, чтобы знать, когда все таблицы точно будут созданы
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log('Creating tables if they do not exist...');
      
      // Таблица пользователей
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          login TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Таблица проектов "Ассистента"
      db.run(`
        CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Таблица для хранения состояний проектов "Ассистента"
      db.run(`
        CREATE TABLE IF NOT EXISTS project_states (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          nodes_json TEXT,
          edges_json TEXT,
          messages_json TEXT,
          suggestions_json TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
      `);
      
      // Таблица для описания "учебных проектов" (Баз Знаний)
      db.run(`
        CREATE TABLE IF NOT EXISTS knowledge_bases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT
        )
      `);

      // Таблица, связывающая Базы Знаний с папками на диске
      db.run(`
        CREATE TABLE IF NOT EXISTS kb_sources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          kb_id INTEGER NOT NULL,
          path TEXT NOT NULL,
          description TEXT,
          FOREIGN KEY (kb_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE
        )
      `);

      // Добавляем администратора, если его еще нет
      const insertAdmin = 'INSERT OR IGNORE INTO users (id, login, role) VALUES (?, ?, ?)';
      db.run(insertAdmin, [1, 'admin', 'admin']);

      // Добавляем учебные проекты (Базы Знаний)
      const insertKb = `INSERT OR IGNORE INTO knowledge_bases (id, name, description) VALUES (?, ?, ?)`;
      db.run(insertKb, [1, "Архитектурный онбординг", "Наш текущий проект для внутреннего обучения"]);
      db.run(insertKb, [2, "Проект 'Казино'", "Публичный продукт компании"]);

      // Добавляем источники данных для этих БЗ
      const insertSource = `INSERT OR IGNORE INTO kb_sources (kb_id, path) VALUES (?, ?)`;
      db.run(insertSource, [1, "knowledge_base/common_docs"]);
      db.run(insertSource, [1, "knowledge_base/gpt_arch"]);
      db.run(insertSource, [2, "knowledge_base/common_docs"]);
      db.run(insertSource, [2, "knowledge_base/project_casino"]);
      
      // Последняя команда. Когда она завершится, мы считаем, что все готово.
      db.run(insertSource, [2, "knowledge_base/admin_rules"], (err) => {
        if (err) {
            console.error("Error finalizing table creation:", err);
            return reject(err);
        }
        console.log('Tables created or already exist.');
        resolve(); // Сообщаем Promise, что все успешно завершено
      });
    });
  });
};

// Экспортируем и подключение, и функцию создания
module.exports = { db, createTables };