async function SMA(stock_data) {
    let intervals = [];
    let averages = [];
    for (let i = 0; i < stock_data.length - 5; i++) {
        let sum = 0;
        let prices = [];
        for (let j = i; j < i + 5; j++) {
            sum += parseFloat(stock_data[j].close);
            prices.push(parseFloat(stock_data[j].close).toFixed(5));
        }
        intervals.push(prices);
        let avg = (sum / 5).toFixed(5);
        averages.push(avg);
    }
    return {intervals, averages};
}

async function std(stock_data) {
    let sma = await SMA(stock_data);
    let diffSets = [];
    let deviation = [];
    for (let i = 0; i < sma.averages.length; i++) {
        let d = [];
        for (let k = 0; k < sma.intervals[i].length; k++) {
            let difference = (sma.intervals[i][k] - sma.averages[i]).toFixed(5);
            let dSquared = (difference * difference).toFixed(5);
            d.push(dSquared);
        }
        diffSets.push(d);
    }
    for (let i = 0; i < diffSets.length; i++) {
        let squareSum = 0;
        for (let j = 0; j < diffSets[i].length; j++) {
            squareSum += parseFloat(diffSets[i][j]);
        }
        let variance = squareSum / 5;
        deviation.push(Math.sqrt(variance).toFixed(5));
    }
    return {averages: sma.averages, deviation};
}

async function chartData(stock_data, bandOption) {
    const STD = await std(stock_data);
    let ohlcData = [];
    let volumeData = [];
    for (let i = 0; i < stock_data.length - 5; i++) {
        const { datetime, open, high, low, close } = stock_data[i];
        ohlcData.push([datetime, open, high, low, close]);
    }
    for (let i = 0; i < stock_data.length - 5; i++) {
        const { datetime, volume } = stock_data[i];
        volumeData.push([datetime, volume]);
    }
    const smaData = stock_data.map((value, index) => {
        const datetime = value.datetime;
        const sma = STD.averages[index];
        return [datetime, sma];
    });
    if (bandOption === true) {
        let topBand = [];
        let lowBand = [];
        for (let i = 0; i < STD.deviation.length; i++) {
            topBand.push(
                (parseFloat(STD.deviation[i]) * 2 + parseFloat(STD.averages[i])).toFixed(5)
            );
            lowBand.push(
                (parseFloat(STD.averages[i]) - parseFloat(STD.deviation[i]) * 2).toFixed(5)
            );
        }
        const lBandData = stock_data.map((value, index) => {
            const datetime = value.datetime;
            const lBandValue = lowBand[index];
            return [datetime, lBandValue];
        });

        const uBandData = stock_data.map((value, index) => {
            const datetime = value.datetime;
            const uBandValue = topBand[index];
            return [datetime, uBandValue];
        });
        const compiledData = [ohlcData, volumeData, smaData, uBandData, lBandData];
        stock_data.chartData = compiledData;
    } else {
        const compiledData = [ohlcData, volumeData, smaData];
        stock_data.chartData = compiledData;
    }
}
