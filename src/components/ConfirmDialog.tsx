import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useModalAccessibility } from '../lib/useModalAccessibility'
import { ConfirmationContext } from './confirmationContext'
import type { ConfirmationRequest } from './confirmationContext'

export function ConfirmDialog({request,onClose}:{request:ConfirmationRequest;onClose:()=>void}){
  const dialogRef=useRef<HTMLDivElement>(null)
  const [loading,setLoading]=useState(false),[error,setError]=useState('')
  useModalAccessibility(dialogRef,onClose,loading)

  const confirm=async()=>{if(loading)return;setLoading(true);setError('');try{await request.onConfirm()}catch(nextError){setError(nextError instanceof Error?nextError.message:'The action could not be completed. Please try again.');setLoading(false)}}
  return <div className="confirm-scrim" onMouseDown={event=>{if(event.currentTarget===event.target&&!loading)onClose()}}><div ref={dialogRef} className={`confirm-dialog ${request.destructive?'is-destructive':''}`} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message"><div className="confirm-symbol" aria-hidden="true">!</div><h2 id="confirm-title">{request.title}</h2><p id="confirm-message">{request.message}</p>{error&&<div className="confirm-error" role="alert">{error}</div>}<div className="confirm-actions"><button type="button" className="secondary-button" onClick={onClose} disabled={loading}>{request.cancelLabel||'Cancel'}</button><button type="button" className={request.destructive?'danger-button':'primary-button'} onClick={()=>void confirm()} disabled={loading}>{loading?'Working…':request.confirmLabel}</button></div></div></div>
}

export function ConfirmationProvider({children}:{children:ReactNode}){
  const [request,setRequest]=useState<ConfirmationRequest|null>(null)
  const activeRequest=request?{...request,onConfirm:async()=>{await request.onConfirm();setRequest(null)}}:null
  return <ConfirmationContext.Provider value={setRequest}>{children}{activeRequest&&<ConfirmDialog request={activeRequest} onClose={()=>setRequest(null)}/>}</ConfirmationContext.Provider>
}
