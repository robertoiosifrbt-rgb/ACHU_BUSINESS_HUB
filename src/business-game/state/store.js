import { createInitialState } from './createInitialState.js'
import { APPLICANTS,CHAPTERS,DISTRICTS,PREMISES,SYSTEMS,VEHICLES } from '../content/gameData.js'
import { availableHours,chapterForState,completeJob,enrichLead,evaluateQuote,generateLeads,predictJob,quoteEconomics,suggestedQuote } from '../domain/simulator.js'

const STORAGE_KEY='achu_real_business_game_v2'
const clone=value=>structuredClone(value)
const uid=(prefix)=>`${prefix}-${Date.now()}-${Math.floor(Math.random()*9999)}`

export class BusinessStore{
 constructor(){this.state=this.load();this.listeners=new Set()}
 load(){
  try{const raw=localStorage.getItem(STORAGE_KEY),parsed=raw?JSON.parse(raw):null;return parsed?.version===2?parsed:createInitialState()}catch{return createInitialState()}
 }
 save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(this.state))}
 subscribe(fn){this.listeners.add(fn);fn(this.state);return()=>this.listeners.delete(fn)}
 emit(){this.state.company.stage=this.state.premises?.stage??this.state.company.stage;this.save();for(const fn of this.listeners)fn(this.state)}
 reset(){this.state=createInitialState();this.emit()}
 setTab(tab){this.state.activeTab=tab;this.state.selectedLeadId=null;this.state.selectedJobId=null;this.state.selectedClientId=null;this.emit()}
 chapter(){return CHAPTERS.find(c=>c.id===chapterForState(this.state))??CHAPTERS[0]}
 unlockedDistricts(){return DISTRICTS.filter(d=>this.state.reputation>=d.unlockRep)}
 capacity(day=this.state.day){return availableHours(this.state,day)}
 selectedLead(){return this.state.leads.find(l=>l.id===this.state.selectedLeadId)??null}
 selectedJob(){return this.state.jobs.find(j=>j.id===this.state.selectedJobId)??null}
 selectedClient(){return this.state.clients.find(c=>c.id===this.state.selectedClientId)??null}
 selectLead(id){this.state.selectedLeadId=id;this.state.selectedJobId=null;this.state.selectedClientId=null;this.emit()}
 selectJob(id){this.state.selectedJobId=id;this.state.selectedLeadId=null;this.state.selectedClientId=null;this.emit()}
 selectClient(id){this.state.selectedClientId=id;this.state.selectedLeadId=null;this.state.selectedJobId=null;this.emit()}
 leadEconomics(lead){return quoteEconomics(lead,lead.quotePrice??suggestedQuote(lead,this.state),this.state)}
 setLeadQuote(id,price){const lead=this.state.leads.find(l=>l.id===id);if(!lead)return;lead.quotePrice=Math.max(20,Math.round(Number(price)||0));lead.lastQuoteResult=null;this.emit()}
 submitQuote(id){
  const lead=this.state.leads.find(l=>l.id===id);if(!lead||!['new','quoted'].includes(lead.status))return null
  const result=evaluateQuote(lead,lead.quotePrice,this.state);lead.lastQuoteResult=result;lead.status=result.accepted?'accepted':'quoted'
  this.addActivity(result.accepted?'Quote accepted':'Quote lost',`${lead.client} · £${lead.quotePrice} · ${result.reason}`)
  this.emit();return result
 }
 declineLead(id){const lead=this.state.leads.find(l=>l.id===id);if(!lead)return;lead.status='declined';this.addActivity('Lead declined',`${lead.client} · ${lead.property}`);this.state.selectedLeadId=null;this.emit()}
 earliestDayFor(hours){for(let d=this.state.day+1;d<=this.state.day+7;d++)if(availableHours(this.state,d).free>=hours)return d;return null}
 scheduleLead(id,day=null){
  const lead=this.state.leads.find(l=>l.id===id);if(!lead||lead.status!=='accepted')return{ok:false,error:'Quote must be accepted first.'}
  const scheduledDay=Number(day)||this.earliestDayFor(lead.hours);if(!scheduledDay)return{ok:false,error:'No capacity in the next 7 days.'}
  const cap=availableHours(this.state,scheduledDay);if(cap.free<lead.hours){this.state.flags.capacityPressure=true;return{ok:false,error:`Only ${cap.free.toFixed(1)} staff-hours free on day ${scheduledDay}.`}}
  const activeStaff=this.state.staff.filter(s=>s.active!==false)
  const crewCount=lead.hours>=6&&activeStaff.length>1?2:1
  const crewIds=activeStaff.slice(0,crewCount).map(s=>s.id)
  const vehicle=this.state.vehicles[0]
  const job={id:uid('job'),leadId:lead.id,client:lead.client,kind:lead.kind,property:lead.property,district:lead.district,serviceId:lead.serviceId,hours:lead.hours,expectation:lead.expectation,frequency:lead.frequency,distanceMiles:lead.distanceMiles,price:lead.quotePrice,scheduledDay,status:'scheduled',crewIds,vehicleId:vehicle?.id??null,suppliesNeeded:lead.suppliesCost,travelCost:lead.travelCost,leadSnapshot:clone(lead)}
  this.state.jobs.push(job);lead.status='scheduled';this.state.selectedJobId=job.id;this.state.selectedLeadId=null
  this.addActivity('Job booked',`${lead.client} · day ${scheduledDay} · £${job.price}`);this.emit();return{ok:true,job}
 }
 assignStaff(jobId,staffId){
  const job=this.state.jobs.find(j=>j.id===jobId),staff=this.state.staff.find(s=>s.id===staffId);if(!job||!staff||job.status!=='scheduled')return
  job.crewIds=[staffId];this.emit()
 }
 assignVehicle(jobId,vehicleId){const job=this.state.jobs.find(j=>j.id===jobId);if(!job||job.status!=='scheduled'||!this.state.vehicles.some(v=>v.id===vehicleId))return;job.vehicleId=vehicleId;this.emit()}
 predict(job){return predictJob(this.state,job)}
 buySupplies(pack=50){const options={50:40,120:88},amount=Number(pack),cost=options[amount];if(!cost||this.state.cash<cost)return false;if(this.state.supplies+amount>this.state.premises.stockLimit)return false;this.state.cash-=cost;this.state.supplies+=amount;this.addActivity('Supplies purchased',`+${amount} stock · -£${cost}`);this.emit();return true}
 hireStaff(id){
  const candidate=APPLICANTS.find(a=>a.id===id);if(!candidate||this.state.staff.some(s=>s.id===id))return{ok:false,error:'Candidate unavailable.'}
  if(this.state.staff.length>=this.state.premises.staffLimit)return{ok:false,error:`${this.state.premises.name} only supports ${this.state.premises.staffLimit} staff.`}
  if(this.state.cash<candidate.hireCost)return{ok:false,error:'Not enough cash for onboarding.'}
  this.state.cash-=candidate.hireCost;this.state.staff.push({...candidate,dailyHours:8,active:true});this.addActivity('New hire',`${candidate.name} joined ACHU · £${candidate.wage.toFixed(2)}/h`);this.emit();return{ok:true}
 }
 buyVehicle(id){
  const def=VEHICLES.find(v=>v.id===id);if(!def||this.state.vehicles.some(v=>v.id===id))return{ok:false,error:'Vehicle unavailable.'};if(this.state.cash<def.price)return{ok:false,error:'Not enough cash.'}
  this.state.cash-=def.price;this.state.vehicles.push({...def,condition:def.reliability});this.addActivity('Vehicle added',`${def.name} · -£${def.price.toLocaleString('en-GB')}`);this.emit();return{ok:true}
 }
 upgradePremises(id){
  const target=PREMISES.find(p=>p.id===id),currentIndex=PREMISES.findIndex(p=>p.id===this.state.premises.id),targetIndex=PREMISES.findIndex(p=>p.id===id)
  if(!target||targetIndex!==currentIndex+1)return{ok:false,error:'Upgrade premises in order.'};if(this.state.cash<target.price)return{ok:false,error:'Not enough cash.'}
  this.state.cash-=target.price;this.state.premises={...target};this.addActivity('New premises',`${target.name} is now ACHU’s operating base.`);this.emit();return{ok:true}
 }
 buySystem(id){
  const def=SYSTEMS.find(s=>s.id===id);if(!def||this.state.systems[id])return{ok:false,error:'System unavailable.'};if(this.state.cash<def.price)return{ok:false,error:'Not enough cash.'}
  const unlocked=def.unlock==='complaint'?this.state.flags.complaint:def.unlock==='multiJob'?this.state.jobs.length>=2:(this.state.clients.length>=2)
  if(!unlocked)return{ok:false,error:'ACHU has not reached the problem this system solves yet.'}
  this.state.cash-=def.price;this.state.systems[id]=true;this.addActivity('System installed',`${def.name} · ${def.effect}`);this.emit();return{ok:true}
 }
 addActivity(title,copy){this.state.activity.unshift({id:uid('activity'),day:this.state.day,title,copy});this.state.activity=this.state.activity.slice(0,30)}
 processJob(job){
  const result=completeJob(this.state,job);job.status='completed';job.result=result
  this.state.cash+=result.profit;this.state.supplies=Math.max(0,this.state.supplies-result.suppliesNeeded);this.state.reputation=Math.max(0,this.state.reputation+result.reputationDelta)
  const vehicle=this.state.vehicles.find(v=>v.id===job.vehicleId);if(vehicle)vehicle.condition=Math.max(25,vehicle.condition-Math.max(.4,job.distanceMiles*.08))
  let client=this.state.clients.find(c=>c.name===job.client)
  if(!client){client={id:uid('client'),name:job.client,kind:job.kind,property:job.property,district:job.district,satisfaction:result.quality,recurring:result.recurring,frequency:job.frequency,lifetimeValue:job.price,jobsCompleted:1};this.state.clients.push(client)}
  else{client.satisfaction=Math.round((client.satisfaction+result.quality)/2);client.lifetimeValue+=job.price;client.jobsCompleted++;client.recurring=client.recurring||result.recurring}
  if(result.stars>=4){const review={id:uid('review'),client:job.client,stars:result.stars,text:result.stars===5?'Excellent standard and very reliable. Would happily use ACHU again.':'Good service and communication. Happy with the clean.',day:this.state.day};this.state.reviews.unshift(review);this.state.flags.firstReview=true}
  if(result.stars<=3)this.state.flags.complaint=true
  if(job.kind==='Commercial'){this.state.flags.commercial=true;client.recurring=true}
  this.addActivity(`${result.stars}★ job completed`,`${job.client} · £${job.price} revenue · £${result.profit} contribution · quality ${result.quality}`)
  return{job,result}
 }
 advanceDay(){
  const nextDay=this.state.day+1;this.state.day=nextDay
  const completed=this.state.jobs.filter(j=>j.scheduledDay===nextDay&&j.status==='scheduled').map(j=>this.processJob(j))
  this.state.leads.forEach(l=>{if(['new','quoted','accepted'].includes(l.status)&&l.expiresDay<nextDay)l.status='expired'})
  const activeLeadCount=this.state.leads.filter(l=>['new','quoted','accepted'].includes(l.status)).length
  const wanted=Math.max(0,Math.min(3,3-activeLeadCount));const generated=generateLeads(this.state,wanted).map(l=>({...l,quotePrice:suggestedQuote(l,this.state)}));this.state.leads.push(...generated)
  if(this.state.leads.length>18)this.state.leads=this.state.leads.slice(-18)
  const cap=availableHours(this.state,nextDay);if(cap.free<2)this.state.flags.capacityPressure=true
  this.state.lastDaySummary={day:nextDay,completed:completed.length,revenue:completed.reduce((a,x)=>a+x.job.price,0),profit:completed.reduce((a,x)=>a+x.result.profit,0),newLeads:generated.length}
  this.addActivity('New day',`Day ${nextDay} · ${completed.length} job${completed.length===1?'':'s'} completed · ${generated.length} new lead${generated.length===1?'':'s'}`)
  this.emit();return this.state.lastDaySummary
 }
}
