import { DISTRICTS,LEAD_TEMPLATES,SERVICES } from '../content/gameData.js'

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n))
const round5=n=>Math.round(n/5)*5
const hash=text=>[...String(text)].reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),2166136261)
const deterministic=(key,min,max)=>min+(hash(key)%1000)/999*(max-min)

export function districtById(id){return DISTRICTS.find(d=>d.id===id)??DISTRICTS[0]}
export function serviceById(id){return SERVICES[id]??SERVICES.regular}

export function enrichLead(raw,state={day:1,reputation:0}){
 const service=serviceById(raw.serviceId)
 const district=districtById(raw.district)
 const distanceMiles=raw.distanceMiles??Number(deterministic(`${raw.client}-${state.day}-miles`,1.6,7.8).toFixed(1))
 const premium=district.kind==='Premium'?1.18:district.kind==='Commercial'?1.08:1
 const marketPrice=raw.marketPrice??round5(service.baseHourly*raw.hours*premium)
 const suppliesCost=Math.ceil(service.suppliesPerHour*raw.hours)
 const travelCost=Math.ceil(distanceMiles*.55*2)
 const labourGuide=Math.ceil(raw.hours*12.4)
 const directGuide=suppliesCost+travelCost+labourGuide
 return{...raw,distanceMiles,marketPrice,suppliesCost,travelCost,labourGuide,directGuide,expiresDay:raw.expiresDay??state.day+2,status:raw.status??'new'}
}

export function generateLeads(state,count=3){
 const unlocked=DISTRICTS.filter(d=>state.reputation>=d.unlockRep).map(d=>d.id)
 const pool=LEAD_TEMPLATES.filter(t=>unlocked.includes(t.district))
 const existing=new Set((state.leads??[]).filter(l=>['new','quoted','accepted'].includes(l.status)).map(l=>l.client))
 const candidates=pool.filter(t=>!existing.has(t.client))
 const source=candidates.length?candidates:pool
 const out=[]
 for(let i=0;i<count&&source.length;i++){
  const template=source[(state.day*2+i)%source.length]
  const variance=deterministic(`${template.client}-${state.day}-hours`,.88,1.14)
  const raw={...template,id:`lead-${state.day}-${i}-${template.initials.toLowerCase()}`,hours:Number((template.hours*variance).toFixed(1)),expiresDay:state.day+2}
  out.push(enrichLead(raw,state))
 }
 return out
}

export function quoteEconomics(lead,price,state){
 const l=enrichLead(lead,state)
 const staffCost=l.labourGuide
 const direct=l.suppliesCost+l.travelCost+staffCost
 const gross=Math.round(price-direct)
 return{direct,gross,margin:price?gross/price:0,supplies:l.suppliesCost,travel:l.travelCost,labour:staffCost}
}

export function suggestedQuote(lead,state){
 const l=enrichLead(lead,state)
 const reputationLift=1+Math.min(.08,(state.reputation??0)/1000)
 return round5(l.marketPrice*reputationLift)
}

export function evaluateQuote(lead,price,state){
 const l=enrichLead(lead,state),econ=quoteEconomics(l,price,state)
 const ratio=price/l.marketPrice
 const priceScore=ratio<=1?1:clamp(1-(ratio-1)*2.7,0,1)
 const repScore=clamp((state.reputation??0)/100,.0,.24)
 const responseBonus=l.status==='new'?.06:0
 const premiumPenalty=l.kind==='Commercial'&&state.reputation<25?.12:0
 const score=priceScore*.78+repScore+responseBonus-premiumPenalty
 const accepted=score>=.67
 let reason=accepted?'Client accepted the quote.':''
 if(!accepted&&ratio>1.18)reason='Price was too high for this client.'
 else if(!accepted&&premiumPenalty)reason='The client chose a more established company.'
 else if(!accepted)reason='The quote did not beat the other option.'
 return{accepted,score,economics:econ,reason}
}

export function availableHours(state,day){
 const staff=(state.staff??[]).filter(s=>s.active!==false)
 const base=staff.reduce((sum,s)=>sum+(s.dailyHours??8),0)
 const used=(state.jobs??[]).filter(j=>j.scheduledDay===day&&['scheduled','completed'].includes(j.status)).reduce((sum,j)=>sum+(j.hours??0),0)
 return{total:base,used,free:Math.max(0,base-used)}
}

export function crewForJob(state,job){
 const ids=job.crewIds?.length?job.crewIds:[state.staff?.[0]?.id].filter(Boolean)
 return ids.map(id=>state.staff.find(s=>s.id===id)).filter(Boolean)
}

export function predictJob(state,job){
 const crew=crewForJob(state,job)
 const avg=(field,fallback)=>crew.length?crew.reduce((a,s)=>a+(s[field]??fallback),0)/crew.length:fallback
 const quality=avg('quality',70)+(state.systems?.quality?6:0)
 const speed=avg('speed',72)
 const reliability=avg('reliability',80)
 const service=serviceById(job.serviceId)
 const duration=job.hours*(82/Math.max(55,speed))
 const qualityGap=quality-(job.expectation??service.qualityNeed)
 return{quality:Math.round(quality),speed:Math.round(speed),reliability:Math.round(reliability),duration:Number(duration.toFixed(1)),risk:qualityGap>=8?'LOW':qualityGap>=-5?'MEDIUM':'HIGH'}
}

export function completeJob(state,job){
 const lead=job.leadSnapshot??job
 const prediction=predictJob(state,job)
 const crew=crewForJob(state,job)
 const avgReliability=prediction.reliability
 const reliabilityPenalty=avgReliability<75?7:0
 const supplyPenalty=(state.supplies??0)<(job.suppliesNeeded??lead.suppliesCost??10)?10:0
 const quality=clamp(prediction.quality-reliabilityPenalty-supplyPenalty,35,98)
 const expectation=job.expectation??lead.expectation??70
 const delta=quality-expectation
 const stars=delta>=8?5:delta>=-4?4:delta>=-13?3:2
 const service=serviceById(job.serviceId)
 const suppliesNeeded=job.suppliesNeeded??Math.ceil(service.suppliesPerHour*job.hours)
 const travelCost=job.travelCost??Math.ceil((lead.distanceMiles??3)*.55*2*(state.systems?.route?.85:1))
 const wageCost=crew.reduce((sum,s)=>sum+(s.owner?0:(s.wage??12)*job.hours/Math.max(1,crew.length)),0)
 const direct=Math.round(suppliesNeeded+travelCost+wageCost)
 const profit=Math.round(job.price-direct)
 const reputationDelta=stars===5?12:stars===4?6:stars===3?-3:-12
 const recurringChance=(lead.frequency&&lead.frequency!=='One-off')?1:(stars===5?.42:stars===4?.18:0)
 const recurring=deterministic(`${job.id}-recurring`,0,1)<recurringChance
 return{quality,stars,direct,profit,reputationDelta,suppliesNeeded,travelCost,wageCost:Math.round(wageCost),recurring}
}

export function chapterForState(state){
 const clients=(state.clients??[]).length,staff=(state.staff??[]).length,commercial=(state.clients??[]).some(c=>c.kind==='Commercial')
 if(staff>=3&&(state.vehicles??[]).length>=2)return 6
 if(commercial)return 5
 if((state.premises?.id??'home')!=='home')return 4
 if(staff>=2)return 3
 if(clients>=3&&state.cash>=750)return 2
 return 1
}
