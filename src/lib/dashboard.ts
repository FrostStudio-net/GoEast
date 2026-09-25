import { bookingTimeRange } from './schedule'
import type { Booking, ResourceOptions, VehicleRow } from '../types/database'

export type DashboardVehicleStatus={vehicle:VehicleRow;status:'On tour'|'Departing soon'|'Available';tone:'green'|'gold'|'blue';booking?:Booking}

function icelandClock(now:Date){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Atlantic/Reykjavik',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now)
  const value=(type:Intl.DateTimeFormatPartTypes)=>parts.find(part=>part.type===type)?.value||''
  const hour=Number(value('hour')),minute=Number(value('minute'))
  return {date:`${value('year')}-${value('month')}-${value('day')}`,minutes:hour*60+minute,hour}
}

const byServiceTime=(left:Booking,right:Booking)=>left.serviceDate.localeCompare(right.serviceDate)||left.time.localeCompare(right.time)
const isOperational=(booking:Booking)=>booking.status==='Inquiry'||booking.status==='Confirmed'

export function deriveDashboardData(bookings:Booking[],resources:ResourceOptions,now=new Date()){
  const clock=icelandClock(now)
  const today=bookings.filter(item=>item.serviceDate===clock.date&&item.status!=='Cancelled').sort(byServiceTime)
  const upcoming=bookings.filter(item=>isOperational(item)&&`${item.serviceDate}T${item.time}`>=`${clock.date}T${String(Math.floor(clock.minutes/60)).padStart(2,'0')}:${String(clock.minutes%60).padStart(2,'0')}`).sort(byServiceTime).slice(0,3)
  const recent=[...bookings].sort((left,right)=>(right.createdAt||'').localeCompare(left.createdAt||'')).slice(0,5)
  const unassigned=today.filter(item=>isOperational(item)&&(!item.vehicleId||!item.driverId||!item.guideId))
  const fleet:DashboardVehicleStatus[]=resources.vehicles.filter(vehicle=>vehicle.active).map(vehicle=>{
    const assignments=today.filter(item=>isOperational(item)&&item.vehicleId===vehicle.id)
    const active=assignments.find(booking=>{const range=bookingTimeRange(booking);return range.start<=clock.minutes&&clock.minutes<range.end})
    if(active)return {vehicle,status:'On tour',tone:'green',booking:active}
    const departing=assignments.filter(booking=>{const start=bookingTimeRange(booking).start;return start>clock.minutes&&start-clock.minutes<=90}).sort((left,right)=>left.time.localeCompare(right.time))[0]
    if(departing)return {vehicle,status:'Departing soon',tone:'gold',booking:departing}
    return {vehicle,status:'Available',tone:'blue'}
  })
  const todayLabel=new Intl.DateTimeFormat('en-GB',{timeZone:'Atlantic/Reykjavik',weekday:'long',day:'numeric',month:'long'}).format(now).toUpperCase()
  const greeting=clock.hour<12?'Good morning':clock.hour<18?'Good afternoon':'Good evening'
  return {today,todayIso:clock.date,todayLabel,greeting,upcoming,recent,unassigned,fleet}
}
