const get_forecast = require('./get-forecasts')
const yr_forecast = require('./yr_forecast')
const nowcast = require('./nowcast')

exports.getForecastToday = function(lat,lon) {
  let from = new Date()
  let to = yr_forecast.roundDownDate(Date.now())
  to.setHours(0)
  to.setDate(to.getDate() + 1)
  let txt = ""
  return get_forecast.getWeather(lat,lon)
      .catch(error => {
        resolve("Weather forecast is not available from yr.no")
      })
      .then(data => {
    const day = yr_forecast.getDay(data,from,to)
    txt += yr_forecast.getSymbolsForDay(day, from,to) + " ";
    const tempNow = yr_forecast.getTemperatureNow(data);
    txt += yr_forecast.temperatureNow2txt(tempNow) + " ";
    const minmax = yr_forecast.minmaxpoints(data, from, to)
    const timerange = yr_forecast.getTimeRangeElements(data, from, to)
    txt += yr_forecast.prediction2txt(minmax, timerange) + " "
    return nowcast.getNowcast(lat,lon)})
    .catch( (error) => {
      console.log(error)
      txt += "Nowcast is not available"
    })
    .then( data=> {
            return txt + data
    })
}

exports.getForecastDay = function(lat,lon, day) {
  const res = yr_forecast.date2fromto(day)
  let from = res[0]
  let to = res[1]
  let txt = ""
  return get_forecast.getWeather(lat,lon)
      .catch(error => {
        resolve("Weather forecast is not available from yr.no")
      })
      .then(data => {
    const day = yr_forecast.getDay(data,from,to)
    txt += yr_forecast.getSymbolsForDay(day, from,to) + " ";
    const minmax = yr_forecast.minmaxpoints(data, from, to)
    const timerange = yr_forecast.getTimeRangeElements(data, from, to)
    txt += yr_forecast.prediction2txt(minmax, timerange)
    return txt
  }).catch(error => {
    console.error(error);
    throw error;
  })
}
