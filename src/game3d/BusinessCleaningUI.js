import { GameUI4X } from './ui4x.js'
import { BUILDINGS,RESOURCES } from '../data/buildings.js'
import { currentChapter,chapterStatus } from '../data/chapters.js'
import { worldTile,parseTile,adjacentTo } from '../data/world.js'
import { fourXFlow } from './fourXFlow.js'

const short=n=>{const v=Math.floor(Number(n)||0);return v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(1)}K`:`${v}`}
const time=ms=>{let s=Math.max(0,Math.ceil(ms/1000));if(s<60)return`${s}s`;const m=Math.floor(s/60);s%=60;return m<60?`${m}m ${s}s`:`${Math.floor(m/60)}h ${m%60}m`}
const costHtml=c=>Object.entries(c??{}).map(([k,v])=>`<span class="cost ${k}"><i>${RESOURCES[k]?.icon??'•'}</i>${short(v)} ${RESOURCES[k]?.short??k}</span>`).join('')
const listHtml=(items,klass='effect-list')=>`<div class="${klass}">${items.map(x=>`<div>${x}</div>`).join('')}</div>`
const CHAPTER_COPY={
 'first-shelter':{title:'GET READY FOR THE FIRST BOOKING',story:'ACHU begins with a phone, basic supplies and no organised way to hold a client. Before the first enquiry becomes a booking, the company needs a place to record the client and a headquarters capable of supporting the work.',objective:'Open the Client Centre, then raise Headquarters to level 2.',why:'The Client Centre is the system behind enquiries, quotes, bookings and recurring work. Headquarters unlocks the next business capability.',success:'ACHU is ready to receive, organise and retain its first real client.'},
 timber:{title:'BE READY TO DELIVER',story:'A booking is only valuable if the team can arrive with the right products and equipment. Build the supply operation before demand grows.',objective:'Develop the Supply Depot to level 2, then raise Headquarters to level 3.',why:'Supplies protect reliability and margin. A missing product turns a profitable booking into wasted time.',success:'ACHU can now support regular cleaning work without improvising every visit.'},
 hunt:{title:'LAUNCH THE LOCAL MARKET',story:'The operation is ready, but the calendar is empty. Build a repeatable sales process, then unlock the City to research real markets and enquiries.',objective:'Develop the Sales Office to level 3, then raise Headquarters to level 4.',why:'Headquarters 4 opens the 4X market loop: research demand, open coverage, complete jobs and bid for contracts.',success:'ACHU can now leave the base, find work and grow through the city.'}
}
const TASK_VERBS={shelter:'Open the client system',furnace:'Develop the company platform',sawmill:'Build supply readiness',huntersHut:'Build the sales pipeline'}

export class BusinessCleaningUI extends GameUI4X{
 openMission(ch){
  const st=chapterStatus(this.game.state,ch),copy=CHAPTER_COPY[ch.id]??ch
  const tasks=ch.tasks.map(([id,lvl,label,reason])=>{
   const current=this.game.state.buildings[id]??0,done=current>=lvl
   return`<div class="mission-row ${done?'done':''}"><span>${done?'✓':'○'}</span><div><b>${label??TASK_VERBS[id]??BUILDINGS[id]?.name??id}</b><small>${reason??`Reach ${BUILDINGS[id]?.name??id} level ${lvl}`} · ${current}/${lvl}</small></div></div>`
  }).join('')
  const next=st.next,button=st.done?'COLLECT CHAPTER REWARD':`GO TO ${BUILDINGS[next?.[0]]?.name?.toUpperCase()??'NEXT STEP'}`
  this.openSheet(`<header><div><small>${ch.kicker}</small><h2>${copy.title??ch.title.split(' · ')[1]}</h2><p>${st.complete}/${st.total} steps complete</p></div><button data-close>×</button></header><div class="sheet-body"><div class="chapter-story"><span>THE BUSINESS SITUATION</span><p>${copy.story}</p></div><h3>WHAT YOU DO NOW</h3><p class="brief-copy">${copy.objective}</p><div class="mission-list">${tasks}</div><div class="tutorial-box"><b>HOW THIS PLAYS</b><ol><li>Tap the button below.</li><li>The camera opens the exact division required by the story.</li><li>Tap OPEN or UPGRADE, pay the shown business resources and watch the Queue timer.</li><li>When development completes, this chapter step checks itself off.</li></ol></div><h3>WHY IT BELONGS HERE</h3><p class="brief-copy">${copy.why}</p><h3>RESULT</h3><div class="story-card success"><b>${copy.success}</b></div><h3>REWARD</h3><div class="costs">${costHtml(ch.reward)}</div><button id="mission-go" class="primary">${button}</button></div>`)
  this.root.querySelector('#mission-go').onclick=()=>{
   if(st.done){this.game.claimChapter(ch);const nextChapter=currentChapter(this.game.state);nextChapter?this.openMission(nextChapter):this.openCompanyProfile()}
   else if(next){this.hideSheet();this.game.focusBuilding(next[0]);setTimeout(()=>this.openBuilding(next[0]),70)}
  }
 }
 openCityBriefing(){
  if((this.game.state.buildings.furnace??1)<4){const ch=currentChapter(this.game.state);if(ch)this.openMission(ch);return}
  const f=fourXFlow(this.game.state),w=this.game.state.world
  this.openSheet(`<header><div><small>ACHU CLEANING 4X</small><h2>${f.label}: ${f.title}</h2><p>${w.scouted.length} researched · ${w.owned.length} covered · ${w.defeated.length} contracts</p></div><button data-close>×</button></header><div class="sheet-body"><div class="fourx-explain"><div><b>1 · EXPLORE</b><span>Research demand, prices, travel and competition.</span></div><div><b>2 · EXPAND</b><span>Open service coverage where the operation can deliver.</span></div><div><b>3 · OPERATE</b><span>Accept real cleaning enquiries and dispatch crews.</span></div><div><b>4 · COMPETE</b><span>Bid for recurring commercial contracts.</span></div></div><div class="story-card"><b>THE RULE</b><p>The map is not territory to conquer. It is a market to understand and serve. Coverage costs money, jobs consume crew time, and contracts require enough operational capability.</p></div><div class="tutorial-box"><b>NEXT CLICK</b><p>${f.copy}</p><ol><li>Tap the highlighted objective.</li><li>Review the actual business numbers.</li><li>Confirm the action only when it makes operational sense.</li><li>The crew, timer and result remain visible in Queue.</li></ol></div><button id="fourx-go" class="primary">${f.action}</button></div>`)
  this.root.querySelector('#fourx-go').onclick=()=>{this.hideSheet();this.game.setMode('world');if(f.target)setTimeout(()=>this.openWorldTile(f.target),60)}
 }
 refreshQueue(){
  const s=this.game.state,c=s.construction,r=s.researchJob,m=s.world.marches?.[0]
  let title='Operation ready',sub='No development or field work is waiting'
  if(c){title=`Developing ${BUILDINGS[c.id]?.name??'the company'}`;sub=`Ready in ${time(c.finishAt-Date.now())}`}
  else if(r){title='Improving a business system';sub=`Ready in ${time(r.finishAt-Date.now())}`}
  else if(m){
   const label={scout:'Market research',claim:'Coverage launch',gather:'Cleaning job',attack:'Contract bid'}[m.type]??'Field operation'
   const phase={outbound:'team travelling',gathering:'service in progress',returning:'team returning'}[m.phase]??m.phase
   title=`${label} · ${phase}`;sub=`${s.world.marches.length} active field operation${s.world.marches.length===1?'':'s'}`
  }
  this.root.querySelector('#queue').innerHTML=`<b>${title}</b><small>${sub}</small>`
 }
 openWorldTile(id){
  const [x,y]=parseTile(id),d=worldTile(x,y),w=this.game.state.world,known=w.scouted.includes(id),covered=w.owned.includes(id),won=w.defeated.includes(id)
  const active=w.marches.some(m=>m.target===id),ready=Date.now()>=(w.nodeReady?.[id]??0),cap=this.game.companyCapability()
  let body='',action='',status=covered?'Coverage active':known?'Market researched':'Unknown market'

  if(!known){
   body=`<div class="story-card"><b>MARKET RESEARCH</b><p>ACHU does not yet know the demand, average job value, property mix, competition or travel cost here.</p></div>${listHtml(['Research cost: £25 Cash + 15 Supplies','Result: demand, prices, travel and competition become visible','This does not open coverage or create revenue by itself.'])}`
   if(adjacentTo(id,w.scouted)&&!active)action='<button id="tile-action" class="primary">RUN MARKET RESEARCH</button>'
  }else{
   const market=listHtml([`Demand: ${d.demand}`,`Average job value: £${d.averageJobValue}`,`Competition: ${d.competition}${d.competitor?` · ${d.competitor} active nearby`:''}`,`Travel from base: about ${d.travelMins} minutes`,`Property mix: ${d.propertyMix}`])
   if(d.businessType==='lead'){
    body=`<div class="story-card"><b>${d.client} · ${d.property}</b><p>${d.service} · ${d.frequency}. The client is prepared to pay £${d.quote} for about ${d.crewHours} crew-hours.</p></div>${listHtml([`Quoted revenue: £${d.quote}`,`Estimated margin: ${d.margin}%`,`Reputation on successful completion: +${d.reviewReward}`,`Coverage: ${covered?'active':'not active'}`])}`
    if(!covered&&adjacentTo(id,w.owned)&&!active)action='<button id="tile-action" class="primary">OPEN SERVICE COVERAGE</button>'
    else if(covered&&ready&&!active)action='<button id="tile-action" class="primary">ACCEPT JOB & DISPATCH CREW</button>'
    else if(covered&&!ready)body+=`<p class="quiet-copy">This client window refreshes in ${time((w.nodeReady[id]??0)-Date.now())}.</p>`
   }else if(['tender','framework'].includes(d.businessType)){
    status=won?'Contract won':'Tender available'
    body=`<div class="story-card"><b>${d.client}</b><p>${d.service} · ${d.frequency} · ${d.term}. ${d.incumbent?`${d.incumbent} currently holds the relationship.`:'The client is accepting bids.'}</p></div>${listHtml([`Monthly contract value: £${short(d.monthlyValue)}`,`Annual value: £${short(d.annualValue)}`,`ACHU operational capability: ${short(cap)}`,`Required capability: ${short(d.requiredCapability)}`])}<h3>CLIENT REQUIREMENTS</h3>${listHtml(d.requirements)}<div class="story-card ${cap>=d.requiredCapability?'success':''}"><b>${cap>=d.requiredCapability?'ACHU IS READY TO BID':'ACHU IS NOT READY YET'}</b><p>${cap>=d.requiredCapability?'The company has enough people, training and systems to submit a credible bid.':'Hire and train crews, improve quality and strengthen the operation before committing to this contract.'}</p></div>`
    if(!won&&!active&&cap>=d.requiredCapability)action='<button id="tile-action" class="primary">SUBMIT COMMERCIAL BID</button>'
   }else{
    body=`<div class="story-card"><b>${d.name}</b><p>This market has no live enquiry right now. Research lets you judge whether opening coverage is worth the cost.</p></div>${market}`
    if(!covered&&adjacentTo(id,w.owned)&&!active)action='<button id="tile-action" class="primary">OPEN SERVICE COVERAGE</button>'
   }
   if(d.businessType!=='lead'&&!['tender','framework'].includes(d.businessType))body+=market
  }

  this.openSheet(`<header><div><small>${d.region.toUpperCase()}</small><h2>${known?d.name:'Unknown neighbourhood'}</h2><p>${status}</p></div><button data-close>×</button></header><div class="sheet-body">${body}${active?'<div class="story-card success"><b>A field operation is already active here.</b><p>Follow its progress in Queue.</p></div>':action||'<p class="quiet-copy">There is no action available here right now.</p>'}</div>`)
  const b=this.root.querySelector('#tile-action')
  if(b)b.onclick=()=>{if(!known)this.game.scoutTile(id);else if(!covered&&!['tender','framework'].includes(d.businessType))this.game.claimTile(id);else if(d.businessType==='lead')this.game.gatherTile(id);else this.game.attackTile(id);this.hideSheet()}
 }
 openArmy(){
  const w=this.game.state.world,teams={infantry:['Cleaning crews','Core domestic and office service'],lancer:['Mobile crews','Fast coverage across wider routes'],marksman:['Specialist teams','Premium and difficult cleaning']}
  this.openSheet(`<header><div><small>OPERATIONS</small><h2>People and capacity</h2><p>${short(this.game.companyCapability())} operational capability</p></div><button data-close>×</button></header><div class="sheet-body"><div class="story-card"><b>WHAT CAPABILITY MEANS</b><p>Commercial bids are not battles. Capability represents available cleaners, specialist skill, mobility, training, leadership and the systems needed to deliver the contract reliably.</p></div><div class="army-list">${Object.entries(teams).map(([k,d])=>`<div><span><b>${d[0]}</b><small>${d[1]} · ${short(w.troops[k]??0)} people</small></span><button data-train="${k}">HIRE</button></div>`).join('')}</div><div class="tutorial-box"><b>HOW HIRING WORKS</b><ol><li>Open the correct people or fleet division first.</li><li>Tap HIRE to spend Cash, Supplies and Reputation.</li><li>Recruitment appears in Queue.</li><li>When complete, new staff increase available field capacity and bid strength.</li></ol></div></div>`)
  this.root.querySelectorAll('[data-train]').forEach(b=>b.onclick=()=>this.game.trainTroops(b.dataset.train))
 }
}
