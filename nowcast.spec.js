'use strict'

var rewire = require('rewire');
const nowcast = rewire("./nowcast");
const expect = require("chai").expect;
const fs = require("fs");
let now = new Date("2018-05-10T10:20:00Z");

function getData(file) {
  return new Promise(function(resolve) {
    fs.readFile(file, "utf8", function readFileCallback(err, data){
      resolve(JSON.parse(data));
    });
  });
}

const getNowcastData = nowcast.__get__('getNowcastData')
const nowcast2text = nowcast.__get__('nowcast2text')
describe("Nowcast", () => {
  describe("getNowcast", () => {
    it("should return a promise", () => {
      const lat = 60;
      const lon = 11;
      const result = getNowcastData(lat, lon);
      expect(result.then).to.be.a("Function");
      expect(result.catch).to.be.a("Function");
    });
    it("result is an DOM", async () => {
      const lat = 60;
      const lon = 11;
      const resultPromise = await getNowcastData(lat, lon);
      expect(resultPromise).to.be.a("Object");
      expect(resultPromise["product"]).to.be.a("Array");
    })
  });
  describe("nowcast2text", () => {
    it("should say that it is raining", async () => {
      let obj = await getData("test_files/nowcast_raining.json")
      let txt = nowcast2text(obj,now);
      expect(txt).to.equal("It is raining.");
    })
    it("should say when it will start to rain", async () => {
      let obj = await getData("test_files/nowcast_raining_10min.json")
      let txt = nowcast2text(obj,now);
      expect(txt).to.equal("It will start to rain in 10 minuttes.");
    })
    it("state that it will not rain", async () => {
      let obj = await getData("test_files/nowcast_not_raining.json")
      let txt = nowcast2text(obj,now);
      expect(txt).to.equal("It will not start to rain the next 90 minuttes.");
    })
  })
})
