export type BookingStatus = 'Inquiry' | 'Confirmed' | 'Completed' | 'Cancelled'
export type DatabaseBookingStatus = 'inquiry' | 'confirmed' | 'completed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'invoiced' | 'paid' | 'not_applicable'

export type Booking = {
  uuid:string; id:string; customer:string; customerId:string|null; initials:string; email:string; phone:string; country:string;
  date:string; serviceDate:string; time:string; ship:string; shipId:string|null; cruiseLine:string; tour:string; tourId:string;
  guests:number; vehicle:string; vehicleId:string|null; driver:string; driverId:string|null; guide:string; guideId:string|null;
  price:string; priceValue:number; status:BookingStatus; source:string; notes:string; accent:string; bookingDate?:string;
  contactPerson?:string; port?:string; endTime?:string; pickupLocation?:string; meetingInstructions?:string;
  currency?:string; paymentStatus?:string
}

export type CustomerRow = { id:string; name:string; contact_person:string|null; email:string|null; phone:string|null; created_at:string; updated_at:string }
export type CruiseLineRow = { id:string; name:string; created_at:string }
export type ShipRow = { id:string; name:string; cruise_line_id:string|null; created_at:string }
export type TourRow = { id:string; name:string; default_duration_minutes:number|null; active:boolean; created_at:string; updated_at:string }
export type VehicleRow = { id:string; name:string; registration_number:string|null; capacity:number|null; active:boolean; notes:string|null; created_at:string; updated_at:string }
export type StaffRow = { id:string; name:string; phone:string|null; email:string|null; can_drive:boolean; can_guide:boolean; active:boolean; created_at:string; updated_at:string }
export type BookingRow = { id:string; booking_number:string; status:DatabaseBookingStatus; booked_on:string|null; service_date:string; start_time:string; end_time:string|null; customer_id:string|null; ship_id:string|null; tour_id:string; guest_count:number; vehicle_id:string|null; driver_id:string|null; guide_id:string|null; port_or_departure_location:string|null; pickup_location:string|null; meeting_instructions:string|null; price:number; currency:string; payment_status:PaymentStatus; internal_notes:string|null; created_at:string; updated_at:string }
export type AdminUserRow = { user_id:string; created_at:string }

type Table<Row,Insert,Update=Partial<Insert>>={Row:Row;Insert:Insert;Update:Update;Relationships:[]}
type TimestampedInsert={created_at?:string;updated_at?:string}

export interface Database {
  public:{
    Tables:{
      customers:Table<CustomerRow,{id?:string;name:string;contact_person?:string|null;email?:string|null;phone?:string|null}&TimestampedInsert>
      cruise_lines:Table<CruiseLineRow,{id?:string;name:string;created_at?:string}>
      ships:Table<ShipRow,{id?:string;name:string;cruise_line_id?:string|null;created_at?:string}>
      tours:Table<TourRow,{id?:string;name:string;default_duration_minutes?:number|null;active?:boolean}&TimestampedInsert>
      vehicles:Table<VehicleRow,{id?:string;name:string;registration_number?:string|null;capacity?:number|null;active?:boolean;notes?:string|null}&TimestampedInsert>
      staff:Table<StaffRow,{id?:string;name:string;phone?:string|null;email?:string|null;can_drive?:boolean;can_guide?:boolean;active?:boolean}&TimestampedInsert>
      bookings:Table<BookingRow,{id?:string;booking_number:string;status:DatabaseBookingStatus;booked_on?:string|null;service_date:string;start_time:string;end_time?:string|null;customer_id?:string|null;ship_id?:string|null;tour_id:string;guest_count:number;vehicle_id?:string|null;driver_id?:string|null;guide_id?:string|null;port_or_departure_location?:string|null;pickup_location?:string|null;meeting_instructions?:string|null;price?:number;currency?:string;payment_status?:PaymentStatus;internal_notes?:string|null}&TimestampedInsert>
      admin_users:Table<AdminUserRow,{user_id:string;created_at?:string}>
    }
    Views:Record<string,never>
    Functions:{is_admin:{Args:Record<string,never>;Returns:boolean}}
    Enums:Record<string,never>
    CompositeTypes:Record<string,never>
  }
}

export type ResourceOptions={
  cruiseLines:CruiseLineRow[];ships:ShipRow[];tours:TourRow[];vehicles:VehicleRow[];staff:StaffRow[]
}
