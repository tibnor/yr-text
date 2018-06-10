const xml2js = require('xml2js');
const https = require('https');

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

parser.on('error', (err) => { console.log('Parser error', err); });



function symbolId2txt(id) {
  id2txt={
  1: "Sun",
2: "Light cloudes",
3: "Partly cloudes",
4: "Cloudes",
5: "Light rain and sun",
6: "Light rain, thunder and sun",
7: "Sleet and sun",
8: "Snow and sun",
9: "Light rain",
10: "Rain",
11: "Rain and thunder",
12: "Sleet",
13: "Snow",
14: "Snow and thunder",
15: "Fog",
20: "Sleet, sun and thunder",
21: "Snow, sun, and thunder",
22: "Light rainThunder",
23: "Sleet and thunder",
24: "Drizzle, thunder and sun",
25: "Rain, thunder and sun",
26: "Light sleet, thunder and sun",
27: "Heavy sleet, thunder and sun",
28: "Light snow, thunder and sun",
29: "Heavy snow, thunder and sun",
30: "Drizzle and thunder",
31: "Light sleet and Thunder",
32: "Heavy sleet and Thunder",
33: "Light Snow and Thunder",
34: "Heavy snow and Thunder",
40: "Drizzle and sun",
41: "Rain and sun",
42: "Light sleet and sun",
43: "Heavy sleet and sun",
44: "Light snow and sun",
45: "Heavy snow and sun",
46: "Drizzle",
47: "Light  sleet",
48: "Heavy sleet",
49: "Light Snow",
50: "Heavy snow",
}
  return id2txt[id].toLowerCase()
}

exports.getSymbolsForDay = function(weatherday) {
  //let night = parseInt(weatherday.sixhour[0].symbol[0]["$"].number)
  let morning, morningtxt, day, daytxt, evening, eveningtxt
  if (weatherday.sixhour[6] !== undefined){
    morning = parseInt(weatherday.sixhour[6].symbol[0]["$"].number)
    morningtxt = symbolId2txt(morning)
  }
  if (weatherday.sixhour[12] !== undefined) {
   day = parseInt(weatherday.sixhour[12].symbol[0]["$"].number)
   daytxt = symbolId2txt(day)
  }
  if (weatherday.sixhour[18] !== undefined) {
    evening = parseInt(weatherday.sixhour[18].symbol[0]["$"].number)
    eveningtxt = symbolId2txt(evening)
  }
  if (evening === undefined)
    return ""
  else if (day === undefined) {
    return "It will be {eve} in the evening.".formatUnicorn({eve:eveningtxt})
  } else if (morning === undefined) {
    if (evening === day)
      return "It will be {eve}.".formatUnicorn({eve:eveningtxt})
    else {
      return "It will be {day} and in the evening it will be {eve}.".formatUnicorn({
        "day":daytxt, eve:eveningtxt
      })
    }
  }
  if (morning === day){
    if (day === evening) {
      return "It will be {symbol}.".formatUnicorn({symbol: morningtxt})
    } else {
      return "It will be {mor}, in the evening it will be {eve}.".formatUnicorn({
        mor:morningtxt, eve:eveningtxt
      })
    }
  } else if (day === evening) {
      return "It will be {mor} from the morning, and {eve} from the afternoon.".formatUnicorn({
        mor:morningtxt, eve:eveningtxt
      })
  } else {
    return "In the morning it will be {mor}, later it will be {day} and in the evening it will be {eve}.".formatUnicorn({
      mor:morningtxt, "day":daytxt, eve:eveningtxt
    })
  }

}

exports.date2fromto = function(day) {
  let from = new Date(day)
  from.setMilliseconds(0)
  from.setSeconds(0)
  from.setMinutes(0)
  from.setHours(0)

  let to = new Date(from)
  to.setHours(0)
  to.setDate(to.getDate() + 1)
  return [from,to]
}



exports.getDay = function(weather, from, to){
  var forecast = weather['product'][0]['time']
  let out = {
    "points": [],
    "hour": [],
    "twohour": [],
    "threehour": [],
    "sixhour": []
  }

  for (i = 0; i < forecast.length; i++) {
    var f = forecast[i]
    let fromE = new Date(f['$']['from'])
    let toE = new Date(f['$']['to'])
    let dt = (toE - fromE)/3600000
    if(from <= fromE && fromE < to){
      let data = f["location"][0]
      var hour = (fromE.getHours()) % 24
      if(dt === 0){
        out.points[hour] = data
      } else if (dt === 1){
        out.hour[hour] = data
      } else if (dt === 2){
        out.twohour[hour] = data
      } else if (dt === 3){
        out.threehour[hour] = data
      } else if (dt === 6){
        out.sixhour[hour] = data
      }
    }
  }
  return out
}

exports.minmaxpoints = function(weather, from, to){
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

exports.getTimeRangeElements = function(weather, fromIn, toIn){
  let out = []
  let forecast = weather['product'][0]['time']
  let from = exports.roundDownDate(fromIn)
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

exports.roundDownDate = function(from) {
  from -= from % (1000 * 60 * 60)
  return new Date(from)
}

function roundDownToMidnightDate(from) {
  from -= from % (1000 * 60 * 60*24)
  return new Date(from)
}

exports.temperature2str = function(temperatureNow){
  if (temperatureNow < 0){
    temperatureNow = 'minus '+(-temperatureNow)
  } else {
    temperatureNow = String(temperatureNow)
  }
  return temperatureNow
}

exports.prediction2txt = function(dataminmax, datarange){
  let minT = exports.temperature2str(dataminmax["minimumtemperature"])
  let maxT = exports.temperature2str(dataminmax["maximumtemperature"])
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

exports.getTemperatureNow = function(weather) {
  try {
    var forecast = weather['product'][0]['time'][0]['location'][0]
  } catch (error) {
    throw error
  }
  return parseFloat(forecast['temperature'][0]['$']['value'])
}

exports.temperatureNow2txt =  function(temperature){
  let t = exports.temperature2str(temperature)
  return "The temperature is now {temp} degrees.".formatUnicorn({temp: t})
}
