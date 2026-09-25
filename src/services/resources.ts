import { supabase } from '../lib/supabase'
import type { ResourceOptions } from '../types/database'

export async function getResources():Promise<ResourceOptions>{
  const [cruiseLines,ships,tours,vehicles,staff]=await Promise.all([
    supabase.from('cruise_lines').select('*').order('name'),
    supabase.from('ships').select('*').order('name'),
    supabase.from('tours').select('*').order('name'),
    supabase.from('vehicles').select('*').order('name'),
    supabase.from('staff').select('*').order('name'),
  ])
  const error=cruiseLines.error||ships.error||tours.error||vehicles.error||staff.error
  if(error)throw new Error(`Unable to load booking resources: ${error.message}`)
  return {cruiseLines:cruiseLines.data||[],ships:ships.data||[],tours:tours.data||[],vehicles:vehicles.data||[],staff:staff.data||[]}
}

async function ensure(error:{message:string}|null,message:string){if(error)throw new Error(`${message}: ${error.message}`)}

export async function saveTour(input:{id?:string;name:string;default_duration_minutes:number|null;active:boolean}){
  const payload={name:input.name,default_duration_minutes:input.default_duration_minutes,active:input.active}
  const result=input.id?await supabase.from('tours').update(payload).eq('id',input.id):await supabase.from('tours').insert(payload)
  await ensure(result.error,'Unable to save tour')
}
export async function setTourActive(id:string,active:boolean){const {error}=await supabase.from('tours').update({active}).eq('id',id);await ensure(error,'Unable to update tour')}

export async function saveShip(input:{id?:string;name:string;cruise_line_id:string}){
  const payload={name:input.name,cruise_line_id:input.cruise_line_id}
  const result=input.id?await supabase.from('ships').update(payload).eq('id',input.id):await supabase.from('ships').insert(payload)
  await ensure(result.error,'Unable to save ship')
}
export async function createCruiseLine(name:string){const {error}=await supabase.from('cruise_lines').insert({name});await ensure(error,'Unable to create cruise line')}

export async function saveVehicle(input:{id?:string;name:string;registration_number:string;capacity:number|null;active:boolean;notes:string}){
  const payload={name:input.name,registration_number:input.registration_number||null,capacity:input.capacity,active:input.active,notes:input.notes||null}
  const result=input.id?await supabase.from('vehicles').update(payload).eq('id',input.id):await supabase.from('vehicles').insert(payload)
  await ensure(result.error,'Unable to save vehicle')
}
export async function setVehicleActive(id:string,active:boolean){const {error}=await supabase.from('vehicles').update({active}).eq('id',id);await ensure(error,'Unable to update vehicle')}

export async function saveStaff(input:{id?:string;name:string;phone:string;email:string;can_drive:boolean;can_guide:boolean;active:boolean}){
  const payload={name:input.name,phone:input.phone||null,email:input.email||null,can_drive:input.can_drive,can_guide:input.can_guide,active:input.active}
  const result=input.id?await supabase.from('staff').update(payload).eq('id',input.id):await supabase.from('staff').insert(payload)
  await ensure(result.error,'Unable to save staff member')
}
export async function setStaffActive(id:string,active:boolean){const {error}=await supabase.from('staff').update({active}).eq('id',id);await ensure(error,'Unable to update staff member')}
