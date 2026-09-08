export function quoteEconomics(lead,price){
 const direct=Object.values(lead.variableCosts).reduce((a,b)=>a+b,0)
 const gross=Math.max(0,price-direct)
 const margin=price?gross/price:0
 const marketDelta=price-lead.marketPrice
 return{direct,gross,margin,marketDelta}
}

export function submitQuote(lead,price){
 const economics=quoteEconomics(lead,price)
 const accepted=price>=lead.minimumGoodPrice&&price<=lead.maximumGoodPrice
 let reason='The client accepted the price.'
 if(price<lead.minimumGoodPrice)reason='The price is so low that the job would leave too little room for the unexpected.'
 if(price>lead.maximumGoodPrice)reason='The client decided the quote was too expensive for this job.'
 return{accepted,reason,economics}
}
