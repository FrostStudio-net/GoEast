import { Children, isValidElement, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

type OptionProps={value?:string;disabled?:boolean;children?:ReactNode}
type SelectOption={value:string;label:string;disabled:boolean}

type CustomSelectProps={
  value:string
  onChange:(event:{target:{value:string}})=>void
  children:ReactNode
  className?:string
  disabled?:boolean
  required?:boolean
  'aria-label'?:string
}

function optionLabel(value:ReactNode){
  return Children.toArray(value).map(part=>typeof part==='string'||typeof part==='number'?String(part):'').join('')
}

export function CustomSelect({value,onChange,children,className='',disabled=false,required=false,'aria-label':ariaLabel}:CustomSelectProps){
  const id=useId(),rootRef=useRef<HTMLDivElement>(null),triggerRef=useRef<HTMLButtonElement>(null),optionRefs=useRef<Array<HTMLButtonElement|null>>([])
  const [open,setOpen]=useState(false)
  const options=useMemo(()=>Children.toArray(children).flatMap(child=>{
    if(!isValidElement<OptionProps>(child)||child.type!=='option')return []
    const label=optionLabel(child.props.children)
    return [{value:child.props.value===undefined?label:String(child.props.value),label,disabled:Boolean(child.props.disabled)}]
  }),[children])
  const selected=options.find(option=>option.value===value),selectedIndex=Math.max(0,options.findIndex(option=>option.value===value))

  useEffect(()=>{
    if(!open)return
    const close=(event:PointerEvent)=>{if(!rootRef.current?.contains(event.target as Node))setOpen(false)}
    const escape=(event:globalThis.KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setOpen(false);triggerRef.current?.focus({preventScroll:true})}}
    document.addEventListener('pointerdown',close)
    document.addEventListener('keydown',escape)
    return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape)}
  },[open])

  const focusOption=(index:number)=>{
    const enabled=options.map((option,optionIndex)=>({option,optionIndex})).filter(item=>!item.option.disabled)
    if(!enabled.length)return
    const match=enabled.findIndex(item=>item.optionIndex===index),target=enabled[Math.max(0,match)]||enabled[0]
    window.requestAnimationFrame(()=>optionRefs.current[target.optionIndex]?.focus({preventScroll:true}))
  }
  const openMenu=(index=selectedIndex)=>{if(disabled)return;setOpen(true);focusOption(index)}
  const move=(event:KeyboardEvent,step:number)=>{
    event.preventDefault()
    if(!open){openMenu();return}
    const enabledIndexes=options.map((option,index)=>option.disabled?-1:index).filter(index=>index>=0)
    const current=optionRefs.current.findIndex(option=>option===document.activeElement),position=enabledIndexes.indexOf(current)
    const next=enabledIndexes[(Math.max(0,position)+step+enabledIndexes.length)%enabledIndexes.length]
    optionRefs.current[next]?.focus({preventScroll:true})
  }
  const handleKeyDown=(event:KeyboardEvent)=>{
    if(event.key==='ArrowDown')move(event,1)
    else if(event.key==='ArrowUp')move(event,-1)
    else if(event.key==='Home'&&open){event.preventDefault();optionRefs.current.find(option=>option&&!option.disabled)?.focus({preventScroll:true})}
    else if(event.key==='End'&&open){event.preventDefault();[...optionRefs.current].reverse().find(option=>option&&!option.disabled)?.focus({preventScroll:true})}
  }
  const choose=(option:SelectOption)=>{if(option.disabled)return;onChange({target:{value:option.value}});setOpen(false);triggerRef.current?.focus({preventScroll:true})}

  return <div ref={rootRef} className={`custom-select ${open?'is-open':''} ${className}`.trim()} onKeyDown={handleKeyDown} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false)}}>
    <button id={`${id}-trigger`} ref={triggerRef} type="button" className="custom-select-trigger" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} aria-required={required} disabled={disabled} onClick={()=>open?setOpen(false):openMenu()}>
      <span>{selected?.label||'Select…'}</span><i aria-hidden="true"/>
    </button>
    {open&&<div id={id} className="custom-select-menu" role="listbox" aria-label={ariaLabel} aria-labelledby={ariaLabel?undefined:`${id}-trigger`}>
      {options.map((option,index)=><button ref={node=>{optionRefs.current[index]=node}} type="button" role="option" aria-selected={option.value===value} className={`custom-select-option ${option.value===value?'is-selected':''}`} disabled={option.disabled} key={`${option.value}-${index}`} onClick={()=>choose(option)}><span>{option.label}</span>{option.value===value&&<b aria-hidden="true">✓</b>}</button>)}
    </div>}
  </div>
}
