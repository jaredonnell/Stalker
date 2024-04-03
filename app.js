import express, { response } from "express";
import session from "express-session";
import sqlite3 from "sqlite3";
import axios from "axios";
import bodyParser from "body-parser";

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
  
  const db = new sqlite3.Database('./data/stalker.db', (err) => {
    if (err) {
      console.log('Could not connect to database');
    } else {
      console.log('Connection successful');
    }
  });

let check = true;

/* fold me */
let countries = [
  "Argentina",
  "Australia",
  "Austria",
  "Belgium",
  "Botswana",
  "Bovespa",
  "Brazil",
  "BRL",
  "BVMF",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Czech Republic",
  "Denmark",
  "DKK",
  "EGX",
  "Egypt",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Kuwait",
  "Latvia",
  "Lithuania",
  "Malaysia",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Norway",
  "OMXC",
  "Pakistan",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Taiwan",
  "Thailand",
  "Turkey",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Venezuela",
  "XCAI",
  "XKLS",
  "XMUN",
  "XSHG",
  "XWBO",
  "EUR",
  "XHAM",
  "XPAR",
  "Sri Lanka"
];

let currencies =
  [
    "AED",
    "ARS",
    "AUD",
    "BRL",
    "BWP",
    "CAD",
    "CHF",
    "CLP",
    "CNY",
    "COP",
    "CZK",
    "DKK",
    "EGP",
    "EUR",
    "GBp",
    "GBP",
    "HKD",
    "HUF",
    "IDR",
    "ILA",
    "ILS",
    "INR",
    "ISK",
    "JMD",
    "JPY",
    "KRW",
    "KWD",
    "MXN",
    "MYR",
    "NOK",
    "NZD",
    "PEN",
    "PHP",
    "PKR",
    "PLN",
    "QAR",
    "RON",
    "RUB",
    "SAR",
    "SEK",
    "SGD",
    "THB",
    "TRY",
    "TWD",
    "USD",
    "VEF",
    "ZAc",
    "ZAR",
    "AUD",
    "CAD",
    "CHF",
    "CNY",
    "EUR",
    "GBp",
    "GBP",
    "HKD",
    "HUF",
    "IDR",
    "ILA",
    "INR",
    "JPY",
    "KRW",
    "MXN",
    "NOK",
    "PLN",
    "QAR",
    "RUB",
    "SAR",
    "SEK",
    "SGD",
    "THB",
    "TRY",
    "TWD",
    "USD",
    "AED",
    "AUD",
    "CAD",
    "CHF",
    "CLP",
    "CNY",
    "EGP",
    "EUR",
    "GBp",
    "GBP",
    "HKD",
    "IDR",
    "ILA",
    "ILS",
    "INR",
    "JPY",
    "KRW",
    "LKR",
    "MXN",
    "MYR",
    "NOK",
    "NZD",
    "PEN",
    "PHP",
    "QAR",
    "RUB",
    "SAR",
    "SEK",
    "SGD",
    "THB",
    "TRY",
    "TWD",
    "USD",
    "ZAR"
];

