import type { Booking } from '../types/database'

export type ConflictMap = Map<string,string[]>

const timeMinutes=(value:string)=>{const [hours,minutes]=value.split(':').map(Number);return hours*60+minutes}
const resourceIdentity=(booking:Booking,resource:'vehicle'|'driver'|'guide')=>booking[`${resource}Id`]||booking[resource]
export const FALLBACK_TOUR_DURATION_MINUTES=180

export function formatDuration(minutes:number|null|undefined){
  if(!minutes||minutes<=0)return 'Not set'
  const hours=Math.floor(minutes/60),rest=minutes%60,hourLabel=hours===1?'hr':'hrs'
  if(hours&&rest)return `${hours} ${hourLabel} ${rest} min`
  if(hours)return `${hours} ${hourLabel}`
  return `${rest} min`
}

export function bookingDurationMinutes(booking:Booking){
  const start=timeMinutes(booking.time),explicit=booking.endTime?timeMinutes(booking.endTime):NaN
  if(Number.isFinite(explicit)&&explicit>start)return explicit-start
  return booking.tourDurationMinutes&&booking.tourDurationMinutes>0?booking.tourDurationMinutes:FALLBACK_TOUR_DURATION_MINUTES
}

export function bookingTimeRange(booking:Booking){const start=timeMinutes(booking.time);return {start,end:start+bookingDurationMinutes(booking)}}

export function findBookingConflicts(items:Booking[]):ConflictMap{
  const conflicts:ConflictMap=new Map()
  const active=items.filter(item=>item.status!=='Cancelled')
  for(let left=0;left<active.length;left++)for(let right=left+1;right<active.length;right++){
    const a=active[left],b=active[right]
    if(a.uuid===b.uuid||a.id===b.id)continue
    const {start:aStart,end:aEnd}=bookingTimeRange(a),{start:bStart,end:bEnd}=bookingTimeRange(b)
    if(aStart>=bEnd||bStart>=aEnd)continue
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
