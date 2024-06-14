import axios from "axios";
import * as finance from "chartjs-chart-financial";
import {chartData} from "./calcFun.js"

// NOTE: moving all stock12 api calls along with card construction
// to acquisitions.js. The limiting fsctors of the api require
// repeatability due to token bottleneck

// globals
const api_key = "46acf3ff0eac49e385eb6e756b7b7e4e";
const preferred_stocks = document.getElementsByClassName('option-title').datasets('stockPref');
const displayed_stocks = [];

// data gathering and consolidation. Takes limitations of api into account

function stock_gen() {
    let currentStocks = [];
    for (let i = 0; i < 3; i++) {
        let random_stock = preferred_stocks[Math.floor(Math.random() * preferred_stocks.length)].symbol
        if (displayed_stocks.includes(random_stock)) {
            console.log('duplicate stock. repicking');
            stock_gen();
        }
        currentStocks.push(random_stock);
        i++;
    }
    return currentStocks;
}

console.log(currentStocks);


// takes the set of random stocks and gathers all available data,
// returning them in an object
async function data_construct(currentStocks) {
    const allStocks = [];
    const allQuotes = [];
    const logos = [];
    const prices = [];

    for (let i = 0; i < currentStocks.length; i++) {
        let stock_data = await axios.get(
            `https://api.twelvedata.com/time_series?symbol=${currentStocks[i]}&interval=1min&outputsize=35&apikey=` +
            api_key
        );
        console.log(stock_data.data.status);

        if (stock_data.data.status === "ok") {
            allStocks.push(stock_data.data);
        }

        let stock_quote = await axios.get(
            `https://api.twelvedata.com/quote?symbol=${currentStocks[i]}&interval=30min&dp=3&apikey=` +
            api_key
        );
        console.log(stock_quote.data);

        allQuotes.push(stock_quote.data);

        let stock_logo = await axios.get(
            `https://api.twelvedata.com/logo?symbol=${currentStocks[i]}&apikey=` +
            api_key
        );
        console.log(stock_logo.data.url);
        console.log(stock_logo.data.status);

        let logoProcess = "null";

        if (
            stock_logo.data.status !== "error" &&
            stock_logo.data.url !== ""
        ) {
            const response = await axios.get(
                `http://localhost:3000/bg-remove?rawURL=${stock_logo.data.url}` // REMOVE BEFORE DEPLOY
            );
            logoProcess = response.data.logo;
        }

        logos.push(logoProcess);

        const realPrice = await axios.get(
            `https://api.twelvedata.com/price?symbol=${currentStocks[i]}&dp=2&apikey=` +
            api_key
        );

        prices.push(realPrice.data.price);
    }
    return {allStocks: allStocks, allQuotes: allQuotes, prices: prices, logos: logos};
}

/* data handling */

let limit = 4

async function data_consolidate() {
    let token_count = 0
    let currentStocks = await stock_gen();

    let current_data = await data_construct(currentStocks);

}

/* initial card build */

for (let i = 0; i < currentStocks.length; i++) {

const config = {
  type: "ohlc",
  data: {
    datasets: [
      {
        yAxisID: "y1",
        data: allStocks[i].chartData[0].values.map(([d, o, h, l, c]) => ({
          t: new Date(d).getTime(),
          o,
          h,
          l,
          c,
        })),
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
        data: allStocks[i].chartData[1].values.map(([d, y]) => ({
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
        data: allStocks[i].chartData[2].map(([d, y]) => ({
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
        data: allStocks[i].chartData[3].map(([d, y]) => ({
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
        data: allStocks[i].chartData[4].map(([d, y]) => ({
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
        grace: "50%",
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
    },
  },
};

const prebuiltCharts = document.querySelectorAll('#chart');

const chart = new finance.Chart(prebuiltCharts[i], config);

}
