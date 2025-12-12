const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./webzoo.db');

db.serialize(() => {
  // Drop if exist (for convenience)
  db.run("DROP TABLE IF EXISTS users");
  db.run("DROP TABLE IF EXISTS topics");
  db.run("DROP TABLE IF EXISTS questions");
  db.run("DROP TABLE IF EXISTS rewards");

  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT,
      password_hash TEXT
    )
  `);

  db.run(`
    CREATE TABLE topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      animal TEXT,
      description TEXT,
      emoji TEXT
    )
  `);

  db.run(`
    CREATE TABLE questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER,
      question_text TEXT,
      option_a TEXT,
      option_b TEXT,
      option_c TEXT,
      correct TEXT,
      FOREIGN KEY (topic_id) REFERENCES topics(id)
    )
  `);

  db.run(`
    CREATE TABLE rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      topic_id INTEGER,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, topic_id)
    )
  `);

  // Insert demo user
  db.run("INSERT INTO users (email) VALUES (?)", ["demo@webzoo.local"]);
 

  // Insert topics
  const topics = [
    ["HTML", "Жираф — Скелет (structure)", "HTML создаёт структуру страницы: заголовки, параграфы, секции.", "🦒"],
    ["CSS", "Хамелеон — Внешний вид (style)", "CSS отвечает за оформление: цвета, размеры, расположение.", "🦎"],
    ["JavaScript", "Обезьяна — Действие (behavior)", "JS оживляет страницу: события, логика, взаимодействие.", "🐒"],
    ["Internet", "Паук — Сеть (network)", "Интернет соединяет компьютеры — протоколы, DNS, HTTP.", "🕷"],
    ["API", "Голубь-почтальон — Данные (data)", "API — способ обмена данными между приложениями.", "🕊"]
  ];

  const insertTopic = db.prepare("INSERT INTO topics (name, animal, description, emoji) VALUES (?, ?, ?, ?)");
  topics.forEach(t => insertTopic.run(t[0], t[1], t[2], t[3]));
  insertTopic.finalize();

  // Insert simple questions for each topic (3 each)
  const qInsert = db.prepare(`
    INSERT INTO questions (topic_id, question_text, option_a, option_b, option_c, correct)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // HTML (topic_id = 1)
  qInsert.run(1, "Что описывает HTML?", "Внешний вид (цвета, шрифты)", "Структуру и содержимое документа", "Сеть и доступность", "b");
  qInsert.run(1, "для заголовка верхнего уровня:", "<h1>", "<p>", "<div>", "a");
  qInsert.run(1, "для ссылки:", "<img>", "<a>", "<link>", "b");

  // CSS (2)
  qInsert.run(2, "CSS отвечает за:", "Логические вычисления", "Структуру контента", "Визуальный стиль страницы", "c");
  qInsert.run(2, "Как подключают отдельный CSS-файл?", "<link rel='stylesheet' href='style.css'>", "<script src='style.css'>", "<css src='style.css'>", "a");
  qInsert.run(2, "Селектор по id начинается :", "#", ".", ":", "a");

  // JS (3)
  qInsert.run(3, "Что делает JavaScript на странице?", "Изменяет структуру базы данных", "Добавляет интерактивность и логику", "Выполняет рендер на сервере только", "b");
  qInsert.run(3, "Как объявить функцию в JS?", "function foo() {}", "def foo():", "fun foo() {}", "a");
  qInsert.run(3, "Событие 'click' срабатывает при:", "Клике мышки по элементу", "Загрузке страницы", "Изменении стилей", "a");

  // Internet (4)
  qInsert.run(4, "Что такое DNS?", "Система доменных имён", "Визуальная библиотека", "База данных браузера", "a");
  qInsert.run(4, "HTTP — это:", "Протокол для передачи гипертекста", "Язык программирования", "Фреймворк CSS", "a");
  qInsert.run(4, "IP-адрес нужен для:", "Идентификации устройства в сети", "Оптимизации CSS", "Сжатия картинок", "a");

  // API (5)
  qInsert.run(5, "API обычно используется для:", "Обмена данными между приложениями", "Рисования изображений", "Сжатия видео", "a");
  qInsert.run(5, "Ответ API чаще всего в формате:", "DOCX", "JSON", "BMP", "b");
  qInsert.run(5, "HTTP-метод для получения данных:", "GET", "POST", "DELETE", "a");

  qInsert.finalize();

  console.log("DB initialized with topics and questions.");
});

db.close();
