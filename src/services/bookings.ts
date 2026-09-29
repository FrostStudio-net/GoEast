import { supabase } from '../lib/supabase'
import { createCustomer, getCustomers, updateCustomer } from './customers'
import { getResources } from './resources'
import type { Booking, BookingRow, BookingStatus, DatabaseBookingStatus, PaymentStatus, ResourceOptions } from '../types/database'
import type { CustomerRow } from '../types/database'
import { validateBooking } from '../lib/validation'
import { formatPriceValue } from '../lib/price'
import { formatBookingDateRange } from '../lib/schedule'

const accents=['#7f9e7a','#bb8b73','#77879f','#9b7f8b','#9a8a6d','#6d8d8f','#887c91','#8a9672','#9b866c']
const displayStatus=(status:DatabaseBookingStatus):BookingStatus=>`${status[0].toUpperCase()}${status.slice(1)}` as BookingStatus
const databaseStatus=(status:BookingStatus)=>status.toLowerCase() as DatabaseBookingStatus
const initials=(value:string)=>value.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()
const BOOKING_NUMBER_RETRIES=8
const BOOKING_NUMBER_PAGE_SIZE=500
const BOOKING_NUMBER_ERROR='Could not generate a unique booking number. Please try again.'

function bookingNumberPrefix(serviceDate:string){
  const date=/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)?serviceDate:new Date().toISOString().slice(0,10)
  return `GE-${date.slice(2).replaceAll('-','')}`
}

function formatBookingNumber(prefix:string,sequence:number){return `${prefix}-${String(sequence).padStart(2,'0')}`}

async function getAllBookingNumbersForPrefix(prefix:string){
  const bookingNumbers:string[]=[]
  const pattern=`${prefix}-%`
  let offset=0,total:number|null=null
  do{
    const {data,error,count}=await supabase
      .from('bookings')
      .select('booking_number',{count:'exact'})
      .like('booking_number',pattern)
      .order('booking_number',{ascending:true})
      .range(offset,offset+BOOKING_NUMBER_PAGE_SIZE-1)
    if(error)throw new Error(BOOKING_NUMBER_ERROR)
    if(count===null)throw new Error(BOOKING_NUMBER_ERROR)
    const page=(data||[]).map(row=>row.booking_number)
    bookingNumbers.push(...page)
    offset+=page.length
    total=count
    if(page.length===0&&offset<total)throw new Error(BOOKING_NUMBER_ERROR)
  }while(total===null||offset<total)
  if(import.meta.env.DEV)console.debug('[GoEast booking numbers]',{pattern,count:bookingNumbers.length,bookingNumbers})
  return bookingNumbers
}

async function nextBookingSequence(prefix:string,minimum=1){
  const bookingNumbers=await getAllBookingNumbersForPrefix(prefix)
  const highest=bookingNumbers.reduce((max,bookingNumber)=>{
    const suffix=bookingNumber.slice(prefix.length+1)
    return /^\d+$/.test(suffix)?Math.max(max,Number(suffix)):max
  },0)
  return Math.max(minimum,highest+1)
}

function isBookingNumberCollision(error:{code?:string;message?:string}|null){
  return error?.code==='23505'
}

function mapBooking(row:BookingRow,resources:ResourceOptions,customers:Awaited<ReturnType<typeof getCustomers>>,index:number):Booking{
  const customer=customers.find(item=>item.id===row.customer_id)
  const ship=resources.ships.find(item=>item.id===row.ship_id)
  const line=resources.cruiseLines.find(item=>item.id===ship?.cruise_line_id)
  const tour=resources.tours.find(item=>item.id===row.tour_id)
  const vehicle=resources.vehicles.find(item=>item.id===row.vehicle_id)
  const driver=resources.staff.find(item=>item.id===row.driver_id)
  const guide=resources.staff.find(item=>item.id===row.guide_id)
  return {uuid:row.id,id:row.booking_number,customer:customer?.name||'No customer',customerId:customer?.id||null,contactPerson:customer?.contact_person||'',initials:initials(customer?.name||'NC'),email:customer?.email||'',phone:customer?.phone||'',country:'—',date:formatBookingDateRange(row.service_date,row.service_end_date||undefined),serviceDate:row.service_date,serviceEndDate:row.service_end_date||'',time:row.start_time.slice(0,5),endTime:row.end_time?.slice(0,5)||'',ship:ship?.name||'Unassigned',shipId:ship?.id||null,cruiseLine:line?.name||'',tour:tour?.name||'Unknown tour',tourId:row.tour_id,tourDurationMinutes:tour?.default_duration_minutes??null,guests:row.guest_count,vehicle:vehicle?.name||'Unassigned',vehicleId:vehicle?.id||null,driver:driver?.name||'Unassigned',driverId:driver?.id||null,guide:guide?.name||'Unassigned',guideId:guide?.id||null,price:`${row.currency} ${formatPriceValue(Number(row.price))}`,priceValue:Number(row.price),status:displayStatus(row.status),source:'Supabase',notes:row.internal_notes||'',accent:accents[index%accents.length],bookingDate:row.booked_on||'',port:row.port_or_departure_location||'',pickupLocation:row.pickup_location||'',meetingInstructions:row.meeting_instructions||'',currency:row.currency,paymentStatus:row.payment_status,createdAt:row.created_at,updatedAt:row.updated_at}
}