let exchanges = [
  "ADX",
  "ASE",
  "ASX",
  "BCBA",
  "BIST",
  "BME",
  "BMV",
  "Bovespa",
  "BSE",
  "BVB",
  "BVC",
  "BVCC",
  "BVL",
  "BVS",
  "CBOE",
  "CSE",
  "CXA",
  "DFM",
  "DSME",
  "EGX",
  "Euronext",
  "FSX",
  "GPW",
  "HKEX",
  "ICEX",
  "IDX",
  "ISE",
  "JPX",
  "JSE",
  "KONEX",
  "KOSDAQ",
  "KRX",
  "LSE",
  "MOEX",
  "MTA",
  "Munich",
  "MYX",
  "NASDAQ",
  "NEO",
  "NSE",
  "NYSE",
  "NZX",
  "OMX",
  "OMXC",
  "OMXH",
  "OMXR",
  "OMXT",
  "OMXV",
  "OSE",
  "OTC",
  "PSE",
  "PSX",
  "QE",
  "SET",
  "SGX",
  "SIX",
  "Spotlight Stock Market",
  "SSE",
  "SSME",
  "SZSE",
  "Tadawul",
  "TASE",
  "TSX",
  "TSXV",
  "TWSE",
  "VSE",
  "XBER",
  "XDUS",
  "XESM",
  "XETR",
  "XHAM",
  "XHAN",
  "XKUW",
  "XMSM",
  "XSAP",
  "XSTU",
  "EUREX",
  "ICE",
  "AAX",
  "ABCC",
  "ACX",
  "AEX",
  "AlienCloud",
  "Allcoin",
  "AltCoinTrader",
  "Altilly",
  "ANX",
  "Bancor Network",
  "Bibox",
  "BigONE",
  "Bilaxy",
  "Binance",
  "Binance DEX",
  "Bitbank",
  "BitBay",
  "Bitbegin",
  "Bitbns",
  "Bitci.com",
  "BitcoinToYou",
  "BitcoinTrade",
  "BiteBTC",
  "Bitex.la",
  "Bitexen",
  "Bitexlive",
  "Bitfinex",
  "bitFlyer",
  "BitForex",
  "Bithesap",
  "Bithumb",
  "Bitibu",
  "Bitinka",
  "Bitkub",
  "Bitlish",
  "BitMart",
  "BitMax",
  "BitMEX",
  "Bitpanda Pro",
  "Bitrue",
  "Bitso",
  "BitStamp",
  "Bittrex",
  "Bit-Z",
  "Bleutrade",
  "Braziliex",
  "BTC Indonesia",
  "BTC Markets",
  "BTC-Alpha",
  "BTCBOX",
  "BTCTurk",
  "Btcwinex",
  "BTSE",
  "BXThailand",
  "Bybit",
  "C2CX",
  "CBX",
  "C-CEX",
  "CEX.IO",
  "CHAOEX",
  "Cobinhood",
  "CoinAll",
  "Coinbase Pro",
  "Coinbene",
  "Coinbig",
  "Coineal",
  "COINEGG",
  "CoinEx",
  "CoinExchange",
  "Coinext",
  "CoinField",
  "Coingecko",
  "CoinHub",
  "Coinlib",
  "CoinMex",
  "Coinnest",
  "Coinone",
  "Coinrail",
  "CoinsBank",
  "Coinsbit",
  "CoinTiger",
  "COSS",
  "C-Patex",
  "CPDAX",
  "Crex24",
  "CryptalDash",
  "Crypto.com Exchange",
  "CryptoBridge",
  "Cryptonex",
  "Cryptopia",
  "Dcoin",
  "DDEX",
  "Decoin",
  "DigiFinex",
  "DIGITAL CURRENCY",
  "DragonEX",
  "Escodex",
  "Ethen",
  "EtherDelta",
  "EtherFlyer",
  "Ethfinex",
  "exchange",
  "Exmo",
  "Exrates",
  "EXX",
  "Fatbtc",
  "FinexBox",
  "Fisco",
  "ForkDelta",
  "FreiExchange",
  "FTX",
  "Gate.io",
  "Gatecoin",
  "GDAX",
  "Gemini",
  "GOPAX",
  "Graviex",
  "HADAX",
  "HCoin",
  "HitBTC",
  "Hotbit",
  "Huobi",
  "Huobi Korea",
  "IDAX",
  "IDCM",
  "IDEX",
  "Independent Reserve",
  "Indodax",
  "itBit",
  "Koineks",
  "Koinim",
  "Korbit",
  "Kraken",
  "Kryptono",
  "Kucoin",
  "KuCoin",
  "Kyber Network",
  "LakeBTC",
  "LATOKEN",
  "LBank",
  "Liqui",
  "Liquid",
  "Livecoin",
  "LocalTrade",
  "Luno",
  "Lykke",
  "MercadoBitcoin",
  "Mercatox",
  "MEXC",
  "MXC",
  "n.exchange",
  "Negocie Coins",
  "NLexch",
  "Nova Exchange",
  "NovaDAX",
  "OKCoin",
  "OKEx",
  "OKX",
  "OOOBTC",
  "OTCBTC",
  "p2pb2b",
  "PancakeSwap",
  "Panxora",
  "Paribu",
  "Poloniex",
  "PrizmBit",
  "ProBit Exchange",
  "QBTC",
  "QUOINE",
  "Satang Pro",
  "SIMEX",
  "SouthXchange",
  "Stellarport",
  "STEX",
  "Stocks.Exchange",
  "Switcheo Network",
  "Synthetic",
  "Therocktrading",
  "Thodex",
  "Thore Exchange",
  "Tidebit",
  "Tidex",
  "Token Store",
  "TOKENMOM",
  "Tokenomy",
  "TOKOK",
  "TOPBTC",
  "Trade By Trade",
  "Trade Satoshi",
  "TradeOgre",
  "Turuko",
  "Uniswap",
  "Upbit",
  "Vebitcoin",
  "VVBTC",
  "Waves Decentralized Exchange",
  "WazirX",
  "xBTCe",
  "XT.COM",
  "YoBit",
  "Zaif",
  "ZB.COM"
];


async function select(query, params) {
  try {
    const rows = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          console.log('unable to access data from database');
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
};

async function insert(query, params) {
  try {
      const rows = await new Promise((resolve, rejec) => {
        db.run(query, params, function(err) {
          if (err) {
            console.log('unable to insert data from database');
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
};

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
  
  const db = new sqlite3.Database('./data/stalker.db', (err) => {
    if (err) {
      console.log('Could not connect to database');
    } else {
      console.log('Connection successful');
    }
  });

 const response = await select("SELECT * FROM auth");
 const current_users = response.map(user => user.username);
 const name_taken = current_users.includes(req.body.new_username)

  console.log(name_taken);
  console.log(current_users);

  if (!name_taken) {

   await insert("INSERT INTO auth (username, password) VALUES ($1, $2)", [
      req.body.new_username,
      req.body.new_password,
   ]); 

  };

  db.close();

  res.render("index.ejs", {
    name_taken: name_taken,
    username: req.body.new_username,
  });
});

app.post("/login", async (req, res) => {
  
  const db = new sqlite3.Database('./data/stalker.db', (err) => {
    if (err) {
      console.log('Could not connect to database');
    } else {
      console.log('Connection successful');
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

      if (profile[0].stock_pref === null) {
        startQuestion = true;
      }

      res.render("home.ejs", { profile: profile, setup: startQuestion, countries: countries, currencies: currencies, exchanges: exchanges });

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

      res.render("home.ejs", { profile: profile, setup: startQuestion, countries: countries, currencies: currencies, exchanges: exchanges });
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

  const db = new sqlite3.Database('./data/stalker.db', (err) => {
    if (err) {
      console.log('Could not connect to database');
    } else {
      console.log('Connection successful');
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

  const profile = await select(
    "SELECT * FROM profile WHERE username = ($1)",
    [username]
  );

  console.log(profile[0]);

  res.render("home.ejs", { profile: profile, setup: startQuestion });

  db.close();
});

app.listen(3000, () => {
  console.log(`Server running on port ${port}.`);
});
