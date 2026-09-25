import { createContext, useContext } from 'react'

export type ConfirmationRequest = {
  title:string
  message:string
  cancelLabel?:string
  confirmLabel:string
  destructive?:boolean
  onConfirm:()=>Promise<void>|void
}

export const ConfirmationContext=createContext<((request:ConfirmationRequest)=>void)|null>(null)

export function useConfirmation(){
  const request=useContext(ConfirmationContext)
  if(!request)throw new Error('useConfirmation must be used inside ConfirmationProvider')
  return request
}
