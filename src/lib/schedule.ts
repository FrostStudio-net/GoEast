import type { Booking } from '../types/database'

export type ConflictMap = Map<string,string[]>
export type BookingDayPhase = 'single'|'starts'|'ongoing'|'ends'

const MINUTES_PER_DAY=24*60
const timeMinutes=(value:string)=>{const [hours,minutes]=value.split(':').map(Number);return hours*60+minutes}
const dayMinutes=(date:string)=>Date.parse(`${date}T00:00:00Z`)/60_000
const resourceIdentity=(booking:Booking,resource:'vehicle'|'driver'|'guide')=>booking[`${resource}Id`]||booking[resource]
export const FALLBACK_TOUR_DURATION_MINUTES=180

export function formatDuration(minutes:number|null|undefined){
  if(!minutes||minutes<=0)return 'Not set'
  const hours=Math.floor(minutes/60),rest=minutes%60,hourLabel=hours===1?'hr':'hrs'
  if(hours&&rest)return `${hours} ${hourLabel} ${rest} min`
  if(hours)return `${hours} ${hourLabel}`
  return `${rest} min`
}

export function bookingServiceEndDate(booking:Booking){
  return booking.serviceEndDate&&booking.serviceEndDate>=booking.serviceDate?booking.serviceEndDate:booking.serviceDate
}

export function bookingCoversDate(booking:Booking,date:string){return booking.serviceDate<=date&&bookingServiceEndDate(booking)>=date}

export function bookingOverlapsDateRange(booking:Booking,startDate:string,endDate:string){
  return booking.serviceDate<=endDate&&bookingServiceEndDate(booking)>=startDate
}

export function bookingDayPhase(booking:Booking,date:string):BookingDayPhase{
  const endDate=bookingServiceEndDate(booking)
  if(endDate===booking.serviceDate)return 'single'
  if(date===booking.serviceDate)return 'starts'
  if(date===endDate)return 'ends'
  return 'ongoing'
}

export function formatBookingDateRange(startDate:string,endDate?:string){
  const end=endDate&&endDate>=startDate?endDate:startDate
  const startValue=new Date(`${startDate}T12:00:00Z`),endValue=new Date(`${end}T12:00:00Z`)
  const full=(value:Date)=>value.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})
  if(end===startDate)return full(startValue)
  if(startValue.getUTCFullYear()===endValue.getUTCFullYear()&&startValue.getUTCMonth()===endValue.getUTCMonth())return `${startValue.getUTCDate()}–${endValue.getUTCDate()} ${endValue.toLocaleDateString('en-GB',{month:'short',year:'numeric',timeZone:'UTC'})}`
  if(startValue.getUTCFullYear()===endValue.getUTCFullYear())return `${startValue.toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'})} – ${full(endValue)}`
  return `${full(startValue)} – ${full(endValue)}`
}

export function bookingDurationMinutes(booking:Booking){
  const start=timeMinutes(booking.time),explicit=booking.endTime?timeMinutes(booking.endTime):NaN
  if(Number.isFinite(explicit)&&explicit>start)return explicit-start
  return booking.tourDurationMinutes&&booking.tourDurationMinutes>0?booking.tourDurationMinutes:FALLBACK_TOUR_DURATION_MINUTES
}

export function bookingTimeRange(booking:Booking){const start=timeMinutes(booking.time);return {start,end:start+bookingDurationMinutes(booking)}}

export function bookingTimeRangeForDate(booking:Booking,date:string){
  if(!bookingCoversDate(booking,date))return null
  const phase=bookingDayPhase(booking,date)
  if(phase==='single'){
    const range=bookingTimeRange(booking)
    return {start:range.start,end:Math.min(range.end,MINUTES_PER_DAY)}
  }
  if(phase==='starts')return {start:timeMinutes(booking.time),end:MINUTES_PER_DAY}
  if(phase==='ends')return {start:0,end:booking.endTime?timeMinutes(booking.endTime):MINUTES_PER_DAY}
  return {start:0,end:MINUTES_PER_DAY}
}

export function bookingDaySortMinutes(booking:Booking,date:string){return bookingTimeRangeForDate(booking,date)?.start??MINUTES_PER_DAY}

export function bookingOccupiesAt(booking:Booking,date:string,minutes:number){
  const range=bookingTimeRangeForDate(booking,date)
  return Boolean(range&&range.start<=minutes&&minutes<range.end)
}

function bookingOccupancyRange(booking:Booking){
  const start=dayMinutes(booking.serviceDate)+timeMinutes(booking.time),endDate=bookingServiceEndDate(booking)
  if(endDate===booking.serviceDate)return {start,end:start+bookingDurationMinutes(booking)}
  const end=dayMinutes(endDate)+(booking.endTime?timeMinutes(booking.endTime):MINUTES_PER_DAY)
  return {start,end}
}

export function findBookingConflicts(items:Booking[],date?:string):ConflictMap{
  const conflicts:ConflictMap=new Map()
  const active=items.filter(item=>item.status!=='Cancelled')
  for(let left=0;left<active.length;left++)for(let right=left+1;right<active.length;right++){
    const a=active[left],b=active[right]
    if(a.uuid===b.uuid||a.id===b.id)continue
    const aRange=date?bookingTimeRangeForDate(a,date):bookingOccupancyRange(a)
    const bRange=date?bookingTimeRangeForDate(b,date):bookingOccupancyRange(b)
    if(!aRange||!bRange||aRange.start>=bRange.end||bRange.start>=aRange.end)continue
    ;(['vehicle','driver','guide'] as const).forEach(resource=>{
      const aIdentity=resourceIdentity(a,resource),bIdentity=resourceIdentity(b,resource)
      if(!aIdentity||a[resource]==='Unassigned'||aIdentity!==bIdentity)return
      const label=`${resource[0].toUpperCase()}${resource.slice(1)} conflict · ${a[resource]}`
      conflicts.set(a.id,[...(conflicts.get(a.id)||[]),label])
      conflicts.set(b.id,[...(conflicts.get(b.id)||[]),label])
    })
  }
  return conflicts
}

export function hasMissingAssignment(booking:Booking){
  return booking.status!=='Cancelled'&&[booking.vehicle,booking.driver,booking.guide].some(value=>!value||value==='Unassigned')
}
