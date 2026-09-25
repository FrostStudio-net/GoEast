import { bookingDurationMinutes, findBookingConflicts, formatDuration } from './lib/schedule'
import type { Booking } from './types/database'

export type PrintSheetMode='operations'|'drivers'

export function DailyPrintSheet({mode,date,bookings,generatedAt}:{mode:PrintSheetMode;date:string;bookings:Booking[];generatedAt:Date}){
  const ordered=[...bookings].sort((a,b)=>a.time.localeCompare(b.time)),dateLabel=new Date(`${date}T12:00:00`).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}),generated=generatedAt.toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}),conflicts=findBookingConflicts(ordered)
  return <section className={`print-sheet print-sheet-${mode}`}><PrintHeader title={mode==='operations'?'Daily operations sheet':'Driver day sheet'} date={dateLabel} generated={generated}/>{mode==='operations'?<OperationsSheet bookings={ordered} conflicts={conflicts}/>:<DriverSheet bookings={ordered}/>}</section>
}

function PrintHeader({title,date,generated}:{title:string;date:string;generated:string}){return <header className="print-sheet-header"><div><strong>GoEast</strong><span>{title}</span></div><div><b>{date}</b><small>Generated {generated}</small></div></header>}

function OperationsSheet({bookings,conflicts}:{bookings:Booking[];conflicts:Map<string,string[]>}){
  return <>{bookings.length?<table className="operations-print-table"><thead><tr><th>TIME / BOOKING</th><th>TOUR / SHIP</th><th>CUSTOMER</th><th>PICKUP / PORT</th><th>VEHICLE</th><th>DRIVER / GUIDE</th><th>STATUS / WARNINGS</th><th>OPERATIONAL NOTES</th></tr></thead><tbody>{bookings.map(booking=>{const warnings=bookingWarnings(booking,conflicts.get(booking.id)||[]);return <tr key={booking.id}><td><strong>{booking.time}</strong><span>{booking.endTime?`Ends ${booking.endTime}`:`Approx. ${formatDuration(bookingDurationMinutes(booking))}`}</span><small>{booking.id}</small></td><td><strong>{booking.tour}</strong><span>{booking.ship}</span><small>{booking.cruiseLine}</small></td><td><strong>{booking.customer}</strong><span>{booking.guests} guests</span></td><td>{booking.pickupLocation||booking.port||'Pickup not set'}</td><td className={isMissing(booking.vehicle)?'print-missing':''}>{isMissing(booking.vehicle)?'MISSING VEHICLE':booking.vehicle}</td><td><strong className={isMissing(booking.driver)?'print-missing':''}>{isMissing(booking.driver)?'MISSING DRIVER':booking.driver}</strong><span className={isMissing(booking.guide)?'print-missing':''}>{isMissing(booking.guide)?'MISSING GUIDE':booking.guide}</span></td><td><strong>{booking.status}</strong>{warnings.map(warning=><span className="print-warning" key={warning}>! {warning}</span>)}</td><td className="print-notes">{booking.notes||booking.meetingInstructions||'—'}</td></tr>})}</tbody></table>:<PrintEmpty/>}</>
}

function DriverSheet({bookings}:{bookings:Booking[]}){
  const groups=new Map<string,Booking[]>()
  bookings.forEach(booking=>{const driver=isMissing(booking.driver)?'Unassigned':booking.driver;groups.set(driver,[...(groups.get(driver)||[]),booking])})
  const orderedGroups=[...groups.entries()].sort(([left],[right])=>left==='Unassigned'?1:right==='Unassigned'?-1:left.localeCompare(right))
  return <>{orderedGroups.length?orderedGroups.map(([driver,items])=><section className={`driver-print-group ${driver==='Unassigned'?'is-unassigned':''}`} key={driver}><header><h2>{driver}</h2><span>{items.length} departure{items.length===1?'':'s'} · {items.reduce((sum,item)=>sum+item.guests,0)} guests</span></header><table><thead><tr><th>TIME</th><th>TOUR</th><th>SHIP</th><th>GUESTS</th><th>PICKUP</th><th>VEHICLE</th><th>MEETING INSTRUCTIONS</th></tr></thead><tbody>{items.sort((a,b)=>a.time.localeCompare(b.time)).map(booking=><tr key={booking.id}><td><strong>{booking.time}</strong><span>{booking.endTime?`Ends ${booking.endTime}`:`Approx. ${formatDuration(bookingDurationMinutes(booking))}`}</span><small>{booking.id}</small></td><td>{booking.tour}</td><td>{booking.ship}</td><td>{booking.guests}</td><td>{booking.pickupLocation||booking.port||'Pickup not set'}</td><td className={isMissing(booking.vehicle)?'print-missing':''}>{isMissing(booking.vehicle)?'MISSING VEHICLE':booking.vehicle}</td><td>{booking.meetingInstructions||'—'}</td></tr>)}</tbody></table></section>):<PrintEmpty/>}</>
}

function PrintEmpty(){return <div className="print-sheet-empty">No departures scheduled for this date.</div>}
function isMissing(value:string){return !value||value==='Unassigned'}
function bookingWarnings(booking:Booking,conflicts:string[]){const warnings=[...conflicts];if(isMissing(booking.driver))warnings.unshift('No driver');if(isMissing(booking.guide))warnings.unshift('No guide');if(isMissing(booking.vehicle))warnings.unshift('No vehicle');return warnings}
