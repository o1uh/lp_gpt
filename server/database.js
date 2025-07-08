const sqlite3 = require('sqlite3').verbose();

// Указываем путь к файлу БД. Если его нет, он будет создан.
const DB_PATH = './architect_trainer.db';

// Подключаемся к базе данных
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Запускаем функцию создания таблиц при успешном подключении
    createTables();
  }
});

// Функция для создания таблиц
const createTables = () => {
  // Используем serialize, чтобы команды выполнялись последовательно
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

    // Таблица проектов
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Таблица для хранения состояний проекта (JSON-данные)
    // Это позволит в будущем реализовать историю версий
    db.run(`
      CREATE TABLE IF NOT EXISTS project_states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        nodes_json TEXT,
        edges_json TEXT,
        messages_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      )
    `);
    
    // Таблица для Базы Знаний
    db.run(`
      CREATE TABLE IF NOT EXISTS knowledge_bases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
      )
    `);

    // Таблица для файлов в Базе Знаний
    db.run(`
      CREATE TABLE IF NOT EXISTS kb_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kb_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        content TEXT,
        embedding BLOB, -- Место для хранения векторных представлений
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kb_id) REFERENCES knowledge_bases(id)
      )
    `);

    console.log('Tables created or already exist.');
  });
};

// Добавляем администратора, если его еще нет
const insertAdmin = 'INSERT OR IGNORE INTO users (login, role) VALUES (?, ?)';
db.run(insertAdmin, ['admin', 'admin'], (err) => {
  if(err) {
    console.error("Error inserting admin user", err.message);
  } else {
    console.log("Admin user created or already exists.");
  }
});

console.log('Tables created or already exist.');

// Экспортируем объект базы данных, чтобы использовать его в других файлах
module.exports = db;