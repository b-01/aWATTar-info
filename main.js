/**
 * Represents an one hour data point.
 * Contains start date, end date, and market price (EUR/MWh).
 */
class DataPoint {
    constructor(start_date, end_date, market_price) {
        this.start_date = start_date;
        this.end_date = end_date;
        this.market_price = market_price;
    }

    calcBruttoPricePerKwH() {
        return ((this.market_price / 1000) + (Math.abs(this.market_price / 1000) * 0.03) + 0.015) * 1.2;
    }

    get hourString() {
        return `${this.start_date.getHours()}-${this.end_date.getHours()}`;
    }
}

/**
 * Range of DataPoints.
 */
class DataRange {

    constructor() {
        this.dataPoints = [];
    }

    add(datapoint) {
        this.dataPoints.push(datapoint);
    }

    parse(jsonMarketData) {
        for (var hourData of jsonMarketData) {

            const dataPoint = new DataPoint(
                new Date(hourData["start_timestamp"]),
                new Date(hourData["end_timestamp"]),
                hourData["marketprice"]
            );
    
            this.add(dataPoint);
        }
    }

    get labels() {
        const ret = [];
        for(var dp of this.dataPoints) {
            ret.push(dp.hourString);
        }
        return ret;
    }

    get data() {
        const ret = [];
        for(var dp of this.dataPoints) {
            ret.push(dp.calcBruttoPricePerKwH().toFixed(3));
        }
        return ret;
    }

}

/**
 * Loads the data from the API and builds the Chart and Table.
 */
function updateData() {
    const dataRange = new DataRange();
    const API_URL = 'https://api.awattar.at/v1/marketdata';

    // Make a GET request
    fetch(API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(json => {
            dataRange.parse(json.data);
            buildChart(dataRange);
            buildTable(dataRange);
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

function buildChart(dataRange) {

    // destroy all previously created charts - enables reloads
    Chart.helpers.each(Chart.instances, function (instance) {
        instance.destroy();
    });
    // sets the text color to white
    Chart.defaults.color = "#FFF";

    const chartElement = document.getElementById("chart");

    const chartData = {
        labels: dataRange.labels,
        datasets: [{
          label: "Hourly Gross Price",
          data: dataRange.data,
          backgroundColor: "#588157",
          borderColor: "#588157",
          borderWidth: 1
        }]
      };

    const chart = new Chart(chartElement, {
        type: "bar",
        // https://chartjs-plugin-datalabels.netlify.app/
        plugins: [ChartDataLabels],
        data: chartData,
        options: {
            scales: {
                y: {
                    suggestedMin: 0,
                    suggestedMax: 0.25
                }
            },
            plugins: {
                datalabels: {
                    color: "#FFFFFF",
                    anchor: "center",
                    rotation: 90
                },
                legend: {
                    display: false
                }
            }
        }
    });
}

function buildTable(dataRange) {

    let table = document.getElementById("table");

    // clear the table except the header
    try {
        while(table.rows.length > 1) {
            table.deleteRow(-1);
        }
    } catch (indexSizeError) { }

    for(var dataPoint of dataRange.dataPoints) {
        let row = table.insertRow();

        let cell1 = row.insertCell();
        cell1.appendChild(document.createTextNode(dataPoint.hourString));

        let cell2 = row.insertCell();
        cell2.appendChild(document.createTextNode(dataPoint.calcBruttoPricePerKwH().toFixed(3)));
    }
}
