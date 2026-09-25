import { supabase } from '../lib/supabase'
import type { CustomerRow } from '../types/database'

export async function getCustomers():Promise<CustomerRow[]>{
  const {data,error}=await supabase.from('customers').select('*').order('name')
  if(error)throw new Error(`Unable to load customers: ${error.message}`)
  return data||[]
}

export async function createCustomer(input:{name:string;contactPerson?:string;email?:string;phone?:string}):Promise<CustomerRow>{
  const {data,error}=await supabase.from('customers').insert({name:input.name,contact_person:input.contactPerson||null,email:input.email||null,phone:input.phone||null}).select().single()
  if(error)throw new Error(`Unable to create customer: ${error.message}`)
  return data
}

export async function updateCustomer(id:string,input:{name:string;contactPerson?:string;email?:string;phone?:string}):Promise<void>{
  const {error}=await supabase.from('customers').update({name:input.name,contact_person:input.contactPerson||null,email:input.email||null,phone:input.phone||null}).eq('id',id)
  if(error)throw new Error(`Unable to update customer: ${error.message}`)
}
