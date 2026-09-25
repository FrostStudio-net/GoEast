import type { Booking } from '../types/database'

export function isValidIsoDate(value:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false
  const [year,month,day]=value.split('-').map(Number),date=new Date(Date.UTC(year,month-1,day))
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day
}

export function isValidTime(value:string){
  if(!/^\d{2}:\d{2}$/.test(value))return false
  const [hours,minutes]=value.split(':').map(Number)
  return hours>=0&&hours<=23&&minutes>=0&&minutes<=59
}

export function timeRangeError(startTime:string,endTime?:string){
  if(!isValidTime(startTime))return 'A valid start time is required.'
  if(!endTime)return ''
  if(!isValidTime(endTime))return 'Enter a valid end time.'
  if(endTime<=startTime)return 'End time must be later than start time.'
  return ''
}

export function validateBooking(booking:Booking){
  const errors:string[]=[]
  if(!booking.id.trim())errors.push('Booking number is required.')
  if(!booking.customer.trim())errors.push('Customer name is required.')
  if(!booking.tourId||!booking.tour.trim())errors.push('Tour is required.')
  if(booking.bookingDate&&!isValidIsoDate(booking.bookingDate))errors.push('Enter a valid booking date.')
  if(!isValidIsoDate(booking.serviceDate))errors.push('A valid service date is required.')
  const timeError=timeRangeError(booking.time,booking.endTime)
  if(timeError)errors.push(timeError)
  if(!Number.isInteger(booking.guests)||booking.guests<1)errors.push('Guest count must be at least 1.')
  if(!Number.isFinite(booking.priceValue)||booking.priceValue<0)errors.push('Price must be zero or greater.')
  return errors
}
