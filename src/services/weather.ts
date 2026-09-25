export type CurrentWeather = { temperature:number; code:number; label:string; icon:string }

const CACHE_KEY='goeast-egilsstadir-weather-v1'
const CACHE_TTL=15*60*1000
const ENDPOINT='https://api.open-meteo.com/v1/forecast?latitude=65.2669&longitude=-14.3948&current=temperature_2m,weather_code&timezone=Atlantic%2FReykjavik'

function describeWeather(code:number):Pick<CurrentWeather,'label'|'icon'>{
  if(code===0)return {label:'Clear',icon:'☀'}
  if(code<=2)return {label:'Partly cloudy',icon:'⛅'}
  if(code===3)return {label:'Cloudy',icon:'☁'}
  if(code===45||code===48)return {label:'Fog',icon:'≋'}
  if(code>=51&&code<=57)return {label:'Drizzle',icon:'🌦'}
  if(code>=61&&code<=67)return {label:'Rain',icon:'🌧'}
  if(code>=71&&code<=77)return {label:'Snow',icon:'❄'}
  if(code>=80&&code<=82)return {label:'Showers',icon:'🌦'}
  if(code>=85&&code<=86)return {label:'Snow showers',icon:'🌨'}
  if(code>=95)return {label:'Thunderstorm',icon:'⛈'}
  return {label:'Conditions unavailable',icon:'—'}
}

function cachedWeather():CurrentWeather|null{
  try{
    const value=window.localStorage.getItem(CACHE_KEY)
    if(!value)return null
    const cached=JSON.parse(value) as {savedAt:number;weather:CurrentWeather}
    return Date.now()-cached.savedAt<CACHE_TTL?cached.weather:null
  }catch{return null}
}

export async function getEgilsstadirWeather(signal?:AbortSignal):Promise<CurrentWeather>{
  const cached=cachedWeather()
  if(cached)return cached
  const response=await fetch(ENDPOINT,{signal,headers:{Accept:'application/json'}})
  if(!response.ok)throw new Error('Weather unavailable')
  const payload=await response.json() as {current?:{temperature_2m?:number;weather_code?:number}}
  const temperature=payload.current?.temperature_2m,code=payload.current?.weather_code
  if(typeof temperature!=='number'||typeof code!=='number')throw new Error('Weather unavailable')
  const weather={temperature:Math.round(temperature),code,...describeWeather(code)}
  try{window.localStorage.setItem(CACHE_KEY,JSON.stringify({savedAt:Date.now(),weather}))}catch{/* Storage may be unavailable; weather remains usable. */}
  return weather
}
