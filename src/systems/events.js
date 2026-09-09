const MOMENTS=[
 {type:'newClient',title:'A new client just called',description:'A nearby home needs a regular clean. The diary is starting to fill itself.',reward:{meat:260,coal:35},duration:5400000},
 {type:'repeatBooking',title:'They booked again',description:'A happy client has asked for another visit without needing to be chased.',reward:{meat:340,coal:60},duration:5400000},
 {type:'fiveStar',title:'A five-star review landed',description:'Good work is travelling further than advertising today.',reward:{coal:180,meat:120},duration:7200000},
 {type:'commercialLead',title:'An office wants a walkthrough',description:'A facilities manager is comparing cleaning providers for a recurring contract.',reward:{meat:520,coal:95,iron:20},duration:7200000},
 {type:'staffReferral',title:'Someone recommended a great cleaner',description:'One of the crew knows somebody reliable who could strengthen the team.',reward:{iron:90,coal:25},duration:5400000},
 {type:'supplierDeal',title:'Your supplier called',description:'A short-window deal can put more stock in the depot for less cash.',reward:{wood:420,meat:110},duration:3600000},
 {type:'lastMinute',title:'A same-day slot opened up',description:'A cancellation left room for one more job if a crew can move quickly.',reward:{meat:410,coal:45},duration:2700000},
 {type:'neighbourhoodBuzz',title:'People are talking about ACHU',description:'Several enquiries came from the same neighbourhood after one visible job.',reward:{coal:130,meat:210},duration:5400000},
 {type:'teamWin',title:'The crew nailed a difficult job',description:'The client noticed the difference. So did the team.',reward:{coal:90,iron:45},duration:5400000},
 {type:'bigDay',title:'Tomorrow is nearly full',description:'Bookings, routes and people are lining up into a proper operating day.',reward:{meat:460,wood:180,coal:55},duration:7200000}
]

function ensureEventState(state){
 state.events??={}
 state.events.active??=[]
 state.events.completed??=[]
 state.events.log??=[]
}
function archiveEvent(state,event,now,claimed=false){
 event.active=false
 event.completed=true
 if(claimed){event.claimed=true;event.claimedAt=now}
 state.events.completed.unshift(event)
 state.events.completed=state.events.completed.slice(0,100)
 state.events.log.unshift({event:event.id,completedAt:now,claimed})
 state.events.log=state.events.log.slice(0,200)
}

export function generateEvent(){
 const template=MOMENTS[Math.floor(Math.random()*MOMENTS.length)]
 return{id:'e'+Math.random().toString(36).substr(2,9),...template,startedAt:Date.now(),expiresAt:Date.now()+template.duration,active:true,completed:false,claimed:false,reward:{...(template.reward??{})}}
}

export function tickEvents(state){
 ensureEventState(state)
 const now=Date.now(),kept=[]
 for(const event of state.events.active){
  if(now>event.expiresAt)archiveEvent(state,event,now,false)
  else kept.push(event)
 }
 state.events.active=kept
 if(now>=(state.events.nextEventAt??0)){
  const newEvent=generateEvent();state.events.active.push(newEvent)
  state.events.nextEventAt=now+Math.random()*150000+90000
  return true
 }
 return false
}

export function claimEventReward(state,eventId){
 ensureEventState(state)
 const index=state.events.active.findIndex(e=>e.id===eventId)
 if(index<0)return{ok:false,error:'Moment not found'}
 const event=state.events.active[index]
 if(event.claimed)return{ok:false,error:'Already opened'}
 Object.entries(event.reward??{}).forEach(([k,v])=>{if(k in state.resources)state.resources[k]=(state.resources[k]??0)+v;else if(k==='power')state.power+=v})
 state.events.active.splice(index,1)
 archiveEvent(state,event,Date.now(),true)
 return{ok:true,event}
}
