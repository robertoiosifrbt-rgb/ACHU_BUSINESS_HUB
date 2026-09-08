export function getMarketPrice(resource,state){
 const basePrices={meat:1,wood:1.2,coal:1.8,iron:3}
 const base=basePrices[resource]??1

 const listings=state.marketplace.listings.filter(l=>l.selling===resource)
 if(listings.length===0)return base

 const avgPrice=listings.reduce((a,l)=>a+l.pricePerUnit,0)/listings.length
 return(base+avgPrice)/2
}

export function createListing(state,selling,amount,pricePerUnit){
 if(state.resources[selling]<amount)return{ok:false,error:'Not enough resources'}

 state.resources[selling]-=amount
 const listing={
  id:'list'+Date.now()+Math.random(),
  seller:state.playerId,selling,amount,pricePerUnit,
  createdAt:Date.now(),expiresAt:Date.now()+604800000
 }
 state.marketplace.listings.push(listing)
 return{ok:true,listing}
}

export function buyFromMarket(state,listingId,quantity){
 const listing=state.marketplace.listings.find(l=>l.id===listingId)
 if(!listing)return{ok:false,error:'Listing not found'}
 if(listing.amount<quantity)return{ok:false,error:'Not enough in stock'}

 const totalCost=listing.pricePerUnit*quantity
 if(state.resources.meat<totalCost&&listing.selling!=='meat')return{ok:false,error:'Not enough resources to buy'}

 state.resources.meat-=totalCost
 state.resources[listing.selling]=(state.resources[listing.selling]??0)+quantity

 listing.amount-=quantity
 if(listing.amount<=0)state.marketplace.listings=state.marketplace.listings.filter(l=>l.id!==listingId)

 state.marketplace.history.push({buyer:state.playerId,seller:listing.seller,resource:listing.selling,quantity,price:listing.pricePerUnit,at:Date.now()})
 return{ok:true}
}

export function cancelListing(state,listingId){
 const listing=state.marketplace.listings.find(l=>l.id===listingId)
 if(!listing)return{ok:false,error:'Listing not found'}
 if(listing.seller!==state.playerId)return{ok:false,error:'Not your listing'}

 state.resources[listing.selling]=(state.resources[listing.selling]??0)+listing.amount
 state.marketplace.listings=state.marketplace.listings.filter(l=>l.id!==listingId)
 return{ok:true}
}
