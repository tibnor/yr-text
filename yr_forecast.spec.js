'use strict'
'use ecmaVersion: 2017'

var chai = require('chai');
chai.use(require('chai-like'));
chai.use(require('chai-things')); // Don't swap these two
chai.use(require('chai-datetime'));
const expect = chai.expect;

var rewire = require('rewire');

const yr = rewire("./yr_forecast");
const fs = require("fs");
const from = new Date("2018-05-13T12:20:00Z");
const to =   new Date("2018-05-14T02:00:00Z");
const lat = 63.4202
const lon = 10.4294

function getData(file) {
  return new Promise(((resolve,reject) => {
    fs.readFile(file, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  }));
}

describe("getForecastToday", () => {
  it('should return a string',  () => {
    return yr.getForecastToday(lat,lon).then( res => {
      expect(res).to.be.a('String')
      expect(res).to.contain("The temperature is now")
      expect(res).to.contain("The temperature will be between")
      expect(res).to.contain("precipitation")
      console.log(res)
      return;
    })
  })
})

describe("getForecastDay", () => {
  it('should return a string',  () => {
    let tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate()+1)
    tomorrow = tomorrow.toString()
    return yr.getForecastDay(lat,lon, tomorrow).then( res => {
      expect(res).to.be.a('String')
      expect(res).to.contain("The temperature will be between")
      expect(res).to.contain("precipitation")
      console.log(res)
      return;
    })
  })
})

const date2fromto = yr.__get__('date2fromto')
describe("date2fromto", () => {
  it('should give midnight to midnight',  () => {
    let tomorrow = "2018-05-18T12:04:03.21+02:00"
    const res = date2fromto(tomorrow);
    expect(res).to.be.length(2);
    expect(res[0]).to.equalTime(new Date("2018-05-18T00:00:00+02:00"))
    expect(res[1]).to.equalTime(new Date("2018-05-19T00:00:00+02:00"))
  })
})


const minmaxpoints = yr.__get__('minmaxpoints')
describe("minmaxpoints", () => {
  it('Should return dictionary',  () => {
    return getData("test_files/hourly_test.json")
    .then(obj => {
      let res = minmaxpoints(obj,from,to);
      expect(res).to.be.a('Object')
      return;
    });
  })
  it('get minimum temperature',() => {
    return getData("test_files/hourly_test.json")
    .then(obj => {
      let res = minmaxpoints(obj,from,to);
      expect(res['minimumtemperature']).to.equal(11.4);
      return;
    });
  })
  it('get maximum temperature', () => {
    return getData("test_files/hourly_test.json")
    .then(obj => {
      let res = minmaxpoints(obj,from,to);
      expect(res['maximumtemperature']).to.equal(21.2);
      return;
    });
  })
  it('get maximum wind speed', () => {
    return getData("test_files/hourly_test.json")
    .then(obj => {
      let res = minmaxpoints(obj,from,to);
      expect(res['maximumwindspeed']).to.equal(3.5)
      return;
    });
})
})

const roundDownDate = yr.__get__('roundDownDate')
describe('roundDownDate', () => {
  it('Should return Date',  () => {
    const inTime = new Date("2018-05-13T11:20:00Z")
    const outTime = roundDownDate(inTime);
    expect(outTime).to.be.a("Date")
  })
  it('Should round down to previous hour',  () => {
    const inTime = new Date("2018-05-13T11:20:01.5Z")
    const outTime = roundDownDate(inTime);
    expect(outTime).to.equalTime(new Date("2018-05-13T11:00:00Z"))
  })
  it('Should round down to previous hour or same if at hole hour',  () => {
    const inTime = new Date("2018-05-13T11:00:00Z")
    const outTime = roundDownDate(inTime);
    expect(outTime).to.equalTime(new Date("2018-05-13T11:00:00Z"))
  })
})

const getTimeRangeElements = yr.__get__('getTimeRangeElements')
describe('getTimeRangeElements', () => {
  it('Should return Array',  () => {
    return getData("test_files/hourly_test.json")
      .then(obj => {
    let res = getTimeRangeElements(obj,from,to);
    expect(res).to.be.an('Array')
    expect(res).to.have.lengthOf(14)
    return;
  })
  })
  it('First element should start at 12',() => {
    return getData("test_files/hourly_test.json")
      .then(obj => {
    let res = getTimeRangeElements(obj,from,to);
    expect(res[0]["from"]).to.equalTime(new Date("2018-05-13T12:00:00Z"))
    return;
  })
  })
  it('Last element should end at 02', () => {
    return getData("test_files/hourly_test.json")
      .then(obj => {
    let res = getTimeRangeElements(obj,from,to);
    expect(res[13]["to"]).to.equalTime(new Date("2018-05-14T02:00:00Z"))
    return;
  })
  })
  it('First element should have value, min, max', () => {
    return getData("test_files/hourly_test.json").then( obj => {
    let res = getTimeRangeElements(obj,from,to);
    expect(res[0]["precipitation"]).to.equal(0.2)
    expect(res[0]["min_precipitation"]).to.equal(0)
    expect(res[0]["max_precipitation"]).to.equal(0.3)
    return;
  })
})
})

const getTemperatureNow = yr.__get__('getTemperatureNow')

describe("getTemperatureNow", () => {
  it('Should return first temperature',  () => {
    return getData("test_files/hourly_test.json")
      .then(obj =>{
    let res = getTemperatureNow(obj);
    expect(res).to.equal(10.1)
    return
  }
  )
  })
})

let testDataRange =
[{
  "from": new Date("2018-05-13T10:00:00Z"),
  "to": new Date("2018-05-13T11:00:00Z"),
  "precipitation": 2.5,
  "min_precipitation": 0,
  "max_precipitation": 5
},
{
  "from": new Date("2018-05-13T11:00:00Z"),
  "to": new Date("2018-05-13T12:00:00Z"),
  "precipitation": 1,
  "min_precipitation": 0.2,
  "max_precipitation": 3
} ];

let testDataRangeNoRain =
[{
  "from": new Date("2018-05-13T10:00:00Z"),
  "to": new Date("2018-05-13T11:00:00Z"),
  "precipitation": 0,
  "min_precipitation": 0,
  "max_precipitation": 0
},
{
  "from": new Date("2018-05-13T11:00:00Z"),
  "to": new Date("2018-05-13T12:00:00Z"),
  "precipitation": 0,
  "min_precipitation": 0,
  "max_precipitation": 0
} ];

let testData = {
  "minimumtemperature": -3.2,
  "maximumtemperature": 5,
  "maximumwindspeed": 7
}

const prediction2txt = yr.__get__('prediction2txt')
describe("prediction2txt", () => {
  it('should state the min and max temperature', () => {
    let res = prediction2txt(testData, testDataRange);
    expect(res).to.contain("The temperature will be between minus 3.2 and 5 degrees.");
  })
  it('should state the min and max precipitation', () => {
    let res = prediction2txt(testData, testDataRange);
    expect(res).to.contain("The precipitation will be between 0.2 and 8 millimeter.");
  })
  it('should state that it will not rain', () => {
    let res = prediction2txt(testData, testDataRangeNoRain);
    expect(res).to.contain("No precipitation is forecasted.");
  })
})
