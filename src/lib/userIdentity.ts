import type { User } from '@supabase/supabase-js'

type AuthUser=Pick<User,'email'|'user_metadata'>

function metadataName(user:AuthUser){
  const metadata=user.user_metadata||{}
  for(const key of ['full_name','name','display_name']){
    const value=metadata[key]
    if(typeof value==='string'&&value.trim())return value.trim()
  }
  return ''
}

function emailPrefix(user:AuthUser){
  return (user.email||'').split('@')[0].trim()
}

function nameParts(value:string){
  return value.split(/\s+/u).filter(Boolean)
}

function firstCharacters(value:string,count:number){
  return Array.from(value).slice(0,count).join('')
}

export function getUserDisplayName(user:AuthUser){
  return metadataName(user)||emailPrefix(user)||'Administrator'
}

export function getUserFirstName(user:AuthUser){
  const fullName=metadataName(user)
  return fullName?nameParts(fullName)[0]:emailPrefix(user)||'there'
}

export function getUserInitials(user:AuthUser){
  const fullName=metadataName(user)
  if(fullName){
    const parts=nameParts(fullName)
    const initials=parts.length>1?parts.slice(0,2).map(part=>firstCharacters(part,1)).join(''):firstCharacters(parts[0]||'',2)
    return initials.toLocaleUpperCase('is-IS')||'AD'
  }
  return firstCharacters(emailPrefix(user),2).toLocaleUpperCase('is-IS')||'AD'
}

export function getUserIdentity(user:AuthUser){
  return {
    displayName:getUserDisplayName(user),
    firstName:getUserFirstName(user),
    initials:getUserInitials(user),
    email:user.email||'',
  }
}
