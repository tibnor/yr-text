'use strict'

const nowcast = require('./nowcast')
const getForecast = require('./get-forecasts')
const fs = require('fs');
const beautify = require("json-beautify");

const lat = 60;
const lon = 11;
async function storeNowcast() {
	const result = await nowcast.getNowcast(lat, lon);
	const json = JSON.stringify(result);
	fs.writeFile('test_files/nowcast.json', json, 'utf8', ()=>{});
}
storeNowcast();

async function storeForecast(){
	const result = await getForecast.getWeather(lat, lon);
	const json = JSON.stringify(result);
	fs.writeFile('test_files/hourly.json', beautify(result, null, 2, 100), 'utf8', ()=>{});
}
storeForecast();
