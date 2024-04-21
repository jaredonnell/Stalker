import express, { response } from "express";
import session from "express-session";
import sqlite3 from "sqlite3";
import axios, { all } from "axios";
import bodyParser from "body-parser";
import QuickChart from "quickchart-js";
import sharp from "sharp";

const app = express();
const port = 3000;
const api_key = "46acf3ff0eac49e385eb6e756b7b7e4e";
let check = true;

const db = new sqlite3.Database("./data/stalker.db", (err) => {
  if (err) {
    console.log("Could not connect to database");
  } else {
    console.log("Connection successful");
  }
});

/* db interactions */

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

/* chart builder */

async function dataExtract(stock_data) {
  let averages = [];
  let diff = {
    diffSets: [],
  };
  let intervals = {
    prices: [],
  };
  let deviation = [];
  let topBand = [];
  let lowBand = [];

  /* mean calc + price storing */

  for (let i = 0; i < stock_data.values.length - 5; i++) {
    let sum = 0;
    let prices = [];

    for (let j = i; j < i + 5; j++) {
      sum += parseFloat(stock_data.values[j].close);
      prices.push(parseFloat(stock_data.values[j].close).toFixed(5));
    }

    intervals.prices.push(prices);
    let avg = (sum / 5).toFixed(5);
    averages.push(avg);
  }

  /* diff calc (price - mean) and square */

  for (let i = 0; i < averages.length; i++) {
    let d = [];
    for (let k = 0; k < intervals.prices[i].length; k++) {
      let difference = (intervals.prices[i][k] - averages[i]).toFixed(5);
      let dSquared = (difference * difference).toFixed(5);
      d.push(dSquared);
    }
    diff.diffSets.push(d);
  }

  /* variance calc (sum of squares / prices) and std calc (root of variance) */

  for (let i = 0; i < diff.diffSets.length; i++) {
    let squareSum = 0;
    for (let j = 0; j < diff.diffSets[i].length; j++) {
      squareSum += parseFloat(diff.diffSets[i][j]);
    }
    let variance = squareSum / 5;
    deviation.push(Math.sqrt(variance).toFixed(5));
  }

  for (let i = 0; i < deviation.length; i++) {
    topBand.push(
      (parseFloat(deviation[i]) * 2 + parseFloat(averages[i])).toFixed(5)
    );
    lowBand.push(
      (parseFloat(averages[i]) - parseFloat(deviation[i]) * 2).toFixed(5)
    );
  }

  /* data allocation */

  const ohlcData = {
    values: [],
  };

  const volumeData = {
    values: [],
  };

  for (let i = 0; i < stock_data.values.length - 5; i++) {
    const { datetime, open, high, low, close } = stock_data.values[i];
    ohlcData.values.push([datetime, open, high, low, close]);
  }

  for (let i = 0; i < stock_data.values.length - 5; i++) {
    const { datetime, volume } = stock_data.values[i];
    volumeData.values.push([datetime, volume]);
  }

  const lBandData = stock_data.values.map((value, index) => {
    const datetime = value.datetime;
    const lBandValue = lowBand[index];
    return [datetime, lBandValue];
  });

  const uBandData = stock_data.values.map((value, index) => {
    const datetime = value.datetime;
    const uBandValue = topBand[index];
    return [datetime, uBandValue];
  });

  const smaData = stock_data.values.map((value, index) => {
    const datetime = value.datetime;
    const sma = averages[index];
    return [datetime, sma];
  });

  const compiledData = [ohlcData, volumeData, smaData, uBandData, lBandData];
  stock_data.chartData = compiledData;
  console.log(stock_data);
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
          stocks.push(
            preferred_stocks[i].symbol[
              Math.floor(Math.random() * preferred_stocks.length)
            ]
          );
        }

        const stock_data = await axios.get(
          "https://api.twelvedata.com/time_series?symbol=AAPL&interval=1min&outputsize=35&apikey=" +
            api_key
        );

        const allStocks = [];

        allStocks.push(stock_data.data);

        const stock_quote = await axios.get(
          "https://api.twelvedata.com/quote?symbol=AAPL&interval=30min&dp=3&apikey=" +
            api_key
        );

        const stock_logo = await axios.get(
          "https://api.twelvedata.com/logo?symbol=AAPL&apikey=" + api_key
        );

        const logoProcess = await axios.get(
          "http://localhost:3000/bg-remove?rawURL=" + `${stock_logo.data.url}` // REMOVE BEFORE DEPLOY
        ); 

        const realPrice = await axios.get(
          "https://api.twelvedata.com/price?symbol=AAPL&dp=2&apikey=" + api_key
        );

        /* data allocation for chart  */

        try {
          await dataExtract(allStocks[0]);
          console.log("chart data sent successfuly");
        } catch (error) {
          console.log(error);
          res.status(500);
        }

        /* chart config */

        const chart = new QuickChart();
  await chart.setConfig({
          type: "ohlc",
          data: {
            datasets: [
              {
                yAxisID: "y1",
                data: allStocks[0].chartData[0].values.map(
                  ([d, o, h, l, c]) => ({
                    x: new Date(d).getTime(),
                    o,
                    h,
                    l,
                    c,
                    tooltip: `Open: ${o}, High: ${h}, Low: ${l}, Close: ${c}`
                  })
                ),
                color: {
                  up: "rgb(98, 236, 98)",
                  down: "rgb(255,106,106)",
                  unchanged: "white",
                },
              },
              {
                type: "bar",
                yAxisID: "y2",
                backgroundColor: "pink",
                label: "Volume",
                data: allStocks[0].chartData[1].values.map(([d, y]) => ({
                  x: new Date(d).getTime(),
                  y,
                })),
              },
              {
                type: "line",
                yAxisID: "y1",
                borderColor: "pink",
                backgroundColor: "",
                borderWidth: 2,
                pointRadius: 0,
                label: "SMA",
                data: allStocks[0].chartData[2].map(([d, y]) => ({
                  x: new Date(d).getTime(),
                  y,
                })),
              },
              {
                type: "line",
                yAxisID: "y1",
                borderColor: "rgba(103, 103, 255, 0.822)",
                backgroundColor: "",
                borderWidth: 2,
                pointRadius: 0,
                label: "Upper Band",
                data: allStocks[0].chartData[3].map(([d, y]) => ({
                  x: new Date(d).getTime(),
                  y,
                })),
              },
              {
                type: "line",
                yAxisID: "y1",
                borderColor: "rgba(255, 255, 137, 0.801)",
                backgroundColor: "",
                borderWidth: 2,
                pointRadius: 0,
                label: "Lower Band",
                data: allStocks[0].chartData[4].map(([d, y]) => ({
                  x: new Date(d).getTime(),
                  y,
                })),
              },
            ],
          },
          options: {
            scales: {
              x: {
                adapters: {
                  date: {
                    zone: "UTC-4",
                  },
                },
                grid: {
                  display: false,
                },
                time: {
                  unit: "day",
                  stepSize: 1,
                  displayFormats: {
                    day: "MMM d",
                    month: "MMM d",
                  },
                },
                ticks: {
                  display: false,
                },
              },
              y1: {
                stack: "stockChart",
                stackWeight: 10000000,
                weight: 2,
                grace: '50%',
                grid: {
                  display: false,
                },
                ticks: {
                  display: true,
                  font: {
                    size: 10,
                  },
                  padding: 0,  
                },
              },
              y2: {
                display: false,
                stack: "stockChart",
                stackWeight: 1,
                weight: 1,
                grid: {
                  display: false,
                },
                ticks: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
              title: {
                display: false,
              },
            },
          },
          plugins: {
            tooltip: {
              enabled: false,
            }
          }
        });

        await chart
          .setVersion("3.4.0")
          .setBackgroundColor("transparent")
          .setHeight(300)
          .setWidth(600);
        const url = await chart.getUrl();

        res.render("home.ejs", {
          profile: profile,
          setup: startQuestion,
          preferred_stocks: preferred_stocks,
          stock_data: stock_data.data,
          stock_quote: stock_quote.data,
          logoURL: logoProcess.data.logo,
          realPrice: realPrice.data.price,
          url: url,
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
        res.render("home.ejs", {
          profile: profile,
          setup: startQuestion,
          preferred_stocks: preferred_stocks,
          stock_data: stock_data.data,
          stock_quote: stock_quote.data,
          logoURL: logoProcess.data.logo,
          realPrice: realPrice.data.price,
          url: url,
          stocks: stocks,
          countries: countries,
          currencies: currencies,
          exchanges: exchanges,
          currency_quote: currency_quote,
          currency_base: currency_base,
          currency_group: currency_group,
        });
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

      res.render("home.ejs", {
        profile: profile,
        setup: startQuestion,
        preferred_stocks: preferred_stocks,
        stock_data: stock_data.data,
        stock_quote: stock_quote.data,
        logoURL: logoProcess.data.logo,
        realPrice: realPrice.data.price,
        url: url,
        stocks: stocks,
        countries: countries,
        currencies: currencies,
        exchanges: exchanges,
        currency_quote: currency_quote,
        currency_base: currency_base,
        currency_group: currency_group,
      });
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

app.get("/bg-remove", async (req, res) => {
  async function imageProccess(imageURL) {
    try {
      const response = await axios.get(imageURL, {
        responseType: "arraybuffer",
      });

      let image = await sharp(response.data);

      const metadata = await image.metadata();
      const hasAlpha = metadata.hasAlpha;

      if (!hasAlpha) {
        image = image.png({ alphaQuality: -1, force: true });
        console.log("fuckyou");
      }

      const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      for (let i = 0; i < data.length; i += 4) {
        if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) {
          data[i + 3] = 0;
        }
      }

      const proccessedImage = await sharp(data, { raw: info }).png().toBuffer();

      const proccessedURL = `data:image/png;base64,${proccessedImage.toString(
        "base64"
      )}`;

      return proccessedURL;
    } catch (error) {
      console.log("error processing image", error);
      throw error;
    }
  }

  try {
    const rawURL = req.query.rawURL;

    const logo = await imageProccess(rawURL);

    res.json({ logo: logo });
  } catch (error) {
    console.error("error with request:", error);
    res.status(500);
  }
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
