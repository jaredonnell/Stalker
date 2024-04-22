import Chart from 'chart.js/auto';
import axios from 'axios';

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

const currentOptions = fetch ('./stockGen').then(response => {
    return response;
});

