const yr = require("./index.js");

process.env.TZ = 'Europe/Oslo'

var chai = require('chai');
chai.use(require('chai-like'));
chai.use(require('chai-things')); // Don't swap these two
chai.use(require('chai-datetime'));
const expect = chai.expect;
const fs = require("fs");

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
