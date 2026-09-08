const EVENTS=[
 {id:'raid_defense',title:'Raider Attack',description:'Defend against incoming raiders',reward:{meat:200,wood:150}},
 {id:'resource_discovery',title:'Resource Discovery',description:'Rare resources found nearby',reward:{coal:100,iron:50}},
 {id:'refugee_arrival',title:'Refugee Arrival',description:'Refugees seek shelter in your city',reward:{meat:300}},
 {id:'merchant_visit',title:'Merchant Visit',description:'Traveling merchant offers deals',reward:{wood:250}}
]

export function tickEvents(state){
 const now=Date.now()
 if(now>=state.events.nextEventAt){
  const event={...EVENTS[Math.floor(Math.random()*EVENTS.length)],id:'e'+Math.random().toString(36).substr(2,9)}
  state.events.active.push(event)
  state.events.nextEventAt=now+Math.random()*180000+60000
 }
 return state.events.active
}

export function claimEventReward(state,eventId){
 const idx=state.events.active.findIndex(e=>e.id===eventId)
 if(idx===-1)return{ok:false,error:'Event not found'}
 const event=state.events.active[idx]
 for(const [k,v] of Object.entries(event.reward??{}))
  state.resources[k]=(state.resources[k]??0)+v
 state.events.completed.push(event)
 state.events.active.splice(idx,1)
 return{ok:true}
}
