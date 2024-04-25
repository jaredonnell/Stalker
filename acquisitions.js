import Chart from "chart.js/auto";
import axios from "axios";
import * as finance from "chartjs-chart-financial";

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

async function dataExtract() {
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

const chart = new Chart(document.querySelector('.card-wrap'), config);


}
