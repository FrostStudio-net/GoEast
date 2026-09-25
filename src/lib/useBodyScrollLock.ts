import { useLayoutEffect } from 'react'

type ScrollLockSnapshot={
  scrollX:number
  scrollY:number
  route:string
  body:{overflow:string;position:string;top:string;left:string;right:string;width:string;paddingRight:string}
  root:{overflow:string;overscrollBehavior:string}
}

let lockCount=0
let snapshot:ScrollLockSnapshot|null=null

const currentRoute=()=>`${window.location.pathname}${window.location.search}${window.location.hash}`

function acquireBodyScrollLock(){
  if(lockCount===0){
    const body=document.body,root=document.documentElement
    const scrollX=window.scrollX,scrollY=window.scrollY
    snapshot={
      scrollX,scrollY,route:currentRoute(),
      body:{overflow:body.style.overflow,position:body.style.position,top:body.style.top,left:body.style.left,right:body.style.right,width:body.style.width,paddingRight:body.style.paddingRight},
      root:{overflow:root.style.overflow,overscrollBehavior:root.style.overscrollBehavior},
    }
    const scrollbarWidth=Math.max(0,window.innerWidth-root.clientWidth)
    const currentPadding=Number.parseFloat(window.getComputedStyle(body).paddingRight)||0
    root.style.overflow='hidden'
    root.style.overscrollBehavior='none'
    body.style.overflow='hidden'
    body.style.position='fixed'
    body.style.top=`-${scrollY}px`
    body.style.left=`-${scrollX}px`
    body.style.right='0'
    body.style.width='100%'
    if(scrollbarWidth)body.style.paddingRight=`${currentPadding+scrollbarWidth}px`
  }
  lockCount+=1
  let released=false
  return()=>{
    if(released)return
    released=true
    lockCount=Math.max(0,lockCount-1)
    if(lockCount||!snapshot)return
    const saved=snapshot
    snapshot=null
    const body=document.body,root=document.documentElement
    Object.assign(body.style,saved.body)
    Object.assign(root.style,saved.root)
    const routeChanged=currentRoute()!==saved.route
    window.scrollTo(routeChanged?0:saved.scrollX,routeChanged?0:saved.scrollY)
  }
}

export function useBodyScrollLock(locked:boolean){
  useLayoutEffect(()=>{
    if(!locked)return
    return acquireBodyScrollLock()
  },[locked])
}

export function scrollPageToTop(container?:HTMLElement|null){
  if(container)container.scrollTop=0
  if(document.scrollingElement)document.scrollingElement.scrollTop=0
  document.documentElement.scrollTop=0
  document.body.scrollTop=0
  window.scrollTo({left:0,top:0,behavior:'auto'})
}

export function scheduleScrollPageToTop(container?:HTMLElement|null){
  let innerFrame=0,delayedFrame=0
  const outerFrame=window.requestAnimationFrame(()=>{
    innerFrame=window.requestAnimationFrame(()=>scrollPageToTop(container))
  })
  // iOS Safari can finish dismissing its keyboard after the next paint and
  // restore the focused control's former visual position. Confirm the reset
  // once that viewport update has settled.
  const timer=window.setTimeout(()=>{
    delayedFrame=window.requestAnimationFrame(()=>scrollPageToTop(container))
  },120)
  return()=>{
    window.cancelAnimationFrame(outerFrame)
    if(innerFrame)window.cancelAnimationFrame(innerFrame)
    if(delayedFrame)window.cancelAnimationFrame(delayedFrame)
    window.clearTimeout(timer)
  }
}
