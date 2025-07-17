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
        suggestions_json TEXT,
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
        FOREIGN KEY (kb_id) REFERENCES knowledge_bases(id)
      )
    `);
// --- ЗАПОЛНЯЕМ ДАННЫМИ ДЛЯ ПРИМЕРА ---
    db.serialize(() => {
        const insertKb = `INSERT OR IGNORE INTO knowledge_bases (id, name, description) VALUES (?, ?, ?)`;
        db.run(insertKb, [1, "Архитектурный онбординг", "Наш текущий проект для внутреннего обучения"]);
        db.run(insertKb, [2, "Проект 'Казино'", "Публичный продукт компании"]);

        const insertSource = `INSERT OR IGNORE INTO kb_sources (kb_id, path) VALUES (?, ?)`;
        // Источники для "Архитектурного онбординга"
        db.run(insertSource, [1, "./knowledge_base/common_docs"]);
        db.run(insertSource, [1, "./knowledge_base/gpt_arch"]); // Папка с кодом нашего проекта
        // Источники для "Казино"
        db.run(insertSource, [2, "./knowledge_base/common_docs"]);
        db.run(insertSource, [2, "./knowledge_base/project_casino"]);
        db.run(insertSource, [2, "./knowledge_base/admin_rules"]);
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