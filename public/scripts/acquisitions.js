// import Chart from "chart.js/auto";
import axios from "axios";
import * as finance from "chartjs-chart-financial";
import {chartData} from "./calcFun.js"
/* NOTE: perform first 2 card builds server-side
for immediate availability, perform subsequent cards
from client side for dynamic rendering */

/* function will be needed to build next 2 cards,
this includes data collection and chart configuration and
will be seperate from the configuration used for the
2 intial cards */

/* inital 2 datasets */

const dataSource = document.querySelector(".option-title");
const currentStocks = dataSource.dataset.currentStocks;
const allStocks = dataSource.dataset.allStocks;

/* data handling */


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
