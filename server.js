const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./webzoo.db');
// Автоматическое обновление вопросов из unit.db.js

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// For demo: fixed user id
const DEMO_USER_ID = 1;

// --- API ---

// List topics
app.get('/api/topics', (req, res) => {
  db.all("SELECT id, name, animal, description, emoji FROM topics", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single topic
app.get('/api/topics/:id', (req, res) => {
  db.get("SELECT id, name, animal, description, emoji FROM topics WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// Get questions for topic
app.get('/api/topics/:id/questions', (req, res) => {
  db.all("SELECT id, question_text, option_a, option_b, option_c FROM questions WHERE topic_id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Submit quiz, returns { passed: boolean, correctCount, total }
app.post('/api/quiz/:topicId/submit', (req, res) => {
  const topicId = req.params.topicId;
  const answers = req.body.answers || {}; // expect object { questionId: 'a' ... }

  db.all("SELECT id, correct FROM questions WHERE topic_id = ?", [topicId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    let total = rows.length;
    let correctCount = 0;
    rows.forEach(q => {
      const userAns = (answers[q.id] || '').toLowerCase();
      if (userAns && userAns === q.correct.toLowerCase()) correctCount++;
    });

    const passed = correctCount === total; // require all correct (simple)
    res.json({ passed, correctCount, total });
  });
});

// Award reward (creates reward record if not exist)
app.post('/api/rewards/:topicId/claim', (req, res) => {
  const topicId = req.params.topicId;
  const userId = DEMO_USER_ID;

  // Insert if not exists
  db.run(
    `INSERT OR IGNORE INTO rewards (user_id, topic_id) VALUES (?, ?)`,
    [userId, topicId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        return res.json({ status: 'already', message: 'Уже получено' });
      } else {
        return res.json({ status: 'ok', message: 'Награда выдана' });
      }
    }
  );
});

// Get user rewards (collection)
app.get('/api/users/me/rewards', (req, res) => {
  const userId = DEMO_USER_ID;
  db.all(`
    SELECT t.id as topic_id, t.name, t.animal, t.emoji, r.received_at
    FROM rewards r
    JOIN topics t ON t.id = r.topic_id
    WHERE r.user_id = ?
  `, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Simple check: does user have reward for topic?
app.get('/api/users/me/rewards/:topicId', (req, res) => {
  const userId = DEMO_USER_ID;
  db.get("SELECT 1 FROM rewards WHERE user_id = ? AND topic_id = ?", [userId, req.params.topicId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ has: !!row });
  });
});

// Serve SPA fallback to index.html
app.get('*', (req, res) => {
  // If request is for API, it was handled above; else send index
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`WebZoo listening at http://localhost:${PORT}`));
