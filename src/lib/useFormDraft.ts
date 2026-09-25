import { useLayoutEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useConfirmation } from '../components/confirmationContext'

const STORAGE_PREFIX='goeast:form-draft:'
type StoredDraft<T>={sourceSignature:string;value:T}

const serialize=(value:unknown)=>JSON.stringify(value)
export const formDraftKey=(form:string,id='new')=>`${form}:${id}`
const storageKey=(key:string)=>`${STORAGE_PREFIX}${key}`

function readDraft<T>(key:string,initialValue:T,sourceSignature:string){
  try{
    const raw=sessionStorage.getItem(storageKey(key))
    if(!raw)return {value:initialValue,restored:false}
    const stored=JSON.parse(raw) as StoredDraft<T>
    if(stored.sourceSignature!==sourceSignature){sessionStorage.removeItem(storageKey(key));return {value:initialValue,restored:false}}
    return {value:stored.value,restored:true}
  }catch{return {value:initialValue,restored:false}}
}

export function clearFormDraft(key:string){
  try{sessionStorage.removeItem(storageKey(key))}catch{ /* Storage may be unavailable in restricted browser contexts. */ }
}

export function useFormDraft<T>(key:string,initialValue:T,explicitSourceSignature?:string){
  const sourceSignature=explicitSourceSignature??serialize(initialValue)
  const identity=`${key}|${sourceSignature}`
  const initial=readDraft(key,initialValue,sourceSignature)
  const [state,setState]=useState({identity,value:initial.value,restored:initial.restored,suppressPersistence:false})
  const value=state.identity===identity?state.value:initial.value
  const restored=state.identity===identity?state.restored:initial.restored
  const baseline=serialize(initialValue),dirty=serialize(value)!==baseline

  useLayoutEffect(()=>{
    if(state.identity===identity)return
    const next=readDraft(key,initialValue,sourceSignature)
    // A changed record identity must synchronously swap to that record's isolated draft.
    // oxlint-disable-next-line react/set-state-in-effect
    setState({identity,value:next.value,restored:next.restored,suppressPersistence:false})
  },[identity,key,initialValue,sourceSignature,state.identity])

  useLayoutEffect(()=>{
    if(state.identity!==identity)return
    if(state.suppressPersistence){clearFormDraft(key);return}
    try{
      if(dirty)sessionStorage.setItem(storageKey(key),serialize({sourceSignature,value}))
      else clearFormDraft(key)
    }catch{ /* A storage failure must never prevent form editing. */ }
  },[dirty,identity,key,sourceSignature,state.identity,state.suppressPersistence,value])

  const setValue:Dispatch<SetStateAction<T>>=update=>setState(current=>{
    const currentValue=current.identity===identity?current.value:initial.value
    return {identity,value:typeof update==='function'?(update as (previous:T)=>T)(currentValue):update,restored:false,suppressPersistence:false}
  })
  const clearDraft=()=>{clearFormDraft(key);setState(current=>({...current,restored:false,suppressPersistence:true}))}
  return {value,setValue,dirty,restored,clearDraft}
}

export function useDraftDiscard(dirty:boolean,clearDraft:()=>void,onDiscard:()=>void,subject='form'){
  const confirm=useConfirmation()
  return()=>{
    if(!dirty){clearDraft();onDiscard();return}
    confirm({
      title:'Discard unsaved changes?',
      message:`Your unsaved ${subject} changes will be permanently discarded.`,
      cancelLabel:'Keep editing',
      confirmLabel:'Discard changes',
      destructive:true,
      onConfirm:()=>{clearDraft();onDiscard()},
    })
  }
}
