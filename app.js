import express from "express";
import pg from 'pg';
import axios from 'axios';
import bodyParser from 'body-parser'

const app = express();
const port = 3000;
// const config = {
//   type: 'sparkline',
//   data: {
//     datasets: [{
//       data: ['12.93297', '13.22083', '13.96894', '14.14472', '14.33402', '14.00781', '13.10215', '12.46830', '11.78568', '10.96955', '10.97333', '11.40577', '11.21083', '11.12855', '11.45648', '11.80963', '12.39805', '13.03173', '11.91138', '10.51463', '9.01044', '9.14316', '9.28610', '9.80866', '10.44900', '10.39581', '10.62092', '10.86336', '11.67024', '11.84780']
//     }]
//   }
// }

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "stalker",
    password: "JDjd28690406$$",
    port: 5432,
  });

const name_taken = false
const error = 'Username already esists'

db.connect();

const response = await db.query("SELECT username FROM auth");

let current_users = [];

response.rows.forEach((username) => {
  current_users.push(username.email);
});

db.end();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  res.render('index.ejs', { name_taken: name_taken });
});

app.post('/sign-up', async (req, res) => {

  const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "stalker",
    password: "JDjd28690406$$",
    port: 5432,
  });

  db.connect();

  current_users.forEach(user => {

    if (user == req.body.username) {

      name_taken = true;

    }
    
  });

  if (name_taken == false) {

    await db.query(
      "INSERT INTO auth (username, password) VALUES ($1, $2)", [req.body.username, req.body.password]
    );

  }

  db.end();
  
  res.render('index.ejs', { error: error, name_taken: name_taken });

});

app.listen(3000, () => {
    console.log(`Server running on port ${port}.`);
});

