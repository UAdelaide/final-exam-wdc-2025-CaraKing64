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

router.get('/me', async (req, res) => {
  //console.log(req.session);
  if (!req.session.username) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  const [row] = await db.query(`SELECT user_id, username, email, role, created_at FROM Users WHERE Username = ?`, [req.session.username]);
  if (row.length < 1){ // if there is not a user with this username
    res.status(500).json({error: 'No user exists in the database with your username'});
  } else if (row.length > 1){ // if there is more than 1 user with this username
    res.status(500).json({error: 'More than 1 user exists in the database with your username'});
  } else { // else, if there's only one, send the data about it
    res.send(row[0]);
  }
});

var options = { root: '.' };
// POST login
router.post('/login', async (req, res) => {
  var username;
  var password;
  if (req.session.isLoggedIn){
    // User is already logged in
    username = req.session.username;
    // Get the user with the provided username
    const [rows] = await db.query(`SELECT * FROM Users WHERE username = ?`, [username]);
    if (rows[0].role === 'owner'){ // user is owner so it sends the owner dashboard
      res.sendFile(`public/owner-dashboard.html`, options);
    } else if (rows[0].role === 'walker'){ // user is walker so it sends the walker dashboard
      res.sendFile(`public/walker-dashboard.html`, options);
    } else { // user is somehow not owner or walker
      console.log("Has role that is neither owner nor walker");
      console.log(rows[0]);
      res.status(400).json({error: 'Invalid user data'});
    }
  } else {
    username = req.body.username;
    password = req.body.password;
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
    } else if (password === rows[0].password_hash){ // username correct and password matched
      // set session variables
      req.session.isLoggedIn = true;
      req.session.username = username;
      console.log(`${username} logged in`);
      if (rows[0].role === 'owner'){ // user is owner so it sends the owner dashboard
        res.sendFile(`public/owner-dashboard.html`, options);
      } else if (rows[0].role === 'walker'){ // user is walker so it sends the walker dashboard
        res.sendFile(`public/walker-dashboard.html`, options);
      } else { // user is somehow not owner or walker
        console.log("Has role that is neither owner nor walker");
        console.log(rows[0]);
        res.status(400).json({error: 'Invalid user data'});
      }
    } else { // username correct but password didn't match
      res.status(403).json({error: 'Password incorrect'});
    }
  }
});

router.post('/logout', async (req, res) => {
  console.log(`${req.session.username} logged out`);
  req.session.destroy(function(err) { // destroy the req session so that anything that tries to reference the session will fail
    if (err){ // if the session is already destroyed
      console.log("Unable to access session");
      console.log(err);
    }
  });
  res.sendFile('public/index.html', options); // send login screen
});

module.exports = router;