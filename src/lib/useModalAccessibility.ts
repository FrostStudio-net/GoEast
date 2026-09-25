import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useBodyScrollLock } from './useBodyScrollLock'

export function useModalAccessibility(dialogRef:RefObject<HTMLElement|null>,onClose:()=>void,blocked=false){
  const closeRef=useRef(onClose),blockedRef=useRef(blocked)
  useBodyScrollLock(true)
  useEffect(()=>{closeRef.current=onClose;blockedRef.current=blocked},[onClose,blocked])
  useEffect(()=>{
    const previous=document.activeElement instanceof HTMLElement?document.activeElement:null
    const frame=window.requestAnimationFrame(()=>{
      if(!dialogRef.current?.contains(document.activeElement)){
        const target=dialogRef.current?.querySelector<HTMLElement>('[autofocus],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')
        target?.focus()
      }
    })
    const handleKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'&&!blockedRef.current){event.preventDefault();closeRef.current();return}
      if(event.key!=='Tab'||!dialogRef.current)return
      const focusable=[...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')]
      if(!focusable.length)return
      const first=focusable[0],last=focusable[focusable.length-1]
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    }
    document.addEventListener('keydown',handleKey)
    return()=>{window.cancelAnimationFrame(frame);document.removeEventListener('keydown',handleKey);previous?.focus({preventScroll:true})}
  },[dialogRef])
}
