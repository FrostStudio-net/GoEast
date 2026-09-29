import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingCoversDate, bookingDayPhase, bookingDaySortMinutes, bookingOverlapsDateRange, findBookingConflicts, hasMissingAssignment } from './lib/schedule'
import type { Booking } from './types/database'
import { CustomSelect } from './components/CustomSelect'

type FilterKey='ship'|'tour'|'driver'|'vehicle'
type CalendarDay={iso:string;day:number;inMonth:boolean;bookings:Booking[]}

const todayIso=()=>new Date().toISOString().slice(0,10)
const monthIso=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`
const dateFromMonth=(value:string)=>{const [year,month]=value.split('-').map(Number);return new Date(year,month-1,1,12)}
const isoDate=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`

export function CalendarPage({data}:{data:Booking[]}){
  const navigate=useNavigate()
  const [month,setMonth]=useState(monthIso(new Date())),[status,setStatus]=useState('All statuses'),[ship,setShip]=useState('All ships'),[tour,setTour]=useState('All tours'),[driver,setDriver]=useState('All drivers'),[vehicle,setVehicle]=useState('All vehicles')
  const filtered=useMemo(()=>data.filter(item=>(status==='All statuses'||item.status===status)&&(ship==='All ships'||item.ship===ship)&&(tour==='All tours'||item.tour===tour)&&(driver==='All drivers'||item.driver===driver)&&(vehicle==='All vehicles'||item.vehicle===vehicle)),[data,status,ship,tour,driver,vehicle])
  const days=useMemo(()=>calendarDays(month,filtered),[month,filtered])
  const monthStart=`${month}-01`,monthEnd=days.filter(day=>day.inMonth).at(-1)?.iso||monthStart
  const monthBookings=useMemo(()=>filtered.filter(item=>bookingOverlapsDateRange(item,monthStart,monthEnd)),[filtered,monthStart,monthEnd])
  const conflictState=useMemo(()=>{
    const byDate=new Map<string,Map<string,string[]>>(),bookingIds=new Set<string>()
    days.filter(day=>day.inMonth&&day.bookings.length).forEach(day=>{const conflicts=findBookingConflicts(day.bookings,day.iso);byDate.set(day.iso,conflicts);conflicts.forEach((_messages,id)=>bookingIds.add(id))})
    return {byDate,bookingIds}
  },[days])
  const activeMonth=monthBookings.filter(item=>item.status!=='Cancelled')
  const unassigned=activeMonth.filter(hasMissingAssignment).length
  const unique=(key:FilterKey)=>[...new Set(data.map(item=>item[key]).filter(Boolean))].sort()
  const moveMonth=(amount:number)=>{const next=dateFromMonth(month);next.setMonth(next.getMonth()+amount);setMonth(monthIso(next))}
  const openDay=(iso:string)=>navigate(`/schedule?date=${iso}`)
  const monthLabel=dateFromMonth(month).toLocaleDateString('en-GB',{month:'long',year:'numeric'})
  return <div className="page calendar-page">
    <header className="calendar-heading"><div><p className="eyebrow">OPERATIONS</p><h1>Calendar</h1><p>Monthly overview of departures, guests and resource pressure.</p></div><div className="calendar-nav"><button onClick={()=>moveMonth(-1)} aria-label="Previous month">‹</button><button className="calendar-today" onClick={()=>setMonth(monthIso(new Date()))}>Today</button><button onClick={()=>moveMonth(1)} aria-label="Next month">›</button><label><span className="sr-only">Select month</span><input type="month" value={month} onChange={event=>event.target.value&&setMonth(event.target.value)}/></label></div></header>
    <div className="calendar-month-row"><h2>{monthLabel}</h2><span>{monthBookings.length?`${monthBookings.length} bookings shown`:'No bookings this month'}</span></div>
    <section className="calendar-summary"><CalendarStat label="Bookings this month" value={monthBookings.length}/><CalendarStat label="Guests this month" value={activeMonth.reduce((total,item)=>total+item.guests,0)}/><CalendarStat label="Unassigned bookings" value={unassigned} warning={unassigned>0}/><CalendarStat label="Conflicts" value={conflictState.bookingIds.size} warning={conflictState.bookingIds.size>0}/></section>
    <section className="panel calendar-workspace">
      <div className="calendar-filters"><CalendarFilter label="Status" value={status} onChange={setStatus} all="All statuses" options={['Inquiry','Confirmed','Completed','Cancelled']}/><CalendarFilter label="Ship" value={ship} onChange={setShip} all="All ships" options={unique('ship')}/><CalendarFilter label="Tour" value={tour} onChange={setTour} all="All tours" options={unique('tour')}/><CalendarFilter label="Driver" value={driver} onChange={setDriver} all="All drivers" options={unique('driver')}/><CalendarFilter label="Vehicle" value={vehicle} onChange={setVehicle} all="All vehicles" options={unique('vehicle')}/></div>
      <div className="calendar-weekdays" aria-hidden="true">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=><span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">{days.map(day=><CalendarCell key={day.iso} day={day} today={day.iso===todayIso()} conflicts={conflictState.byDate.get(day.iso)||new Map()} onOpenDay={openDay} onOpenBooking={booking=>navigate(`/bookings/${encodeURIComponent(booking.id)}`)}/>)}</div>
      <div className="calendar-agenda">{days.filter(day=>day.inMonth&&day.bookings.length).map(day=><AgendaDay key={day.iso} day={day} today={day.iso===todayIso()} conflicts={conflictState.byDate.get(day.iso)||new Map()} onOpenDay={openDay} onOpenBooking={booking=>navigate(`/bookings/${encodeURIComponent(booking.id)}`)}/>)}{!monthBookings.length&&<CalendarEmpty/>}</div>
      {!monthBookings.length&&<div className="calendar-desktop-empty"><CalendarEmpty/></div>}
    </section>
  </div>
}

