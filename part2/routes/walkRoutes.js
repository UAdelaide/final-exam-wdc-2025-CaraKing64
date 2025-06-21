const express = require('express');
const router = express.Router();
const db = require('../models/db');

// GET all walk requests (for walkers to view)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT wr.*, d.name AS dog_name, d.size, u.username AS owner_name
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to fetch walk requests' });
  }
});

// POST a new walk request (from owner)
router.post('/', async (req, res) => {
  //console.log(req.body);
  const { dog_name, requested_time, duration_minutes, location } = req.body;

  try {
    const [dog_id_list] = await db.query(`SELECT dog_id FROM Dogs WHERE name = ?`, [dog_name]);
    const [result] = await db.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location)
      VALUES (?, ?, ?, ?)
    `, [dog_id_list[0].dog_id, requested_time, duration_minutes, location]);

    res.status(201).json({ message: 'Walk request created', request_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create walk request' });
  }
});

// POST an application to walk a dog (from walker)
router.post('/:id/apply', async (req, res) => {
  const requestId = req.params.id;
  const { walker_id } = req.body;

  try {
    await db.query(`
      INSERT INTO WalkApplications (request_id, walker_id)
      VALUES (?, ?)
    `, [requestId, walker_id]);

    await db.query(`
      UPDATE WalkRequests
      SET status = 'accepted'
      WHERE request_id = ?
    `, [requestId]);

    res.status(201).json({ message: 'Application submitted' });
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ error: 'Failed to apply for walk' });
  }
});

router.get('/dogs', async (req, res) => {
  var username = req.session.username;
  // console.log(`Getting dogs for ${username}`);
  // run db query to find the dogs associated with this username
  const [row] = await db.query('SELECT dog_id, owner_id, name, size FROM (Dogs INNER JOIN Users ON Dogs.owner_id = Users.user_id) WHERE Users.username = ?', [username]);
  if (row.length === 0){ // if there are no dogs in the database for this username
    res.status(400).json({error: 'No dogs found for this user'});
  } else { // else, send the list of dogs that are in the database for this username
    res.send(row);
  }
});

// this route gets the information about all dogs.
// Additionally for ease of use, it includes some styling that the html/css use for index.html
router.get('/alldogs', async (req, res) => {
  // get the data from the database about all the dogs
  const [rows] = await db.execute('SELECT dog_id, name, size, owner_id FROM Dogs');
  if (rows.length < 1){
    res.status(500).json({error: 'No dogs in database'});
  } else {
    var dogs = [];
    for (let i = 0; i < rows.length; i++){
      var res2 = await fetch('https://dog.ceo/api/breeds/image/random');
      res2 = await res2.json();
      var dog = rows[i];
      dog.photo = res2.message;
      var colours = ['#e0e0e0', 'white'];
      dog.table_colour = colours[i%2];
      dog.alt = ''
      dogs.push(dog);
    }
    res.send(rows);
  }
});

module.exports = router;