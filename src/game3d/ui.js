import { BUILDINGS,buildingRequirements,nextBuildingLevel,RESOURCES } from '../data/buildings.js'
import { findResearch,RESEARCH,researchCost } from '../data/research.js'
import { currentChapter,chapterStatus } from '../data/chapters.js'
import { worldTile,parseTile,adjacentTo } from '../data/world.js'

const short=n=>{const v=Math.floor(Number(n)||0);return v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(1)}K`:`${v}`}
const time=ms=>{let s=Math.max(0,Math.ceil(ms/1000));if(s<60)return`${s}s`;const m=Math.floor(s/60);s%=60;return`${m}m ${s}s`}
const resourceName=k=>RESOURCES[k]?.short??k.toUpperCase()
const costHtml=c=>Object.entries(c??{}).map(([k,v])=>`<span class="cost ${k}"><i>${RESOURCES[k]?.icon??'•'}</i>${resourceName(k)} ${short(v)}</span>`).join('')
const TEAM={infantry:{name:'Field Teams',unit:'staff'},lancer:{name:'Mobile Teams',unit:'staff'},marksman:{name:'Specialists',unit:'staff'}}
const kindLabel={base:'headquarters',resource:'opportunity',camp:'contract lead',settlement:'competitor account',wild:'market zone'}

export class GameUI{
 constructor(game){this.game=game;this.root=document.createElement('div');this.root.className='game-ui';document.body.appendChild(this.root);this.renderShell();this.bind();this.refresh()}
 renderShell(){this.root.innerHTML=`
  <div class="topbar">
   <div class="profile"><b>A</b><div><strong>ACHU BUSINESS HUB</strong><small id="power"></small></div></div>
   <div id="resources" class="resources"></div>
  </div>
  <button id="quest" class="quest-card"></button><div id="mode-tag" class="mode-tag">CAMPUS</div>
  <button id="update-app" class="update-app">SYNC</button><div id="queue" class="queue-card"></div><div id="toast" class="toast"></div>
  <div id="sheet" class="sheet hidden"></div>
  <nav class="bottom-nav">
   <button data-mode="city"><span>⌂</span><b>CAMPUS</b></button>
   <button data-mode="world"><span>◎</span><b>MARKET</b></button>
   <button data-action="army"><span>◉</span><b>TEAM</b></button>
   <button data-action="tech"><span>⌬</span><b>SYSTEMS</b></button>
   <button data-action="guild"><span>◇</span><b>NETWORK</b></button>
   <button data-action="events"><span>✦</span><b>DEALS</b></button>
  </nav>`}
 bind(){
  this.root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>this.game.setMode(b.dataset.mode))
  this.root.querySelector('[data-action="army"]').onclick=()=>this.openArmy()
  this.root.querySelector('[data-action="tech"]').onclick=()=>this.openTech()
  this.root.querySelector('[data-action="guild"]').onclick=()=>this.openGuild()
  this.root.querySelector('[data-action="events"]').onclick=()=>this.openEvents()
  this.root.querySelector('#quest').onclick=()=>this.questAction()
  this.root.querySelector('#update-app').onclick=()=>window.appUpdater?.checkAndApply?.()
 }
 toast(msg){const el=this.root.querySelector('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.remove('show'),1800)}
 hideSheet(){this.root.querySelector('#sheet').classList.add('hidden')}
 openSheet(html){const s=this.root.querySelector('#sheet');s.innerHTML=html;s.classList.remove('hidden');s.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>this.hideSheet())}
 refresh(){this.refreshTop();this.refreshQuest();this.refreshQueue();this.refreshNav()}
 refreshTop(){
  const s=this.game.state
  this.root.querySelector('#power').textContent=`${short(s.power)} COMPANY VALUE`
  this.root.querySelector('#resources').innerHTML=Object.entries(RESOURCES).map(([k,r])=>`<div class="resource"><i style="--c:#${r.color.toString(16).padStart(6,'0')}">${r.icon??''}</i><b>${short(s.resources[k])}</b><small>${r.short}</small></div>`).join('')
 }
 refreshQuest(){
  const q=this.root.querySelector('#quest'),ch=currentChapter(this.game.state)
  if(this.game.mode==='world'||!ch){const w=this.game.state.world;q.innerHTML=`<i>↗</i><div><strong>MARKET GROWTH</strong><b>${w.scouted.length<12?'Research nearby demand':w.owned.length<5?'Open another service area':w.defeated.length<1?'Win your first commercial contract':'Scale into competitor territory'}</b><small>${w.owned.length} service areas · ${w.defeated.length} contracts won</small></div><em>›</em>`;return}
  const st=chapterStatus(this.game.state,ch);q.innerHTML=`<i>✦</i><div><strong>${ch.title}</strong><b>${st.done?'Milestone reward ready':`${BUILDINGS[st.next?.[0]]?.name??'Division'} → Lv. ${st.next?.[1]??''}`}</b><small>${st.complete}/${st.total} business goals</small></div><em>›</em>`
 }
 questAction(){const ch=currentChapter(this.game.state);if(this.game.mode==='world'||!ch){this.game.setMode('world');return}const st=chapterStatus(this.game.state,ch);if(st.done)this.game.claimChapter(ch);else if(st.next)this.game.focusBuilding(st.next[0])}
 refreshQueue(){
  const s=this.game.state,c=s.construction,r=s.researchJob,w=s.world
  this.root.querySelector('#queue').innerHTML=`<b>${c?`BUILD · ${BUILDINGS[c.id].name} Lv.${c.target} · ${time(c.finishAt-Date.now())}`:'OPERATIONS · READY'}</b><small>${r?`SYSTEM · ${findResearch(r.id)?.name??r.id} Lv.${r.target} · ${time(r.finishAt-Date.now())}`:`Field deployments ${w.marches.length}/${this.game.marchCapacity()} · ${c?'development active':'capacity available'}`}</small>`
 }
 refreshNav(){this.root.querySelector('#mode-tag').textContent=this.game.mode==='world'?'MARKET':'CAMPUS';this.root.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===this.game.mode))}
 openBuilding(id){
  const d=BUILDINGS[id],lvl=this.game.state.buildings[id]??0,target=nextBuildingLevel(this.game.state,id),spec=d.levels[target],req=spec?buildingRequirements(this.game.state,id,target):[]
  this.openSheet(`<header><div><small>${d.category.toUpperCase()}</small><h2>${d.name}</h2><p>Level ${lvl}/12</p></div><button data-close>×</button></header><div class="sheet-body"><p class="building-copy">${d.description??d.role??''}</p>${spec?`<h3>${lvl?'NEXT DEVELOPMENT':'OPEN DIVISION'} · LEVEL ${target}</h3><div class="costs">${costHtml(spec.cost)}</div><p class="require ${req.length?'bad':'good'}">${req.length?`Requires ${req.join(' · ')}`:'Ready to develop'}</p><button id="upgrade" class="primary">${this.game.state.construction?'DEVELOPMENT BUSY':lvl?'UPGRADE DIVISION':'OPEN DIVISION'}</button>`:'<h3>DIVISION FULLY DEVELOPED</h3>'}</div>`)
  const b=this.root.querySelector('#upgrade');if(b&&!this.game.state.construction)b.onclick=()=>{this.game.upgradeBuilding(id);this.hideSheet()}
 }
 openWorldTile(id){
  const [x,y]=parseTile(id),d=worldTile(x,y),w=this.game.state.world,scouted=w.scouted.includes(id),owned=w.owned.includes(id);let action=''
  if(!scouted&&adjacentTo(id,w.scouted))action=`<button id="tile-action" class="primary">RESEARCH AREA</button>`
  else if(scouted&&!owned&&!['camp','settlement'].includes(d.kind)&&adjacentTo(id,w.owned))action=`<button id="tile-action" class="primary">OPEN SERVICE AREA</button>`
  else if(scouted&&d.kind==='resource'&&owned)action=`<button id="tile-action" class="primary">WORK OPPORTUNITY</button>`
  else if(scouted&&['camp','settlement'].includes(d.kind))action=`<button id="tile-action" class="danger">PITCH FOR CONTRACT · ${short(d.strength)}</button>`
  this.openSheet(`<header><div><small>${d.region.toUpperCase()}</small><h2>${scouted?d.name:'Unresearched market'}</h2><p>${scouted?`Level ${d.level??1} · ${kindLabel[d.kind]??d.kind}`:'Demand data unavailable'}</p></div><button data-close>×</button></header><div class="sheet-body">${scouted&&d.reward?`<h3>BUSINESS VALUE</h3><div class="costs">${costHtml(d.reward)}</div>`:''}${action||'<p>Expand through an adjacent service area to unlock this market.</p>'}</div>`)
  const b=this.root.querySelector('#tile-action');if(b)b.onclick=()=>{if(!scouted)this.game.scoutTile(id);else if(!owned&&!['camp','settlement'].includes(d.kind))this.game.claimTile(id);else if(d.kind==='resource')this.game.gatherTile(id);else this.game.attackTile(id);this.hideSheet()}
 }
 openArmy(){
  const w=this.game.state.world
  this.openSheet(`<header><div><small>PEOPLE</small><h2>Workforce</h2><p>Operational capacity ${short(this.game.armyPower())}</p></div><button data-close>×</button></header><div class="sheet-body army-list">${Object.entries(TEAM).map(([k,d])=>`<div><span><b>${d.name.toUpperCase()}</b><small>${short(w.troops[k]??0)} ${d.unit}</small></span><button data-train="${k}">HIRE</button></div>`).join('')}</div>`)
  this.root.querySelectorAll('[data-train]').forEach(b=>b.onclick=()=>this.game.trainTroops(b.dataset.train))
 }
 openTech(){
  const s=this.game.state,items=Object.values(RESEARCH).flatMap(branch=>Object.entries(branch.items).map(([id,d])=>({id,...d})))
  this.openSheet(`<header><div><small>BUSINESS SYSTEMS</small><h2>Systems & Process</h2><p>${s.researchJob?'Improvement in progress':'Improvement capacity available'}</p></div><button data-close>×</button></header><div class="sheet-body tech-list">${items.map(d=>{const lvl=s.research[d.id]??0,c=researchCost(d,Math.min(d.max,lvl+1));return`<button data-research="${d.id}"><span><b>${d.name}</b><small>Lv. ${lvl}/${d.max}</small></span><em>${lvl>=d.max?'MAX':short(Object.values(c).reduce((a,b)=>a+b,0))}</em></button>`}).join('')}</div>`)
  this.root.querySelectorAll('[data-research]').forEach(b=>b.onclick=()=>{this.game.research(b.dataset.research);this.hideSheet()})
 }
 openGuild(){
  const g=this.game.state.guild
  if(!g.id){this.openSheet(`<header><div><small>NETWORK</small><h2>Partner Network</h2><p>Build a business network for shared capacity and opportunities</p></div><button data-close>×</button></header><div class="sheet-body"><h3>CREATE NETWORK</h3><input id="guild-name" type="text" placeholder="Network name (3-20 chars)" maxlength="20"/><button id="create-guild" class="primary">CREATE NETWORK</button></div>`);this.root.querySelector('#create-guild').onclick=()=>{const name=this.root.querySelector('#guild-name').value;this.game.createGuild(name)}}
  else{const members=Object.entries(g.members).map(([id,m])=>`<div class="network-member"><span>${id===g.leader?'★ ':''}${id}</span><small>${m.role}</small></div>`).join('');this.openSheet(`<header><div><small>NETWORK</small><h2>${g.name}</h2><p>Lv. ${g.level} · ${Object.keys(g.members).length} partners</p></div><button data-close>×</button></header><div class="sheet-body"><h3>PARTNERS</h3>${members}<h3>SHARED RESOURCES</h3><div>${Object.entries(g.treasury).map(([k,v])=>`<div><b>${resourceName(k)}</b> ${short(v)}</div>`).join('')}</div></div>`)}
 }
 openEvents(){
  const events=this.game.state.events.active.map(e=>`<div><span><b>${e.title}</b><small>${e.description}</small></span><em>${short(Object.values(e.reward??{}).reduce((a,b)=>a+b,0))}</em><button data-event-claim="${e.id}">CLAIM</button></div>`).join('')
  this.openSheet(`<header><div><small>OPPORTUNITIES</small><h2>Live Deals</h2><p>${this.game.state.events.active.length} active</p></div><button data-close>×</button></header><div class="sheet-body events-list">${events||'<p>No live opportunities right now.</p>'}</div>`)
  this.root.querySelectorAll('[data-event-claim]').forEach(b=>b.onclick=()=>this.game.claimEventReward(b.dataset.eventClaim))
 }
}
