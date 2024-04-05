import express, { response } from "express";
import session from "express-session";
import sqlite3 from "sqlite3";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const api_key = '46acf3ff0eac49e385eb6e756b7b7e4e'

// const config = {
//   type: 'sparkline',
//   data: {
//     datasets: [{
//       data: ['12.93297', '13.22083', '13.96894', '14.14472', '14.33402', '14.00781', '13.10215', '12.46830', '11.78568', '10.96955', '10.97333', '11.40577', '11.21083', '11.12855', '11.45648', '11.80963', '12.39805', '13.03173', '11.91138', '10.51463', '9.01044', '9.14316', '9.28610', '9.80866', '10.44900', '10.39581', '10.62092', '10.86336', '11.67024', '11.84780']
//     }]
//   }
// }

const db = new sqlite3.Database("./data/stalker.db", (err) => {
  if (err) {
    console.log("Could not connect to database");
  } else {
    console.log("Connection successful");
  }
});

let check = true;

async function select(query, params) {
  try {
    const rows = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          console.log("unable to access data from database");
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    return rows;
  } catch (err) {
    console.error(err);
  }
}

async function insert(query, params) {
  try {
    const rows = await new Promise((resolve, rejec) => {
      db.run(query, params, function (err) {
        if (err) {
          console.log("unable to insert data from database");
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
    return rows;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

app.use(
  session({
    secret: "aniamtedCrutons486",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

app.get("/", async (req, res) => {
  res.render("index.ejs", { name_taken: "" });
});

app.post("/sign-up", async (req, res) => {
  const db = new sqlite3.Database("./data/stalker.db", (err) => {
    if (err) {
      console.log("Could not connect to database");
    } else {
      console.log("Connection successful");
    }
  });

  const response = await select("SELECT * FROM auth");
  const current_users = response.map((user) => user.username);
  const name_taken = current_users.includes(req.body.new_username);

  console.log(name_taken);
  console.log(current_users);

  if (!name_taken) {
    await insert("INSERT INTO auth (username, password) VALUES ($1, $2)", [
      req.body.new_username,
      req.body.new_password,
    ]);
  }

  db.close();

  res.render("index.ejs", {
    name_taken: name_taken,
    username: req.body.new_username,
  });
});

app.post("/login", async (req, res) => {
  const db = new sqlite3.Database("./data/stalker.db", (err) => {
    if (err) {
      console.log("Could not connect to database");
    } else {
      console.log("Connection successful");
    }
  });

  /* authentication */

  const user = await select("SELECT * FROM auth WHERE username = $1", [
    req.body.username,
  ]);

  let exists = false;

  console.log(user);

  /* directs to user page */

  if (user[0].password == req.body.password) {
    /* check for user profile information */

    const user_check = await select("SELECT * FROM profile");

    for (let i = 0; i < user_check.length; i++) {
      if (user_check[i].username.includes(req.body.username)) {
        exists = true;
      }
    }

    /* profile setup */

    var startQuestion = false;

    /* pass username incase of setup */

    const username = req.body.username;
    req.session.username = username;

    const pref = req.body.selection;
    req.session.selection = pref;
    console.log("username-saved", { username }, "selection-saved", { pref });

    /* insert data into profile table as needed */

    if (exists === true) {
      const profile = await select(
        "SELECT * FROM profile WHERE username = ($1)",
        [req.body.username]
      );

      if (profile[0].stock_pref !== null) {
        const preferred_stocks = await select(
          `SELECT * FROM ${profile[0].stock_pref.toLowerCase()}`
        );

        /* filter options config */

        let countries = [];
        let exchanges = [];
        let currencies = [];
        let currency_base = [];
        let currency_quote = [];
        let currency_group = [];

        if (
          profile[0].stock_pref === "Equities" ||
          profile[0].stock_pref === "Index" ||
          profile[0].stock_pref === "ETFs"
        ) {
          for (let i = 0; i < preferred_stocks.length; i++) {
            countries.push(preferred_stocks[i].country);
            exchanges.push(preferred_stocks[i].exchange);
            currencies.push(preferred_stocks[i].currency);
          }

          countries = [...new Set(countries)];
          currencies = [...new Set(currencies)];
          exchanges = [...new Set(exchanges)];
        } else if (profile[0].stock_pref === "Crypto") {
          for (let i = 0; i < preferred_stocks.length; i++) {
            currency_base.push(preferred_stocks[i].currency_base);
            currency_quote.push(preferred_stocks[i].currency_quote);
          }

          currency_base = [...new Set(currency_base)];
          currency_quote = [...new Set(currency_quote)];
        } else if (profile[0].stock_pref === "Forex") {
          for (let i = 0; i < preferred_stocks.length; i++) {
            currency_base.push(preferred_stocks[i].currency_base);
            currency_group.push(preferred_stocks[i].currency_group);
          }

          currency_base = [...new Set(currency_base)];
          currency_group = [...new Set(currency_group)];
        }

        /* API calls */

          let stocks = [];
          for (let i = 0; i < 5; i++) {
           stocks.push(preferred_stocks[i].symbol[Math.floor(Math.random() * preferred_stocks.length)]);
          }

        const stock_data = await axios.get('https://api.twelvedata.com/time_series?symbol=AAPL&interval=1min&apikey=' + api_key)
        console.log(stock_data);

        res.render("home.ejs", {
          profile: profile,
          setup: startQuestion,
          preferred_stocks: preferred_stocks,
          stock_data: stock_data.data,
          stocks: stocks,
          countries: countries,
          currencies: currencies,
          exchanges: exchanges,
          currency_quote: currency_quote,
          currency_base: currency_base,
          currency_group: currency_group,
        });
      } else {
        startQuestion = true;
        res.render("home.ejs", { profile: profile, setup: startQuestion });
      }

      console.log("yup");
    } else {
      startQuestion = true;

      await insert("INSERT INTO profile (username) VALUES ($1)", [
        req.body.username,
      ]);

      const profile = await select(
        "SELECT * FROM profile WHERE username = ($1)",
        [req.body.username]
      );

      res.render("home.ejs", { profile: profile, setup: startQuestion });
    }
  } else {
    /* auth fail */

    check = false;

    res.render("index.ejs", {
      name_taken: name_taken,
      check: check,
      username: req.body.new_username,
    });
  }

  db.close();
});

app.post("/user-setup", async (req, res) => {
  const db = new sqlite3.Database("./data/stalker.db", (err) => {
    if (err) {
      console.log("Could not connect to database");
    } else {
      console.log("Connection successful");
    }
  });

  console.log("request", req.body);

  const username = req.session.username;
  console.log("passed", username);

  const pref = req.body.selection;
  console.log(pref);

  var startQuestion = false;

  /* insert form data */

  console.log(req.body.name);

  const update = await insert(
    "UPDATE profile SET name = $1, stock_pref = $2 WHERE username = $3 ",
    [req.body.name, pref, username]
  );

  /* grab user profile */

  const profile = await select("SELECT * FROM profile WHERE username = ($1)", [
    username,
  ]);

  const preferred_stocks = await select(
    `SELECT * FROM ${profile[0].stock_pref.toLowerCase()}`
  );

  /* filter options config */

  let countries = [];
  let exchanges = [];
  let currencies = [];
  let currency_base = [];
  let currency_quote = [];
  let currency_group = [];

  if (
    profile[0].stock_pref === "Equities" ||
    profile[0].stock_pref === "Index" ||
    profile[0].stock_pref === "ETFs"
  ) {

    for (let i = 0; i < preferred_stocks.length; i++) {
      countries.push(preferred_stocks[i].country);
      exchanges.push(preferred_stocks[i].exchange);
      currencies.push(preferred_stocks[i].currency);
    }

    countries = [...new Set(countries)];
    currencies = [...new Set(currencies)];
    exchanges = [...new Set(exchanges)];

  } else if (profile[0].stock_pref === "Crypto") {

    for (let i = 0; i < preferred_stocks.length; i++) {
      currency_base.push(preferred_stocks[i].currency_base);
      currency_quote.push(preferred_stocks[i].currency_quote);
    }

    currency_base = [...new Set(currency_base)];
    currency_quote = [...new Set(currency_quote)];

  } else if (profile[0].stock_pref === "Forex") {

    for (let i = 0; i < preferred_stocks.length; i++) {
      currency_base.push(preferred_stocks[i].currency_base);
      currency_group.push(preferred_stocks[i].currency_group);
    }

    currency_base = [...new Set(currency_base)];
    currency_group = [...new Set(currency_group)];

  }

  console.log(profile[0]);

  res.render("home.ejs", {
    profile: profile,
    setup: startQuestion,
    preferred_stocks: preferred_stocks,
    currencies: currencies,
    exchanges: exchanges,
    countries: countries,
    currency_base: currency_base,
    currency_group: currency_group,
    currency_quote: currency_quote,
  });

  db.close();
});

app.listen(3000, () => {
  console.log(`Server running on port ${port}.`);
});
