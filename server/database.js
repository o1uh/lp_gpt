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
      
      // Таблица для хранения курсов, созданных пользователями
      db.run(`
        CREATE TABLE IF NOT EXISTS courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          kb_id INTEGER NOT NULL, -- К какой Базе Знаний относится курс
          user_id INTEGER NOT NULL, -- Кто создал/проходит курс
          topic TEXT NOT NULL, -- Тема, введенная пользователем
          plan_json TEXT, -- Здесь будет храниться сгенерированный AI план
          status TEXT NOT NULL DEFAULT 'planning',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (kb_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      
      // Таблица для отслеживания прогресса по курсу
      db.run(`
        CREATE TABLE IF NOT EXISTS course_progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          course_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started', 'in_progress', 'completed')),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(course_id, user_id), 
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      
      // Таблица для хранения состояния КАЖДОГО отдельного шага
      db.run(`
        CREATE TABLE IF NOT EXISTS step_progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          course_progress_id INTEGER NOT NULL, 
          step_id TEXT NOT NULL, 
          status TEXT NOT NULL DEFAULT 'locked' CHECK(status IN ('locked', 'unlocked', 'completed')),
          messages_json TEXT,
          lesson_nodes_json TEXT,
          clarification_nodes_json TEXT,
          lesson_edges_json TEXT,
          clarification_edges_json TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (course_progress_id) REFERENCES course_progress(id) ON DELETE CASCADE
        )
      `);

      // НОВАЯ ТАБЛИЦА для сообщений главного чата курса
      db.run(`
        CREATE TABLE IF NOT EXISTS course_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          course_id INTEGER NOT NULL,
          sender TEXT NOT NULL CHECK(sender IN ('user', 'ai')),
          content TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
      `);


      const checkAdminSql = 'SELECT id FROM users WHERE id = 1';
      db.get(checkAdminSql, [], (err, row) => {
        if (err) return reject(err);

        // Если админа нет, значит, это самый первый запуск. Вставляем все данные.
        if (!row) {
          console.log('First run detected. Seeding initial data...');
          const insertAdmin = 'INSERT INTO users (id, login, role) VALUES (?, ?, ?)';
          db.run(insertAdmin, [1, 'admin', 'admin']);

          const insertKb = `INSERT INTO knowledge_bases (id, name, description) VALUES (?, ?, ?)`;
          db.run(insertKb, [1, "Архитектурный онбординг", "Наш текущий проект"]);
          db.run(insertKb, [2, "Проект 'Казино'", "Публичный продукт"]);

          const insertSource = `INSERT INTO kb_sources (kb_id, path) VALUES (?, ?)`;
          db.run(insertSource, [1, "knowledge_base/common_docs"]);
          db.run(insertSource, [1, "knowledge_base/gpt_arch"]);
          db.run(insertSource, [2, "knowledge_base/common_docs"]);
          db.run(insertSource, [2, "knowledge_base/project_casino"]);
          db.run(insertSource, [2, "knowledge_base/admin_rules"]);
        }
        db.run('SELECT 1', (err) => {
          if (err) {
            return reject(err);
          }
          console.log('Tables created or already exist.');
          resolve(); // Теперь Promise резолвится в правильный момент
        });
      });
    });
  });
};

// Экспортируем и подключение, и функцию создания
module.exports = { db, createTables };