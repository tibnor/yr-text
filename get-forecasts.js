'use strict'
const https = require('https');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

exports.getForecastXml = function(url) {
	return new Promise((resolve,reject) => {
  var data = '';
  https.get(url, (res) => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      res.on('data', (data_) => { data += data_.toString(); });
      res.on('end', () => {
        parser.parseString(data, (err, result) => {
          if (err){
            reject(err)
            return;
          }
          resolve(result['weatherdata']);
        });
      });
    } else {
			reject(new Error('Got status code '+res.statusCode));
		}
  });
});
}

exports.getWeather = function(lat, lon){
	const url = 'https://api.met.no/weatherapi/locationforecastlts/1.3/?lat='+lat+'&lon='+lon;
  return exports.getForecastXml(url)
}
