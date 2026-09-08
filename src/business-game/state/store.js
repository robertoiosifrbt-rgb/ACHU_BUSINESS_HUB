import { createInitialState } from './createInitialState.js'
import { FIRST_LEAD,SECOND_LEAD,STORY,JOB_PROBLEM } from '../content/campaign.js'
import { submitQuote,quoteEconomics } from '../domain/quoteEngine.js'

const STORAGE_KEY='achu_real_business_game_v1'
const clone=value=>structuredClone(value)

export class BusinessStore{
 constructor(){this.state=this.load();this.listeners=new Set()}
 load(){
  try{const raw=localStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw):createInitialState()}catch{return createInitialState()}
 }
 save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(this.state))}
 subscribe(fn){this.listeners.add(fn);fn(this.state);return()=>this.listeners.delete(fn)}
 emit(){this.save();for(const fn of this.listeners)fn(this.state)}
 reset(){this.state=createInitialState();this.emit()}
 selectedLead(){return this.state.leads.find(x=>x.id===this.state.selectedLeadId)??FIRST_LEAD}
 economics(){return quoteEconomics(this.selectedLead(),this.state.quote.price)}
 setQuotePrice(price){this.state.quote.price=Math.round(Number(price)||0);this.state.quote.status='draft';this.state.lastOutcome=null;this.emit()}
 submitQuote(){
  const lead=this.selectedLead(),result=submitQuote(lead,this.state.quote.price)
  this.state.lastOutcome=result
  this.state.quote.status=result.accepted?'accepted':'rejected'
  if(result.accepted){
   const job={id:'job-001',leadId:lead.id,client:lead.client,service:lead.service,area:lead.area,price:this.state.quote.price,quality:76,scheduled:null,problem:JOB_PROBLEM,decision:null}
   this.state.jobs=[job];this.state.currentJobId=job.id;this.state.currentStory=STORY.accepted;this.state.storyKey='accepted';this.state.jobPhase='quoteAccepted'
  }
  this.emit();return result
 }
 scheduleJob(){
  const job=this.currentJob();if(!job)return
  job.scheduled='Tomorrow · 09:00';this.state.jobPhase='scheduled';this.state.currentStory=STORY.scheduled;this.state.storyKey='scheduled';this.emit()
 }
 startTravel(){this.state.jobPhase='travelling';this.emit();setTimeout(()=>{this.state.jobPhase='arrived';this.state.currentStory=STORY.arrived;this.state.storyKey='arrived';this.emit()},850)}
 chooseJobDecision(id){
  const job=this.currentJob(),choice=JOB_PROBLEM.choices.find(x=>x.id===id);if(!job||!choice)return
  job.decision=clone(choice);job.quality=Math.max(0,Math.min(100,job.quality+choice.qualityDelta));this.state.cash+=choice.cashDelta;this.state.jobPhase='finishing';this.emit()
 }
 finishJob(){
  const job=this.currentJob();if(!job)return
  const lead=FIRST_LEAD,economics=quoteEconomics(lead,job.price)
  const quality=job.quality,stars=quality>=85?5:quality>=70?4:quality>=55?3:2
  const review={id:'review-001',client:job.client,stars,text:stars>=5?'Really thorough and easy to deal with. The oven looked completely different. Would use ACHU again.':stars>=4?'Good clean and reliable communication. Happy with the result.':'The clean was okay, but some details could have been better.'}
  this.state.cash+=job.price-economics.direct
  this.state.reputation=Math.max(0,this.state.reputation+(stars-3)*8+12)
  this.state.reviews=[review];this.state.jobPhase='finished';this.state.currentStory=STORY.finished;this.state.storyKey='finished';this.state.lastOutcome={...economics,stars,review};this.emit()
 }
 revealNextLead(){
  this.state.leads=[SECOND_LEAD];this.state.selectedLeadId=SECOND_LEAD.id;this.state.quote={price:84,status:'draft'};this.state.day=2;this.state.jobPhase='idle';this.state.currentStory=STORY.wordOfMouth;this.state.storyKey='wordOfMouth';this.state.lastOutcome=null;this.emit()
 }
 currentJob(){return this.state.jobs.find(x=>x.id===this.state.currentJobId)??null}
}
