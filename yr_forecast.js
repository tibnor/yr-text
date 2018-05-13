const xml2js = require('xml2js');
const https = require('https');
const get_forecast = require('./get-forecasts')
const nowcast = require('./nowcast')
const parser = new xml2js.Parser();
const locationUrl = 'https://www.yr.no/sted/Norge/Tr%C3%B8ndelag/Trondheim/Tyholt/'
const locationGeo = ''

String.prototype.formatUnicorn = String.prototype.formatUnicorn ||
function () {
    "use strict";
    var str = this.toString();
    if (arguments.length) {
        var t = typeof arguments[0];
        var key;
        var args = ("string" === t || "number" === t) ?
            Array.prototype.slice.call(arguments)
            : arguments[0];

        for (key in args) {
            str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
        }
    }

    return str;
};

parser.on('error', function(err) { console.log('Parser error', err); });

exports.getForecastToday = function(lat,lon) {
  let from = Date.now()
  let to = roundDownDate(from)
  to.setHours(0)
  to.setDate(to.getDate() + 1)

  return new Promise( async (resolve, reject) =>  {
    const data = await get_forecast.getWeather(lat,lon)
      .catch(error => {
        resolve("Weather forecast is not available from yr.no")
        return;
      })
    if (data == undefined)
      return;
    const tempNow = getTemperatureNow(data);
    let txt = temperatureNow2txt(tempNow) + " ";

    const minmax = minmaxpoints(data, from, to)
    const timerange = getTimeRangeElements(data, from, to)
    txt += prediction2txt(minmax, timerange) + " "
    try {
      txt += await nowcast.getNowcast(lat,lon)
    } catch (error){
      txt += "Nowcast is not available"
    }
    resolve(txt)
  })
}

minmaxpoints = function(weather, from, to){
  try {
    var forecast = weather['product'][0]['time']
  } catch (error) {
    console.log(forecast)
    throw error
  }
  var maxTemperature = -1e6
  var minTemperature = 1e6
  var maxWindSpeed = 0.0
  for (i = 0; i < forecast.length; i++) {
    var f = forecast[i]
    let fromE = new Date(f['$']['from'] )
    let toE = new Date(f['$']['to'] )
    if(from > fromE)
      continue;
    if(to < toE)
      continue;

    f = f['location'][0]
    if ('temperature' in f) {
      var temperature = parseFloat(f['temperature'][0]['$']['value'])
      var windSpeed = parseFloat(f['windSpeed'][0]['$']['mps'])
    }
    minTemperature = Math.min(minTemperature,temperature)
    maxTemperature = Math.max(maxTemperature,temperature)
    maxWindSpeed = Math.max(windSpeed,maxWindSpeed)
  }
  return {"minimumtemperature":minTemperature,
        "maximumtemperature":maxTemperature,
        "maximumwindspeed":maxWindSpeed}
}

getTimeRangeElements = function(weather, fromIn, toIn){
  let out = []
  let forecast = weather['product'][0]['time']
  let from = roundDownDate(fromIn)
  let to = new Date(from)
  to.setHours(to.getHours()+1)

  for (i = 0; i < forecast.length; i++) {
    var f = forecast[i]
    let fromE = new Date(f['$']['from'] )
    let toE = new Date(f['$']['to'] )
    console
    if(from.getTime() === fromE.getTime() &&
      to.getTime() === toE.getTime()){
      let precipitation = f["location"][0]["precipitation"][0]["$"]
      ele = {
        "from": new Date(f["$"]["from"]),
        "to": new Date(f["$"]["to"]),
        "precipitation": parseFloat(precipitation["value"]),
        "min_precipitation": parseFloat(precipitation["minvalue"]),
        "max_precipitation": parseFloat(precipitation["maxvalue"])
      }
      out.push(ele);
      from = to;
      to = new Date(from)
      to.setHours(to.getHours()+1)
      if (toIn < to)
        break;
  }
  }
  return out
}

function roundDownDate(from) {
  from -= from % (1000 * 60 * 60)
  return new Date(from)
}

function temperature2str(temperatureNow){
  if (temperatureNow < 0){
    temperatureNow = 'minus '+(-temperatureNow)
  } else {
    temperatureNow = ''+temperatureNow
  }
  return temperatureNow
}

function prediction2txt(dataminmax, datarange){
  let minT = temperature2str(dataminmax["minimumtemperature"])
  let maxT = temperature2str(dataminmax["maximumtemperature"])
  let txt = "The temperature will be between {minT} and {maxT} degrees. ".formatUnicorn({"minT":minT,"maxT":maxT})
  let minP = 0
  let maxP = 0
  for (var i = 0; i < datarange.length; i++) {
    minP += datarange[i]["min_precipitation"]
    maxP += datarange[i]["max_precipitation"]
  }
  if (maxP >0)
    txt += "The precipitation will be between {minP} and {maxP} millimeter.".formatUnicorn({minP: minP, maxP: maxP})
  else {
    txt += "No precipitation is forecasted."
  }
  return txt
}

function getTemperatureNow(weather) {
  try {
    var forecast = weather['product'][0]['time'][0]['location'][0]
  } catch (error) {
    throw error
  }
  return parseFloat(forecast['temperature'][0]['$']['value'])
}

function temperatureNow2txt(temperature){
  let t = temperature2str(temperature)
  return "The temperature is now {temp} degrees.".formatUnicorn({temp: t})
}