export async function getBookings(existingResources?:ResourceOptions,existingCustomers?:CustomerRow[]):Promise<Booking[]>{
  const [bookingsResult,resources,customers]=await Promise.all([supabase.from('bookings').select('*').order('service_date',{ascending:true}).order('start_time',{ascending:true}),existingResources||getResources(),existingCustomers||getCustomers()])
  if(bookingsResult.error)throw new Error(`Unable to load bookings: ${bookingsResult.error.message}`)
  return (bookingsResult.data||[]).map((row,index)=>mapBooking(row,resources,customers,index))
}

async function resourceIds(booking:Booking){
  const resources=await getResources()
  return {
    ship_id:booking.shipId&&resources.ships.some(item=>item.id===booking.shipId)?booking.shipId:null,
    tour_id:booking.tourId&&resources.tours.some(item=>item.id===booking.tourId)?booking.tourId:'',
    vehicle_id:booking.vehicleId&&resources.vehicles.some(item=>item.id===booking.vehicleId)?booking.vehicleId:null,
    driver_id:booking.driverId&&resources.staff.some(item=>item.id===booking.driverId)?booking.driverId:null,
    guide_id:booking.guideId&&resources.staff.some(item=>item.id===booking.guideId)?booking.guideId:null,
  }
}

function bookingPayload(booking:Booking,ids:Awaited<ReturnType<typeof resourceIds>>,customerId:string|null,bookingNumber=booking.id.trim()){
  return {booking_number:bookingNumber,status:databaseStatus(booking.status),booked_on:booking.bookingDate||null,service_date:booking.serviceDate,service_end_date:booking.serviceEndDate||null,start_time:booking.time,end_time:booking.endTime||null,customer_id:customerId,ship_id:ids.ship_id,tour_id:ids.tour_id,guest_count:booking.guests,vehicle_id:ids.vehicle_id,driver_id:ids.driver_id,guide_id:ids.guide_id,port_or_departure_location:booking.port||null,pickup_location:booking.pickupLocation||null,meeting_instructions:booking.meetingInstructions||null,price:booking.priceValue,currency:booking.currency||'ISK',payment_status:(booking.paymentStatus||'unpaid') as PaymentStatus,internal_notes:booking.notes||null}
}

export async function createBooking(booking:Booking):Promise<void>{
  const validationErrors=validateBooking({...booking,id:'Generated automatically'})
  if(validationErrors.length)throw new Error(validationErrors.join(' '))
  const ids=await resourceIds(booking)
  if(!ids.tour_id)throw new Error('Unable to save booking: the selected tour is unavailable.')
  const customer=await createCustomer({name:booking.customer,contactPerson:booking.contactPerson,email:booking.email,phone:booking.phone})
  try{
    const prefix=bookingNumberPrefix(booking.serviceDate)
    let sequence=await nextBookingSequence(prefix)
    for(let attempt=0;attempt<BOOKING_NUMBER_RETRIES;attempt+=1){
      const bookingNumber=formatBookingNumber(prefix,sequence)
      const {error}=await supabase.from('bookings').insert(bookingPayload(booking,ids,customer.id,bookingNumber))
      if(!error)return
      if(!isBookingNumberCollision(error))throw new Error(`Unable to save booking: ${error.message}`)
      sequence=await nextBookingSequence(prefix,sequence+1)
    }
    throw new Error(BOOKING_NUMBER_ERROR)
  }catch(error){
    await supabase.from('customers').delete().eq('id',customer.id)
    if(error instanceof Error)throw error
    throw new Error('Unable to save booking. Please try again.')
  }
}

export async function updateBooking(booking:Booking):Promise<void>{
  const validationErrors=validateBooking(booking)
  if(validationErrors.length)throw new Error(validationErrors.join(' '))
  const ids=await resourceIds(booking)
  if(!ids.tour_id)throw new Error('Unable to update booking: the selected tour is unavailable.')
  let customerId=booking.customerId
  if(customerId)await updateCustomer(customerId,{name:booking.customer,contactPerson:booking.contactPerson,email:booking.email,phone:booking.phone})
  else customerId=(await createCustomer({name:booking.customer,contactPerson:booking.contactPerson,email:booking.email,phone:booking.phone})).id
  const {error}=await supabase.from('bookings').update(bookingPayload(booking,ids,customerId)).eq('id',booking.uuid)
  if(error)throw new Error(`Unable to update booking: ${error.message}`)
}

export async function deleteBooking(id:string):Promise<void>{
  const {error}=await supabase.from('bookings').delete().eq('id',id)
  if(error)throw new Error(`Unable to delete booking: ${error.message}`)
}
