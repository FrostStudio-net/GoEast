import type { Booking } from '../types/database'
import { bookingOverlapsDateRange } from './schedule'

const headers=['Booking number','Tour start date','Tour end date','Start time','Status','Customer','Ship','Cruise line','Tour','Guests','Vehicle','Driver','Guide','Price','Currency','Payment status']

const csvCell=(value:string|number)=>`"${String(value??'').replaceAll('"','""')}"`

export function bookingsToCsv(bookings:Booking[]){
  const rows=[headers,...[...bookings].sort((a,b)=>a.serviceDate.localeCompare(b.serviceDate)||a.time.localeCompare(b.time)).map(booking=>[
    booking.id,booking.serviceDate,booking.serviceEndDate||'',booking.time,booking.status,booking.customer,booking.ship,booking.cruiseLine,booking.tour,booking.guests,booking.vehicle,booking.driver,booking.guide,booking.priceValue,booking.currency||'ISK',booking.paymentStatus||'unpaid',
  ])]
  return rows.map(row=>row.map(csvCell).join(',')).join('\r\n')
}

export function downloadBookingsCsv(bookings:Booking[],filename:string){
  const blob=new Blob([`\uFEFF${bookingsToCsv(bookings)}`],{type:'text/csv;charset=utf-8'})
  const url=URL.createObjectURL(blob),link=document.createElement('a')
  link.href=url
  link.download=filename.endsWith('.csv')?filename:`${filename}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function dateRangeBookings(bookings:Booking[],startDate:string,endDate:string){
  return bookings.filter(booking=>bookingOverlapsDateRange(booking,startDate||'0000-01-01',endDate||'9999-12-31'))
}
