const integerFormatter=new Intl.NumberFormat('is-IS',{maximumFractionDigits:0,useGrouping:true})

export function parsePriceInput(value:string){
  const digits=value.replace(/\D/g,'')
  return digits?Number(digits):0
}

export function formatPriceInput(value:string|number){
  const digits=String(value).replace(/\D/g,'')
  if(!digits)return ''
  return integerFormatter.format(Number(digits))
}

export function formatPriceValue(value:number){
  return integerFormatter.format(Number.isFinite(value)?value:0)
}
