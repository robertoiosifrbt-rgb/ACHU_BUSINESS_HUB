import { quoteEconomics } from '../domain/quoteEngine.js'
import { JOB_PROBLEM } from '../content/campaign.js'

const money=n=>`£${Math.round(n).toLocaleString('en-GB')}`
const pct=n=>`${Math.round(n*100)}%`

export class GameShell{
 constructor(host,store){this.host=host;this.store=store;this.el=document.createElement('div');this.el.className='business-ui';host.appendChild(this.el);this.unsub=store.subscribe(s=>this.render(s))}
 render(state){
  const lead=this.store.selectedLead(),econ=quoteEconomics(lead,state.quote.price),job=this.store.currentJob(),story=state.currentStory
  this.el.innerHTML=`
   <div class="hud-top">
    <div class="brand"><span>A</span><div><b>ACHU</b><small>${state.company.stage}</small></div></div>
    <div class="metrics"><div><small>CASH</small><b>${money(state.cash)}</b></div><div><small>REPUTATION</small><b>${state.reputation||0}</b></div><div><small>DAY</small><b>${state.day}</b></div></div>
   </div>
   <aside class="objective-card">
    <small>${story.eyebrow}</small><h1>${story.title}</h1><p>${story.body}</p>
    ${this.primaryAction(state)}
   </aside>
   <div class="location-pill">${state.jobPhase==='arrived'||state.jobPhase==='finishing'||state.jobPhase==='finished'?'LANGLEY · CLIENT SITE':'SLOUGH · HOME BASE'}</div>
   ${this.panel(state,lead,econ,job)}
   <nav class="business-nav"><button class="active"><span>⌂</span>Today</button><button disabled><span>□</span>Jobs</button><button disabled><span>◎</span>Clients</button><button disabled><span>◫</span>Business</button></nav>
   <button class="reset-game" data-reset title="Reset test save">↻</button>`
  this.bind(state)
 }
 primaryAction(state){
  if(state.storyKey==='start')return'<button class="story-action" data-open-lead>READ THE MESSAGE</button>'
  if(state.storyKey==='accepted')return'<button class="story-action" data-plan>PLAN THE JOB</button>'
  if(state.storyKey==='scheduled')return'<button class="story-action" data-drive>DRIVE TO LANGLEY</button>'
  if(state.storyKey==='arrived')return'<button class="story-action" data-problem>MAKE A DECISION</button>'
  if(state.storyKey==='finished')return'<button class="story-action" data-result>SEE THE RESULT</button>'
  if(state.storyKey==='wordOfMouth')return'<button class="story-action" data-open-lead>OPEN NEW LEAD</button>'
  return''
 }
 panel(state,lead,econ,job){
  if(state.jobPhase==='travelling')return`<section class="bottom-sheet compact"><div class="status-line"><i class="pulse"></i><div><b>ON THE WAY</b><small>4.2 miles · expected 08:58</small></div></div><div class="route-progress"><span></span></div></section>`
  if(state.jobPhase==='arrived'&&state.storyKey==='arrived')return''
  if(state.jobPhase==='finishing')return`<section class="bottom-sheet compact"><div class="status-line"><i class="pulse"></i><div><b>FINISHING THE JOB</b><small>${job?.decision?.title??'Decision made'} · quality ${job?.quality??0}/100</small></div></div><button class="primary" data-finish>COMPLETE JOB</button></section>`
  if(state.jobPhase==='finished')return this.resultPanel(state,job)
  if(state.jobPhase==='quoteAccepted')return this.schedulePanel(lead,job)
  if(state.jobPhase==='scheduled')return`<section class="bottom-sheet compact"><div class="status-line good"><i>✓</i><div><b>JOB READY</b><small>Tomorrow 09:00 · ${lead.area} · ${job?.service}</small></div></div></section>`
  return this.leadPanel(state,lead,econ)
 }
 leadPanel(state,lead,econ){
  const rejected=state.quote.status==='rejected'
  return`<section class="bottom-sheet lead-sheet">
   <div class="sheet-handle"></div>
   <div class="client-row"><div class="avatar">${lead.initials}</div><div><small>${lead.kind.toUpperCase()} LEAD</small><h2>${lead.client}</h2><p>${lead.property} · ${lead.area} · ${lead.distanceMiles} miles</p></div><span class="new-badge">NEW</span></div>
   <blockquote>“${lead.message}”</blockquote>
   <div class="job-facts"><div><small>SERVICE</small><b>${lead.service}</b></div><div><small>WHEN</small><b>${lead.requested}</b></div><div><small>EST. TIME</small><b>${lead.durationHours}h</b></div></div>
   <div class="stakes"><b>WHY THIS MATTERS</b><p>${lead.stakes}</p></div>
   <div class="quote-box"><div class="quote-head"><div><small>YOUR QUOTE</small><strong>${money(state.quote.price)}</strong></div><div class="margin"><small>AFTER DIRECT COSTS</small><b>${money(econ.gross)} · ${pct(econ.margin)}</b></div></div><input data-price type="range" min="80" max="180" step="1" value="${state.quote.price}"/><div class="scale"><span>CHEAPER</span><span>MARKET ~${money(lead.marketPrice)}</span><span>PREMIUM</span></div></div>
   ${rejected?`<div class="outcome bad"><b>QUOTE NOT ACCEPTED</b><p>${state.lastOutcome?.reason??''} Adjust the price and try again.</p></div>`:''}
   <button class="primary" data-submit>SUBMIT ${money(state.quote.price)} QUOTE</button>
  </section>`
 }
 schedulePanel(lead,job){return`<section class="bottom-sheet"><div class="sheet-handle"></div><small class="kicker">JOB PLAN</small><h2>${lead.client} · ${lead.service}</h2><div class="schedule-card"><div><small>TIME</small><b>Tomorrow · 09:00</b></div><div><small>WHO</small><b>You</b></div><div><small>VEHICLE</small><b>Used Transit</b></div><div><small>SUPPLIES</small><b>Ready</b></div></div><p class="plan-copy">You have enough capacity for this job. Booking it blocks 3.5 hours of tomorrow morning.</p><button class="primary" data-schedule>BOOK THIS JOB</button></section>`}
 problemPanel(){return`<section class="bottom-sheet"><div class="sheet-handle"></div><small class="kicker">ON-SITE DECISION</small><h2>${JOB_PROBLEM.title}</h2><p class="plan-copy">${JOB_PROBLEM.body}</p><div class="choices">${JOB_PROBLEM.choices.map(c=>`<button data-choice="${c.id}"><b>${c.title}</b><span>${c.copy}</span><em>${c.timeDelta?`+${c.timeDelta} min · `:''}${c.cashDelta?`${money(c.cashDelta)} supplies · `:''}${c.qualityDelta>0?'+':''}${c.qualityDelta} quality</em></button>`).join('')}</div></section>`}
 resultPanel(state,job){const r=state.lastOutcome?.review,stars=state.lastOutcome?.stars??0;return`<section class="bottom-sheet result-sheet"><div class="sheet-handle"></div><small class="kicker">FIRST JOB RESULT</small><div class="result-money"><span><small>JOB PRICE</small><b>${money(job?.price??0)}</b></span><span><small>CASH NOW</small><b>${money(state.cash)}</b></span><span><small>REPUTATION</small><b>+${state.reputation}</b></span></div><div class="review"><div><b>${'★'.repeat(stars)}${'☆'.repeat(5-stars)}</b><small>${r?.client}</small></div><p>“${r?.text??''}”</p></div><button class="primary" data-next>CONTINUE TO DAY 2</button></section>`}
 bind(state){
  this.el.querySelector('[data-reset]')?.addEventListener('click',()=>this.store.reset())
  this.el.querySelector('[data-price]')?.addEventListener('input',e=>this.store.setQuotePrice(e.target.value))
  this.el.querySelector('[data-submit]')?.addEventListener('click',()=>this.store.submitQuote())
  this.el.querySelector('[data-plan]')?.addEventListener('click',()=>this.store.scheduleJob())
  this.el.querySelector('[data-schedule]')?.addEventListener('click',()=>this.store.scheduleJob())
  this.el.querySelector('[data-drive]')?.addEventListener('click',()=>this.store.startTravel())
  this.el.querySelector('[data-problem]')?.addEventListener('click',()=>{this.el.insertAdjacentHTML('beforeend',this.problemPanel());this.bindChoices()})
  this.el.querySelector('[data-finish]')?.addEventListener('click',()=>this.store.finishJob())
  this.el.querySelector('[data-result]')?.addEventListener('click',()=>this.el.querySelector('.result-sheet')?.scrollIntoView({behavior:'smooth'}))
  this.el.querySelector('[data-next]')?.addEventListener('click',()=>this.store.revealNextLead())
  this.el.querySelector('[data-open-lead]')?.addEventListener('click',()=>this.el.querySelector('.lead-sheet')?.classList.add('attention'))
 }
 bindChoices(){this.el.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>this.store.chooseJobDecision(b.dataset.choice)))}
 destroy(){this.unsub?.();this.el.remove()}
}
