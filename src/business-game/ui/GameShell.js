import { APPLICANTS,DISTRICTS,PREMISES,SERVICES,SYSTEMS,VEHICLES } from '../content/gameData.js'

const money=n=>`£${Math.round(n??0).toLocaleString('en-GB')}`
const pct=n=>`${Math.round((n??0)*100)}%`
const serviceName=id=>SERVICES[id]?.name??id
const districtName=id=>DISTRICTS.find(d=>d.id===id)?.name??id
const statusLabel=s=>({new:'NEW LEAD',quoted:'QUOTE LOST',accepted:'QUOTE ACCEPTED',scheduled:'BOOKED',declined:'DECLINED',expired:'EXPIRED'}[s]??String(s).toUpperCase())

export class GameShell{
 constructor(host,store){
  this.host=host;this.store=store;this.el=document.createElement('div');this.el.className='business-ui';host.appendChild(this.el)
  this.unsub=store.subscribe(s=>this.render(s))
 }
 render(state){
  const chapter=this.store.chapter(),cap=this.store.capacity(state.day)
  this.el.innerHTML=`
   <header class="hud-top">
    <div class="brand"><span>A</span><div><b>ACHU</b><small>${state.company.stage}</small></div></div>
    <div class="metrics"><div><small>CASH</small><b>${money(state.cash)}</b></div><div><small>REP</small><b>${state.reputation}</b></div><div><small>DAY</small><b>${state.day}</b></div><div class="metric-sup"><small>STOCK</small><b>${Math.round(state.supplies)}</b></div></div>
   </header>
   <aside class="objective-card compact-objective">
    <small>CHAPTER ${chapter.id} · ${chapter.title}</small><h1>${this.objectiveTitle(state)}</h1><p>${chapter.goal}</p>
    <div class="objective-stats"><span><b>${cap.free.toFixed(1)}h</b> free today</span><span><b>${state.clients.length}</b> clients</span><span><b>${state.staff.length}</b> staff</span></div>
   </aside>
   <div class="location-pill">${this.locationText(state)}</div>
   <main class="game-panel">${this.tabContent(state)}</main>
   ${this.detailSheet(state)}
   <nav class="business-nav">
    ${this.navButton('today','⌂','Today',state)}
    ${this.navButton('jobs','▤','Jobs',state)}
    ${this.navButton('clients','◎','Clients',state)}
    ${this.navButton('business','▦','Business',state)}
   </nav>
   <button class="reset-game" data-reset title="Reset save">↻</button>`
  this.bind(state)
 }
 objectiveTitle(state){
  const urgent=state.leads.filter(l=>['new','quoted','accepted'].includes(l.status)&&l.expiresDay<=state.day+1).length
  const today=state.jobs.filter(j=>j.scheduledDay===state.day&&j.status==='scheduled').length
  if(today)return`${today} job${today===1?'':'s'} need delivering today`
  if(urgent)return`${urgent} lead${urgent===1?'':'s'} need a decision`
  if(state.staff.length===1&&state.flags.capacityPressure)return'You are becoming the bottleneck'
  return'Build the company without breaking the operation'
 }
 locationText(state){const unlocked=this.store.unlockedDistricts();return`${unlocked.length} DISTRICT${unlocked.length===1?'':'S'} · ${state.premises.name.toUpperCase()}`}
 navButton(id,icon,label,state){return`<button data-tab="${id}" class="${state.activeTab===id?'active':''}"><span>${icon}</span>${label}</button>`}
 tabContent(state){
  if(state.activeTab==='jobs')return this.jobsTab(state)
  if(state.activeTab==='clients')return this.clientsTab(state)
  if(state.activeTab==='business')return this.businessTab(state)
  return this.todayTab(state)
 }
 todayTab(state){
  const todayJobs=state.jobs.filter(j=>j.scheduledDay===state.day&&j.status==='scheduled')
  const upcoming=state.jobs.filter(j=>j.scheduledDay>state.day&&j.status==='scheduled').sort((a,b)=>a.scheduledDay-b.scheduledDay).slice(0,3)
  const leads=state.leads.filter(l=>['new','quoted','accepted'].includes(l.status)).sort((a,b)=>a.expiresDay-b.expiresDay)
  return`<section class="panel-scroll">
   <div class="panel-head"><div><small>TODAY · DAY ${state.day}</small><h2>Run the operation</h2></div><button class="day-button" data-next-day>END DAY →</button></div>
   ${state.lastDaySummary?`<div class="day-summary"><b>DAY ${state.lastDaySummary.day}</b><span>${state.lastDaySummary.completed} jobs · ${money(state.lastDaySummary.revenue)} revenue · ${money(state.lastDaySummary.profit)} contribution · ${state.lastDaySummary.newLeads} new leads</span></div>`:''}
   <div class="capacity-card">${this.capacityBar(state,state.day)}</div>
   <div class="section-title"><b>${todayJobs.length?'TODAY’S JOBS':'NO JOBS TODAY'}</b><span>${todayJobs.length?`${todayJobs.length} booked`:'Use the free capacity or advance the day.'}</span></div>
   ${todayJobs.length?`<div class="card-list">${todayJobs.map(j=>this.jobRow(j,state)).join('')}</div>`:''}
   ${upcoming.length?`<div class="section-title"><b>UPCOMING</b><span>Next booked work</span></div><div class="card-list compact-list">${upcoming.map(j=>this.jobRow(j,state)).join('')}</div>`:''}
   <div class="section-title"><b>LEADS</b><span>${leads.length} waiting · quote, schedule or decline</span></div>
   <div class="lead-grid">${leads.length?leads.map(l=>this.leadCard(l,state)).join(''):'<div class="empty-state">No active leads. End the day to let new enquiries arrive.</div>'}</div>
   <div class="section-title"><b>RECENT ACTIVITY</b><span>What changed in the company</span></div>
   <div class="activity-list">${state.activity.slice(0,5).map(a=>`<div><b>${a.title}</b><span>${a.copy}</span><small>DAY ${a.day}</small></div>`).join('')}</div>
  </section>`
 }
 capacityBar(state,day){const cap=this.store.capacity(day),usedPct=cap.total?Math.min(100,cap.used/cap.total*100):0;return`<div class="cap-top"><div><small>STAFF CAPACITY · DAY ${day}</small><b>${cap.used.toFixed(1)}h booked / ${cap.total.toFixed(1)}h</b></div><strong>${cap.free.toFixed(1)}h FREE</strong></div><div class="cap-track"><span style="width:${usedPct}%"></span></div>`}
 leadCard(lead,state){const econ=this.store.leadEconomics(lead),urgent=lead.expiresDay<=state.day+1;return`<button class="lead-card ${lead.status==='accepted'?'accepted':''}" data-lead="${lead.id}"><div class="lead-card-top"><span class="avatar small">${lead.initials}</span><div><small>${lead.kind.toUpperCase()} · ${districtName(lead.district)}</small><b>${lead.client}</b></div><em class="status-chip ${urgent?'urgent':''}">${statusLabel(lead.status)}</em></div><p>${serviceName(lead.serviceId)} · ${lead.property} · ${lead.hours}h</p><div class="lead-money"><span><small>QUOTE</small><b>${money(lead.quotePrice)}</b></span><span><small>GUIDE</small><b>${money(lead.marketPrice)}</b></span><span><small>CONTRIB.</small><b>${money(econ.gross)}</b></span></div><footer><span>Expires day ${lead.expiresDay}</span><strong>${lead.status==='accepted'?'BOOK JOB':'OPEN LEAD'} →</strong></footer></button>`}
 jobRow(job,state){const pred=job.status==='scheduled'?this.store.predict(job):null,result=job.result;return`<button class="job-row" data-job="${job.id}"><div class="job-day"><small>DAY</small><b>${job.scheduledDay}</b></div><div class="job-main"><small>${serviceName(job.serviceId)} · ${districtName(job.district)}</small><b>${job.client}</b><span>${job.hours}h · ${money(job.price)} · ${job.status==='completed'?`${result?.stars??0}★ · quality ${result?.quality??0}`:`risk ${pred?.risk??'—'}`}</span></div><strong>${job.status==='completed'?'DONE':'OPEN'} →</strong></button>`}
 jobsTab(state){
  const scheduled=state.jobs.filter(j=>j.status==='scheduled').sort((a,b)=>a.scheduledDay-b.scheduledDay),completed=state.jobs.filter(j=>j.status==='completed').sort((a,b)=>b.scheduledDay-a.scheduledDay)
  return`<section class="panel-scroll"><div class="panel-head"><div><small>OPERATIONS</small><h2>Jobs & schedule</h2></div></div>
   <div class="section-title"><b>BOOKED WORK</b><span>${scheduled.length} future jobs</span></div><div class="card-list">${scheduled.length?scheduled.map(j=>this.jobRow(j,state)).join(''):'<div class="empty-state">No booked jobs. Win a quote from Today.</div>'}</div>
   <div class="section-title"><b>COMPLETED</b><span>${completed.length} jobs delivered</span></div><div class="card-list">${completed.length?completed.map(j=>this.jobRow(j,state)).join(''):'<div class="empty-state">Your completed jobs will stay here.</div>'}</div>
  </section>`
 }
 clientsTab(state){
  const clients=[...state.clients].sort((a,b)=>(b.recurring?1:0)-(a.recurring?1:0)||b.lifetimeValue-a.lifetimeValue)
  return`<section class="panel-scroll"><div class="panel-head"><div><small>CLIENT BOOK</small><h2>Clients you actually own</h2></div><div class="header-number"><b>${clients.filter(c=>c.recurring).length}</b><small>RECURRING</small></div></div>
   <div class="client-grid">${clients.length?clients.map(c=>`<button class="client-card" data-client="${c.id}"><div><span class="avatar small">${c.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><div><small>${c.kind.toUpperCase()} · ${districtName(c.district)}</small><b>${c.name}</b><p>${c.property}</p></div></div><div class="client-stats"><span><small>SATISFACTION</small><b>${c.satisfaction}/100</b></span><span><small>LIFETIME VALUE</small><b>${money(c.lifetimeValue)}</b></span><span><small>STATUS</small><b>${c.recurring?'RECURRING':'ONE-OFF'}</b></span></div></button>`).join(''):'<div class="empty-state">Complete jobs to turn leads into real clients.</div>'}</div>
   ${state.reviews.length?`<div class="section-title"><b>REVIEWS</b><span>Public reputation</span></div><div class="review-list">${state.reviews.slice(0,5).map(r=>`<div><b>${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</b><span>“${r.text}”</span><small>${r.client} · day ${r.day}</small></div>`).join('')}</div>`:''}
  </section>`
 }
 businessTab(state){
  const nextPremises=PREMISES[PREMISES.findIndex(p=>p.id===state.premises.id)+1]
  return`<section class="panel-scroll"><div class="panel-head"><div><small>ACHU BUSINESS</small><h2>People, fleet & systems</h2></div><div class="header-number"><b>${money(state.cash)}</b><small>AVAILABLE</small></div></div>
   <div class="business-block"><div class="section-title"><b>SUPPLIES</b><span>${Math.round(state.supplies)} / ${state.premises.stockLimit} stock</span></div><div class="supply-buy"><button data-stock="50">+50 stock <b>£40</b></button><button data-stock="120">+120 stock <b>£88</b></button></div></div>
   <div class="business-block"><div class="section-title"><b>TEAM</b><span>${state.staff.length}/${state.premises.staffLimit} staff at ${state.premises.name}</span></div><div class="staff-list">${state.staff.map(s=>this.staffCard(s,true)).join('')}</div><div class="candidate-list">${APPLICANTS.filter(a=>!state.staff.some(s=>s.id===a.id)).map(a=>this.staffCard(a,false)).join('')}</div></div>
   <div class="business-block"><div class="section-title"><b>FLEET</b><span>${state.vehicles.length} vehicle${state.vehicles.length===1?'':'s'}</span></div><div class="fleet-list">${VEHICLES.map(v=>this.vehicleCard(v,state)).join('')}</div></div>
   <div class="business-block"><div class="section-title"><b>PREMISES</b><span>${state.premises.name}</span></div><div class="premises-card"><div><small>CURRENT BASE</small><b>${state.premises.name}</b><p>${state.premises.staffLimit} staff · ${state.premises.stockLimit} stock capacity</p></div>${nextPremises?`<button data-premises="${nextPremises.id}" ${state.cash<nextPremises.price?'disabled':''}>MOVE TO ${nextPremises.name.toUpperCase()} · ${money(nextPremises.price)}</button>`:'<strong>REGIONAL CAPACITY REACHED</strong>'}</div></div>
   <div class="business-block"><div class="section-title"><b>SYSTEMS</b><span>Buy systems only when the operation needs them</span></div><div class="system-list">${SYSTEMS.map(s=>this.systemCard(s,state)).join('')}</div></div>
  </section>`
 }
 staffCard(s,hired){return`<div class="staff-card"><div><span class="avatar small">${s.name.split(' ').map(x=>x[0]).slice(0,2).join('')}</span><div><small>${s.role.toUpperCase()}</small><b>${s.name}</b><p>Quality ${s.quality} · Speed ${s.speed} · Reliability ${s.reliability}</p></div></div>${hired?`<strong>${s.owner?'OWNER':`${money(s.wage)}/H`}</strong>`:`<button data-hire="${s.id}">HIRE · ${money(s.hireCost)}</button>`}</div>`}
 vehicleCard(v,state){const owned=state.vehicles.find(x=>x.id===v.id);return`<div class="vehicle-card"><div><small>${owned?'OWNED':'AVAILABLE'}</small><b>${v.name}</b><p>${v.seats} seats · stock ${v.stockCapacity} · reliability ${v.reliability}</p></div>${owned?`<strong>${Math.round(owned.condition)}% CONDITION</strong>`:`<button data-vehicle="${v.id}" ${state.cash<v.price?'disabled':''}>BUY · ${money(v.price)}</button>`}</div>`}
 systemCard(s,state){const owned=state.systems[s.id],unlocked=s.unlock==='complaint'?state.flags.complaint:s.unlock==='multiJob'?state.jobs.length>=2:state.clients.length>=2;return`<div class="system-card ${owned?'owned':''}"><div><small>${owned?'INSTALLED':unlocked?'AVAILABLE':'LOCKED BY NEED'}</small><b>${s.name}</b><p>${s.description}</p><em>${s.effect}</em></div>${owned?'<strong>ACTIVE</strong>':`<button data-system="${s.id}" ${!unlocked||state.cash<s.price?'disabled':''}>INSTALL · ${money(s.price)}</button>`}</div>`}
 detailSheet(state){
  const lead=this.store.selectedLead();if(lead)return this.leadSheet(lead,state)
  const job=this.store.selectedJob();if(job)return this.jobSheet(job,state)
  const client=this.store.selectedClient();if(client)return this.clientSheet(client,state)
  return''
 }
 leadSheet(lead,state){
  const econ=this.store.leadEconomics(lead),accepted=lead.status==='accepted',closed=['declined','expired','scheduled'].includes(lead.status)
  const days=[state.day+1,state.day+2,state.day+3]
  return`<section class="detail-sheet"><button class="sheet-close" data-close>×</button><div class="sheet-handle"></div><small class="kicker">${lead.kind.toUpperCase()} LEAD · ${districtName(lead.district)}</small><h2>${lead.client}</h2><p class="detail-sub">${lead.property} · ${serviceName(lead.serviceId)} · ${lead.hours} staff-hours · ${lead.distanceMiles} miles</p><blockquote>“${lead.message}”</blockquote>
   <div class="detail-facts"><span><small>MARKET GUIDE</small><b>${money(lead.marketPrice)}</b></span><span><small>DIRECT GUIDE</small><b>${money(econ.direct)}</b></span><span><small>CONTRIBUTION</small><b>${money(econ.gross)}</b></span><span><small>MARGIN</small><b>${pct(econ.margin)}</b></span></div>
   ${lead.lastQuoteResult&&!lead.lastQuoteResult.accepted?`<div class="outcome bad"><b>QUOTE LOST</b><p>${lead.lastQuoteResult.reason} Change the number and try again before day ${lead.expiresDay}.</p></div>`:''}
   ${!closed&&!accepted?`<div class="quote-editor"><div><small>YOUR QUOTE</small><strong>${money(lead.quotePrice)}</strong></div><input data-quote-range="${lead.id}" type="range" min="${Math.max(40,Math.round(lead.marketPrice*.65))}" max="${Math.round(lead.marketPrice*1.45)}" step="1" value="${lead.quotePrice}"/><div><span>WIN WORK</span><span>MARKET ${money(lead.marketPrice)}</span><span>PREMIUM</span></div></div><div class="sheet-actions"><button class="secondary danger" data-decline="${lead.id}">DECLINE</button><button class="primary inline" data-submit-quote="${lead.id}">SEND ${money(lead.quotePrice)} QUOTE</button></div>`:''}
   ${accepted?`<div class="accepted-banner"><b>QUOTE ACCEPTED</b><span>Now choose when ACHU can actually deliver it.</span></div><div class="schedule-options">${days.map(d=>{const cap=this.store.capacity(d),disabled=cap.free<lead.hours;return`<button data-schedule-lead="${lead.id}" data-day="${d}" ${disabled?'disabled':''}><small>DAY ${d}</small><b>${cap.free.toFixed(1)}h free</b><span>${disabled?'NOT ENOUGH CAPACITY':'BOOK THIS DAY'}</span></button>`}).join('')}</div>`:''}
  </section>`
 }
 jobSheet(job,state){
  const pred=job.status==='scheduled'?this.store.predict(job):null,result=job.result
  return`<section class="detail-sheet"><button class="sheet-close" data-close>×</button><div class="sheet-handle"></div><small class="kicker">${job.status==='completed'?'COMPLETED JOB':`BOOKED · DAY ${job.scheduledDay}`}</small><h2>${job.client}</h2><p class="detail-sub">${serviceName(job.serviceId)} · ${districtName(job.district)} · ${job.hours}h · ${money(job.price)}</p>
   ${job.status==='scheduled'?`<div class="prediction"><span><small>PREDICTED QUALITY</small><b>${pred.quality}</b></span><span><small>RELIABILITY</small><b>${pred.reliability}</b></span><span><small>EST. DURATION</small><b>${pred.duration}h</b></span><span><small>RISK</small><b class="risk-${pred.risk.toLowerCase()}">${pred.risk}</b></span></div><div class="assign-grid"><label><small>ASSIGNED CLEANER</small><select data-assign-staff="${job.id}">${state.staff.map(s=>`<option value="${s.id}" ${job.crewIds?.includes(s.id)?'selected':''}>${s.name} · Q${s.quality} / R${s.reliability}</option>`).join('')}</select></label><label><small>VEHICLE</small><select data-assign-vehicle="${job.id}">${state.vehicles.map(v=>`<option value="${v.id}" ${job.vehicleId===v.id?'selected':''}>${v.name} · ${Math.round(v.condition)}%</option>`).join('')}</select></label></div><div class="job-cost-line"><span>Supplies needed <b>${job.suppliesNeeded}</b></span><span>Current stock <b>${Math.round(state.supplies)}</b></span></div>`:`<div class="result-card"><strong>${'★'.repeat(result.stars)}${'☆'.repeat(5-result.stars)}</strong><h3>Quality ${result.quality}/100</h3><div><span>Revenue <b>${money(job.price)}</b></span><span>Direct cost <b>${money(result.direct)}</b></span><span>Contribution <b>${money(result.profit)}</b></span><span>Reputation <b>${result.reputationDelta>=0?'+':''}${result.reputationDelta}</b></span></div></div>`}
  </section>`
 }
 clientSheet(client){return`<section class="detail-sheet"><button class="sheet-close" data-close>×</button><div class="sheet-handle"></div><small class="kicker">${client.kind.toUpperCase()} CLIENT</small><h2>${client.name}</h2><p class="detail-sub">${client.property} · ${districtName(client.district)}</p><div class="client-detail"><span><small>SATISFACTION</small><b>${client.satisfaction}/100</b></span><span><small>JOBS</small><b>${client.jobsCompleted}</b></span><span><small>LIFETIME VALUE</small><b>${money(client.lifetimeValue)}</b></span><span><small>RELATIONSHIP</small><b>${client.recurring?'RECURRING':'ONE-OFF'}</b></span></div><p class="client-note">A recurring client is not XP. They occupy real future capacity but make revenue more predictable.</p></section>`}
 bind(state){
  this.el.querySelector('[data-reset]')?.addEventListener('click',()=>this.store.reset())
  this.el.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>this.store.setTab(b.dataset.tab)))
  this.el.querySelector('[data-next-day]')?.addEventListener('click',()=>this.store.advanceDay())
  this.el.querySelectorAll('[data-lead]').forEach(b=>b.addEventListener('click',()=>this.store.selectLead(b.dataset.lead)))
  this.el.querySelectorAll('[data-job]').forEach(b=>b.addEventListener('click',()=>this.store.selectJob(b.dataset.job)))
  this.el.querySelectorAll('[data-client]').forEach(b=>b.addEventListener('click',()=>this.store.selectClient(b.dataset.client)))
  this.el.querySelector('[data-close]')?.addEventListener('click',()=>{state.selectedLeadId=null;state.selectedJobId=null;state.selectedClientId=null;this.store.emit()})
  this.el.querySelector('[data-quote-range]')?.addEventListener('input',e=>this.store.setLeadQuote(e.target.dataset.quoteRange,e.target.value))
  this.el.querySelector('[data-submit-quote]')?.addEventListener('click',e=>this.store.submitQuote(e.target.dataset.submitQuote))
  this.el.querySelector('[data-decline]')?.addEventListener('click',e=>this.store.declineLead(e.target.dataset.decline))
  this.el.querySelectorAll('[data-schedule-lead]').forEach(b=>b.addEventListener('click',()=>this.store.scheduleLead(b.dataset.scheduleLead,b.dataset.day)))
  this.el.querySelector('[data-assign-staff]')?.addEventListener('change',e=>this.store.assignStaff(e.target.dataset.assignStaff,e.target.value))
  this.el.querySelector('[data-assign-vehicle]')?.addEventListener('change',e=>this.store.assignVehicle(e.target.dataset.assignVehicle,e.target.value))
  this.el.querySelectorAll('[data-stock]').forEach(b=>b.addEventListener('click',()=>this.store.buySupplies(b.dataset.stock)))
  this.el.querySelectorAll('[data-hire]').forEach(b=>b.addEventListener('click',()=>this.store.hireStaff(b.dataset.hire)))
  this.el.querySelectorAll('[data-vehicle]').forEach(b=>b.addEventListener('click',()=>this.store.buyVehicle(b.dataset.vehicle)))
  this.el.querySelectorAll('[data-premises]').forEach(b=>b.addEventListener('click',()=>this.store.upgradePremises(b.dataset.premises)))
  this.el.querySelectorAll('[data-system]').forEach(b=>b.addEventListener('click',()=>this.store.buySystem(b.dataset.system)))
 }
 destroy(){this.unsub?.();this.el.remove()}
}
