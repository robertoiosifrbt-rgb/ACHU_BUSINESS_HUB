const EVENT_TYPES={
 resourceBonus:'ResourceBonus',
 invasion:'Invasion',
 tradingBoost:'TradingBoost',
 heroVisit:'HeroVisit',
 naturalDisaster:'NaturalDisaster',
 questChain:'QuestChain',
 seasonalFestival:'SeasonalFestival'
}

const EVENT_TEMPLATES={
 ResourceBonus:{title:'High Demand Week',description:'Demand is up across the market. Extra operating value available.',reward:{meat:300,wood:300,coal:200,iron:100},duration:7200000},
 Invasion:{title:'Competitor Price Push',description:'Protect client relationships during an aggressive competitor campaign.',difficulty:'medium',duration:3600000},
 TradingBoost:{title:'Supplier Promotion',description:'Procurement costs are temporarily reduced.',discount:0.2,duration:5400000},
 HeroVisit:{title:'Senior Manager Available',description:'A high-value operator is available for recruitment.',heroChance:0.3,duration:1800000},
 NaturalDisaster:{title:'Operational Disruption',description:'A sudden disruption is affecting capacity. Stabilise operations quickly.',penalty:0.1,duration:1800000},
 QuestChain:{title:'Enterprise Tender',description:'Complete a three-stage commercial tender for a major reward.',parts:3,reward:{meat:500,power:100}},
 SeasonalFestival:{title:'Growth Campaign',description:'A company-wide campaign is improving development speed.',buildingSpeedBoost:0.2,duration:86400000}
}

export function generateEvent(){
 const types=Object.keys(EVENT_TYPES)
 const type=types[Math.floor(Math.random()*types.length)]
 const template=EVENT_TEMPLATES[type]
 return{
  id:'e'+Math.random().toString(36).substr(2,9),type,
  title:template.title,description:template.description,
  startedAt:Date.now(),expiresAt:Date.now()+template.duration,
  active:true,completed:false,reward:template.reward??{},
  ...template
 }
}

export function tickEvents(state){
 const now=Date.now()
 state.events.active=state.events.active.filter(e=>{
  if(now>e.expiresAt){
   e.active=false
   e.completed=true
   state.events.completed.push(e)
   state.events.log.push({event:e.id,completedAt:now})
   return false
  }
  return true
 })

 if(now>=state.events.nextEventAt){
  const newEvent=generateEvent()
  state.events.active.push(newEvent)
  state.events.nextEventAt=now+Math.random()*120000+60000
  return true
 }
 return false
}

export function claimEventReward(state,eventId){
 const event=state.events.active.find(e=>e.id===eventId)
 if(!event)return{ok:false,error:'Opportunity not found'}
 if(event.claimed)return{ok:false,error:'Already claimed'}
 Object.entries(event.reward??{}).forEach(([k,v])=>{
  if(k in state.resources)state.resources[k]=(state.resources[k]??0)+v
  else if(k==='power')state.power+=v
 })
 event.claimed=true
 return{ok:true}
}
