const xml2js = require('xml2js');
const https = require('https');
const yrno = require('yr.no-forecast')({
  version: '1.9', // this is the default if not provided,
  request: {
    // make calls to locationforecast timeout after 15 seconds
    timeout: 15000
  }
});
const parser = new xml2js.Parser();
const locationUrl = 'https://www.yr.no/sted/Norge/Tr%C3%B8ndelag/Trondheim/Tyholt/'
const locationGeo = 'lat=63.4202&lon=10.4294'


parser.on('error', function(err) { console.log('Parser error', err); });

exports.detailedLocalForecast = function(weather){
  var forecast = weather['forecast'][0]
  var maxTemperature = -1e6
  var minTemperature = 1e6
  var maxWindSpeed = 0.0
  var minPrecipitation = 0.0
  var maxPrecipitation = 0.0
  var today = new Date()
  for (i = 0; i < 24; i++) {
    var f = forecast['tabular'][0]['time'][i]
    var from = new Date(f['$']['from'] )
    if(from.getDate() !== today.getDate())
    break
    var temperature = parseFloat(f['temperature'][0]['$']['value'])
    var precipitation = f['precipitation'][0]['$']
    if ('minvalue' in f['precipitation'][0]['$']){
      minPrecipitation += parseFloat(['minvalue'])
      maxPrecipitation += parseFloat(['maxvalue'])
    }
    var windSpeed = parseFloat(f['windSpeed'][0]['$']['mps'])
    minTemperature = Math.min(minTemperature,temperature)
    maxTemperature = Math.max(maxTemperature,temperature)
    maxWindSpeed = Math.max(windSpeed,maxWindSpeed)
  }
  minTemperature = temperature2str(minTemperature)
  maxTemperature = temperature2str(maxTemperature)
  var text = getTemperatureNow(weather)
  text += ' Today it will be '
  if (minTemperature !== maxTemperature)
  text += 'between ' + minTemperature + ' and ' + maxTemperature
  else
  text += maxTemperature
  text += ' degrees. '
  if (minPrecipitation > 0)
  text += " It is predicted between " + minPrecipitation + " and " + maxPrecipitation + " millimeter precipitation."

  if (maxWindSpeed > 5)
  text += " The wind will be up to" + Math.round(maxWindSpeed)+" meter per second."
  return text
}

exports.makeForecastText =  function(weather){
  var forecast = weather['forecast'][0]
  var tekstvarsel = forecast['text'][0]['location'][0]['time'][0]['body'][0]
  tekstvarsel = tekstvarsel.replace(/<strong>/gi,"")
  tekstvarsel = tekstvarsel.replace(/<\/strong>/gi,"")
  return 'Dette er dagens værvarsel: '+ tekstvarsel + ' ' + getTemperatureNow(weather);
}

function temperature2str(temperatureNow){
  if (temperatureNow < 0){
    temperatureNow = 'minus '+(-temperatureNow)
  } else {
    temperatureNow = ''+temperatureNow
  }
  return temperatureNow.replace(".", ",")
}

function getTemperatureNow(weather) {
  var forecast = weather['forecast'][0]
  var temperatureNow = forecast['tabular'][0]['time'][0]['temperature'][0]['$']['value']
  temperatureNow = parseFloat(temperatureNow)
  var text = 'The temperature is ' + temperature2str(temperatureNow)
  if (Math.abs(temperatureNow) === 1){
    text += ' degree.'
  } else {
    text += ' degrees.'
  }
  return text
}

function getForecastXml(url,callback) {
  var data = '';
  https.get(url, function(res) {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      res.on('data', function(data_) { data += data_.toString(); });
      res.on('end', function() {
        parser.parseString(data, function(err, result) {
          if (err){
            console.error(err);
            return;
          }
          callback(result['weatherdata']);
        });
      });
    }
  });
}

exports.nowcast2text = function(data) {
  let txt = '';
  let product = data['product'][0]['time']
  let now = Date.now();
  let nextPrecipitation = false;
  for (var i = 0; i < product.length; i++) {
    var v = product[i];
    let pre = v['location'][0]['precipitation'][0]['$']['value'];
    if (pre>0) {
      let from = Math.round((Date.parse(v['$']['from'])-now)/(1000*60));
      if (from < 0) {
        let to = Math.round((Date.parse(v['$']['to'])-now)/(1000*60));
        if (to < 0) {
          continue;
        } else {
          return 'It is raining';
        }
      } else {
        return 'It will start to rain in '+from+' minuttes.';
      }
    }

  }
  return 'It will not start to rain the next 90 minuttes.';
}

exports.getWeather = function(callback){
  getForecastXml(locationUrl+'/varsel.xml',callback)
}

exports.getWeatherHourly = function(callback){
  getForecastXml(locationUrl+'varsel_time_for_time.xml',callback)
}

exports.getNowcast = function(callback){
  let url = 'https://api.met.no/weatherapi/nowcast/0.9/?'+locationGeo;
  getForecastXml(url,callback)
}
