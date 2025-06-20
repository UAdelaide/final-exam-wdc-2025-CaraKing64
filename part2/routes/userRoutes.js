const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all users (for admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST a new user (simple signup)
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});

var options = { root: '.' };
// POST login
router.post('/login', async (req, res) => {
  if (req.session.isLoggedIn){
    // User is already logged in
    username = req.session.username;
    const [rows] = await db.query(`SELECT * FROM Users WHERE username = ?`, [username]);


  }
  const { username, password } = req.body;
  // Get the user with the provided username
  const [rows] = await db.query(`SELECT * FROM Users WHERE username = ?`, [username]);
  if (rows.length < 0){
    // The username wasn't found in the database
    res.status(400).json({error: 'Username not found'});
  } else if (rows.length > 1){
    // There are several users with the same username in the database
    console.log("Several users with same username in database");
    console.log(rows);
    res.status(500).json({error: 'Invalid user data'});
  } else if (password === rows[0].password_hash){
    // The password matched the username
    req.session.isLoggedIn = true;
    req.session.username = username;
    console.log(`${username} logged in`);
    if (rows[0].role === 'owner'){
      res.sendFile(`public/owner-dashboard.html`, options);
    } else if (rows[0].role === 'walker'){
      res.sendFile(`public/walker-dashboard.html`, options);
    } else {
      console.log("Has role that is neither owner nor walker");
      console.log(rows[0]);
      res.status(400).json({error: 'Invalid user data'});
    }
  } else {
    res.status(403).json({error: 'Password incorrect'});
  }
});

module.exports = router;