function CalendarStat({label,value,warning=false}:{label:string;value:number;warning?:boolean}){return <article className={warning?'has-warning':''}><span>{label}</span><strong>{value}</strong></article>}
function CalendarFilter({label,value,onChange,all,options}:{label:string;value:string;onChange:(value:string)=>void;all:string;options:string[]}){return <label className="filter-control"><span>{label}</span><CustomSelect aria-label={label} value={value} onChange={event=>onChange(event.target.value)}><option>{all}</option>{options.map(option=><option key={option}>{option}</option>)}</CustomSelect></label>}
function CalendarCell({day,today,conflicts,onOpenDay,onOpenBooking}:{day:CalendarDay;today:boolean;conflicts:Map<string,string[]>;onOpenDay:(iso:string)=>void;onOpenBooking:(booking:Booking)=>void}){
  const active=day.bookings.filter(item=>item.status!=='Cancelled'),warnings=warningLabels(active,conflicts),visible=day.bookings.slice(0,3)
  return <article className={`calendar-cell ${day.inMonth?'':'outside-month'} ${today?'is-today':''}`} onClick={()=>onOpenDay(day.iso)} tabIndex={day.inMonth?0:-1} onKeyDown={event=>{if(event.currentTarget===event.target&&day.inMonth&&(event.key==='Enter'||event.key===' '))onOpenDay(day.iso)}}><header><span className="calendar-day-number">{day.day}</span>{day.inMonth&&day.bookings.length>0&&<span className="calendar-day-metrics">{day.bookings.length} booking{day.bookings.length===1?'':'s'} · {active.reduce((total,item)=>total+item.guests,0)} guests</span>}{warnings.length>0&&<span className="calendar-warning" title={warnings.join(' · ')} aria-label={warnings.join(', ')}>!</span>}</header>{day.inMonth&&<div className="calendar-cell-bookings">{visible.map(booking=><BookingPill key={booking.id} booking={booking} date={day.iso} conflict={conflicts.has(booking.id)} onClick={()=>onOpenBooking(booking)}/>)}{day.bookings.length>visible.length&&<button className="calendar-more" onClick={event=>{event.stopPropagation();onOpenDay(day.iso)}}>+{day.bookings.length-visible.length} more</button>}</div>}</article>
}
function BookingPill({booking,date,conflict,onClick}:{booking:Booking;date:string;conflict:boolean;onClick:()=>void}){const phase=bookingDayPhase(booking,date),time=phase==='ongoing'?'Ongoing':phase==='ends'?(booking.endTime||'Ends'):booking.time;return <button className={`calendar-booking status-${booking.status.toLowerCase()}`} onClick={event=>{event.stopPropagation();onClick()}} title={`${phase==='single'?'One-day booking':phase==='starts'?'Starts today':phase==='ongoing'?'Ongoing':'Ends today'} · ${booking.tour} · ${booking.ship}`}><span>{time}</span><strong>{booking.tour}</strong>{conflict&&<b aria-label="Scheduling conflict">!</b>}</button>}
function AgendaDay({day,today,conflicts,onOpenDay,onOpenBooking}:{day:CalendarDay;today:boolean;conflicts:Map<string,string[]>;onOpenDay:(iso:string)=>void;onOpenBooking:(booking:Booking)=>void}){
  const active=day.bookings.filter(item=>item.status!=='Cancelled'),warnings=warningLabels(active,conflicts)
  return <article className={`agenda-day ${today?'is-today':''}`}><button className="agenda-date" onClick={()=>onOpenDay(day.iso)}><span>{new Date(`${day.iso}T12:00:00`).toLocaleDateString('en-GB',{weekday:'short'})}</span><strong>{day.day}</strong><small>{day.bookings.length} bookings · {active.reduce((total,item)=>total+item.guests,0)} guests</small>{warnings.length>0&&<i title={warnings.join(' · ')}>! {warnings.length} warning{warnings.length===1?'':'s'}</i>}</button><div>{day.bookings.map(booking=>{const phase=bookingDayPhase(booking,day.iso);return <button className={`agenda-booking status-${booking.status.toLowerCase()}`} key={booking.id} onClick={()=>onOpenBooking(booking)}><time>{phase==='ongoing'?'Ongoing':phase==='ends'?(booking.endTime||'Ends'):booking.time}</time><span><strong>{booking.tour}</strong><small>{phase==='single'?'One-day':phase==='starts'?'Starts today':phase==='ongoing'?'Ongoing':'Ends today'} · {booking.ship} · {booking.customer}</small></span><em>{booking.status}</em>{conflicts.has(booking.id)&&<b>!</b>}</button>})}</div></article>
}
function CalendarEmpty(){return <div className="calendar-empty"><strong>No bookings found</strong><span>There are no bookings matching this month and filter set.</span></div>}
function warningLabels(bookings:Booking[],conflicts:Map<string,string[]>){const labels:string[]=[];if(bookings.some(item=>!item.driver||item.driver==='Unassigned'))labels.push('Missing driver');if(bookings.some(item=>!item.guide||item.guide==='Unassigned'))labels.push('Missing guide');if(bookings.some(item=>!item.vehicle||item.vehicle==='Unassigned'))labels.push('Missing vehicle');if(bookings.some(item=>conflicts.has(item.id)))labels.push('Scheduling conflict');return labels}
function calendarDays(month:string,bookings:Booking[]):CalendarDay[]{
  const first=dateFromMonth(month),mondayOffset=(first.getDay()+6)%7,start=new Date(first);start.setDate(first.getDate()-mondayOffset)
  const last=new Date(first.getFullYear(),first.getMonth()+1,0,12),cells=mondayOffset+last.getDate()>35?42:35
  return Array.from({length:cells},(_,index)=>{const date=new Date(start);date.setDate(start.getDate()+index);const iso=isoDate(date);return {iso,day:date.getDate(),inMonth:date.getMonth()===first.getMonth(),bookings:bookings.filter(item=>bookingCoversDate(item,iso)).sort((a,b)=>bookingDaySortMinutes(a,iso)-bookingDaySortMinutes(b,iso)||a.time.localeCompare(b.time))}})
}
