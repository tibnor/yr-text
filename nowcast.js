'use strict'
const getForecast = require('./get-forecasts')

exports.getNowcast = function(lat,lon) {
  return getNowcastData(lat,lon).then(data => {
    return nowcast2text(data, Date.now())
  })
}

function getNowcastData(lat,lon){
  let url = 'https://api.met.no/weatherapi/nowcast/0.9/?lat='+lat+'&lon='+lon;
  return getForecast.getForecastXml(url)
}

function nowcast2text(data, now) {
  let txt = '';
  let product = data['product'][0]['time']
  if (now === null){
    now = Date.now();
  }
  let nextPrecipitation = false;
  for (var i = 0; i < product.length; i++) {
    var v = product[i];
    let pre = v['location'][0]['precipitation'][0]['$']['value'];
    if (pre>0) {
      let from = Math.round((Date.parse(v['$']['from'])-now)/(1000*60));
      if (from < 0) {
        return 'It is raining.';
      } else {
        return 'It will start to rain in '+from+' minuttes.';
      }
    }

  }
  return 'It will not start to rain the next 90 minuttes.';
}
