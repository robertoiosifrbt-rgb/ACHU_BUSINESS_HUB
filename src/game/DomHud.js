import {BUILDINGS,RESOURCES,buildingRequirements,nextBuildingLevel} from '../data/buildings.js'
import {buildingEffectLines,buildingRole} from '../data/buildingProgression.js'
import {FURNACE_MAX_LEVEL,FURNACE_LEVELS,furnaceTier,nextFurnaceUnlock} from '../data/furnace.js'
import {SYSTEM_UNLOCKS,unlockLevelForBuilding} from '../data/cityProgression.js'
import {RESEARCH,findResearch,researchCost} from '../data/research.js'
import {currentChapter,chapterStatus} from '../data/chapters.js'
import {worldTile,parseTile,adjacentTo,FACTIONS} from '../data/world.js'
import {HEROES,FORMATIONS,heroXpToNext} from '../data/heroes.js'
import {DEMO_SPEED} from '../systems/state.js'

const fmt=n=>Math.floor(Number(n)||0).toLocaleString('en-GB')
const short=n=>{n=Number(n)||0;if(n>=1e9)return`${(n/1e9).toFixed(1)}B`;if(n>=1e6)return`${(n/1e6).toFixed(1)}M`;if(n>=1e3)return`${(n/1e3).toFixed(1)}K`;return Math.floor(n).toString()}
const time=ms=>{ms=Math.max(0,ms||0);const s=Math.ceil(ms/1000);if(s<60)return`${s}s`;const m=Math.floor(s/60),r=s%60;if(m<60)return`${m}m ${r}s`;const h=Math.floor(m/60);return`${h}h ${m%60}m`}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const resourceIcon={meat:'◒',wood:'▤',coal:'◆',iron:'⬢'}
const buildingIcon={furnace:'♨',shelter:'⌂',sawmill:'⌑',huntersHut:'◈',coalMine:'◆',ironMine:'⬢',storehouse:'▣',infirmary:'✚',embassy:'⚑',infantryCamp:'♜',lancerCamp:'♞',marksmanCamp:'⌁',researchCenter:'⌬'}
const categoryLabel={core:'CORE',city:'CITY',resource:'ECONOMY',military:'MILITARY',science:'SCIENCE'}

function costLine(cost={}){
 return Object.keys(RESOURCES).map(k=>`<span class="cost-chip ${k}"><b>${resourceIcon[k]}</b>${short(cost[k]??0)}</span>`).join('')
}
function progress(p){return`<div class="meter"><i style="width:${Math.max(0,Math.min(100,p*100))}%"></i></div>`}

export class DomHud{
 constructor(game,mount){
  this.game=game;this.mount=mount;this.selectedBuilding=null;this.selectedWorld=null;this.lastPaint=0;this.lastKey='';this._toast=''
  this.detail={visible:false};this.researchPanel={visible:false};this.worldPanel={visible:false,refresh:()=>this.renderWorldPanel(this.selectedWorld)};this.armyPanel={visible:false,open:()=>this.openArmy(),refresh:()=>this.renderArmy()}
  this.queue={};Object.defineProperty(this.queue,'text',{get:()=>this._toast,set:v=>{this._toast=String(v??'');this.showToast(this._toast)}})
  this.root=document.createElement('div');this.root.className='game-ui';this.root.innerHTML=this.shell();mount.appendChild(this.root)
  this.$=s=>this.root.querySelector(s);this.bind();this.refresh(true)
 }
 shell(){return`
  <div class="screen-shade"></div>
  <header class="top-chrome">
   <button class="profile-card" data-action="profile"><span class="crest">R</span><span><b>EMBERFALL</b><small id="powerValue">0 POWER</small></span></button>
   <div class="resources" id="resources"></div>
  </header>
  <section class="objective-card" id="objective" data-action="objective"></section>
  <section class="queue-card" id="queueCard"></section>
  <div class="mode-switch"><button data-action="city" class="active" id="cityMode">⌂<span>CITY</span></button><button data-action="world" id="worldMode">◎<span>WORLD</span></button></div>
  <nav class="bottom-dock">
   <button data-action="city" id="navCity"><b>⌂</b><span>City</span></button>
   <button data-action="world" id="navWorld"><b>◎</b><span>World</span><i class="lock"></i></button>
   <button data-action="army" id="navArmy"><b>⚔</b><span>Army</span><i class="lock"></i></button>
   <button data-action="research" id="navResearch"><b>⌬</b><span>Tech</span><i class="lock"></i></button>
   <button data-action="alliance" id="navAlliance"><b>⚑</b><span>Alliance</span><i class="lock"></i></button>
  </nav>
  <div class="toast" id="toast"></div>
  <div class="sheet-wrap" id="sheetWrap"><div class="sheet-scrim" data-action="close"></div><article class="sheet" id="sheet"></article></div>
 `}
 bind(){
  this.root.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action,id=el.dataset.id
   if(a==='close'){this.hideSheets();return}
   if(a==='city'){this.game.showCity();return}
   if(a==='world'){if(!this.requireSystem('world'))return;this.game.showWorld();return}
   if(a==='army'){if(!this.requireSystem('army'))return;this.openArmy();return}
   if(a==='research'){if(!this.requireSystem('research'))return;this.openResearch();return}
   if(a==='alliance'){if(!this.requireSystem('alliance'))return;this.game.helpConstruction();return}
   if(a==='objective'){this.objectiveAction();return}
   if(a==='profile'){this.showProfile();return}
   if(a==='upgrade'){this.game.upgradeBuilding(id);setTimeout(()=>this.showBuilding(id),30);return}
   if(a==='locate'){this.hideSheets();this.game.focusBuilding(id);return}
   if(a==='collect'){this.game.collectResource(id);setTimeout(()=>this.showBuilding(id),30);return}
   if(a==='research-start'){this.game.research(id);setTimeout(()=>this.openResearch(),30);return}
   if(a==='hero'){this.game.cycleHero();return}
   if(a==='formation'){this.game.cycleFormation();return}
   if(a==='train'){this.game.trainTroops(id);return}
   if(a==='scout'){this.game.scoutTile(id);return}
   if(a==='claim'){this.game.claimTile(id);return}
   if(a==='gather'){this.game.gatherTile(id);return}
   if(a==='attack'){this.game.attackTile(id);return}
   if(a==='rally'){this.game.startRally(id);return}
   if(a==='reset'){if(confirm('Reset this local settlement? A backup is kept.'))this.game.reset();return}
  })
 }
 requireSystem(id){const need=SYSTEM_UNLOCKS[id]??1,lvl=this.game.state.buildings.furnace??1;if(lvl>=need)return true;this.showToast(`${id.toUpperCase()} unlocks at Furnace ${need}`);return false}
 setLocked(selector,locked,label){const el=this.$(selector);if(!el)return;el.classList.toggle('locked',locked);const l=el.querySelector('.lock');if(l)l.textContent=locked?`F${label}`:''}
 refresh(force=false){
  const now=performance.now();if(!force&&now-this.lastPaint<180)return;this.lastPaint=now
  const s=this.game.state,w=s.world,f=s.buildings.furnace??1,key=`${this.game.mode}|${Math.floor(s.power)}|${Object.values(s.resources).map(v=>Math.floor(v)).join(',')}|${s.construction?.id}:${s.construction?.finishAt}|${s.researchJob?.id}:${s.researchJob?.finishAt}|${w.marches.length}|${w.trainingJob?.type}:${w.trainingJob?.finishAt}|${f}`
  this.paintTop();this.paintObjective();this.paintQueue();this.paintLocks();this.paintModes();this.mount.dataset.mode=this.game.mode
  if(this.detail.visible&&this.selectedBuilding)this.renderBuilding(this.selectedBuilding)
  if(this.researchPanel.visible)this.renderResearch()
  if(this.worldPanel.visible&&this.selectedWorld)this.renderWorldPanel(this.selectedWorld)
  if(this.armyPanel.visible)this.renderArmy()
  this.lastKey=key
 }
 paintTop(){const s=this.game.state,container=this.$('#resources');this.$('#powerValue').textContent=`⚡ ${short(s.power)} POWER`;container.innerHTML=Object.entries(RESOURCES).map(([k,r])=>`<div class="resource-pill ${k}"><b>${resourceIcon[k]}</b><span><strong>${short(s.resources[k])}</strong><small>${r.short}</small></span></div>`).join('')}
 paintModes(){this.$('#cityMode').classList.toggle('active',this.game.mode==='city');this.$('#worldMode').classList.toggle('active',this.game.mode==='world');this.$('#navCity').classList.toggle('active',this.game.mode==='city');this.$('#navWorld').classList.toggle('active',this.game.mode==='world')}
 paintLocks(){const f=this.game.state.buildings.furnace??1;for(const id of ['world','army','research','alliance'])this.setLocked(`#nav${id[0].toUpperCase()+id.slice(1)}`,f<(SYSTEM_UNLOCKS[id]??1),SYSTEM_UNLOCKS[id])}
 paintObjective(){const s=this.game.state,chapter=currentChapter(s);let title,task,sub,p=0
  if(chapter){const st=chapterStatus(s,chapter);title=chapter.title;task=st.done?'Chapter complete — claim reward':`${BUILDINGS[st.next[0]].name} → Lv.${st.next[1]}`;sub=st.done?'Tap to claim':`${st.complete}/${st.total} objectives · tap to locate`;p=st.total?st.complete/st.total:0}
  else{const w=s.world;if(w.scouted.length<12){title='FRONTIER';task='Scout the frozen frontier';sub=`${w.scouted.length}/12 territories revealed`;p=w.scouted.length/12}else if(w.owned.length<5){title='EXPANSION';task='Secure connected territory';sub=`${w.owned.length}/5 territories controlled`;p=w.owned.length/5}else if(w.defeated.length<1){title='WAR';task='Destroy a raider camp';sub=`Army power ${fmt(this.game.armyPower())}`;p=.35}else{title='DOMINION';task='Exploit, expand and defeat rival cities';sub=`${w.owned.length} territories · ${w.defeated.length} camps defeated`;p=.7}}
  this.$('#objective').innerHTML=`<div class="objective-icon">✦</div><div><small>${esc(title)}</small><b>${esc(task)}</b><span>${esc(sub)}</span>${progress(p)}</div><em>›</em>`
 }
 objectiveAction(){const chapter=currentChapter(this.game.state);if(chapter){const st=chapterStatus(this.game.state,chapter);if(st.done)this.game.claimChapter(chapter);else if(st.next)this.game.focusBuilding(st.next[0]);return}this.requireSystem('world')&&this.game.showWorld()}
 paintQueue(){const s=this.game.state,w=s.world,c=s.construction,r=s.researchJob,t=w.trainingJob,m=w.marches[0];let rows=[]
  if(c){const total=Math.max(1,c.finishAt-c.startedAt),p=1-(c.finishAt-Date.now())/total;rows.push(`<div><i>🔨</i><span><b>${BUILDINGS[c.id]?.name??'Construction'} Lv.${c.target}</b><small>${time(c.finishAt-Date.now())}</small>${progress(p)}</span></div>`)}
  if(r){const total=Math.max(1,r.finishAt-r.startedAt),p=1-(r.finishAt-Date.now())/total;rows.push(`<div><i>⌬</i><span><b>${findResearch(r.id)?.name??r.id} Lv.${r.target}</b><small>${time(r.finishAt-Date.now())}</small>${progress(p)}</span></div>`)}
  if(t){const total=Math.max(1,t.finishAt-t.startedAt),p=1-(t.finishAt-Date.now())/total;rows.push(`<div><i>⚔</i><span><b>Training ${t.amount} ${t.type}</b><small>${time(t.finishAt-Date.now())}</small>${progress(p)}</span></div>`)}
  if(m){const end=m.phase==='gathering'?m.gatherDoneAt:m.arriveAt;rows.push(`<div><i>➤</i><span><b>${m.type.toUpperCase()} · ${m.target}</b><small>${time(end-Date.now())}</small></span></div>`)}
  if(!rows.length)rows=[`<div class="idle"><i>✓</i><span><b>Settlement ready</b><small>Builder and command queues idle</small></span></div>`]
  this.$('#queueCard').innerHTML=rows.slice(0,2).join('')
 }
 showToast(msg){const t=this.$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(this.toastHide);this.toastHide=setTimeout(()=>t.classList.remove('show'),1900)}
 layout(){}
 hideSheets(){this.detail.visible=false;this.researchPanel.visible=false;this.worldPanel.visible=false;this.armyPanel.visible=false;this.selectedBuilding=null;this.selectedWorld=null;this.$('#sheetWrap').classList.remove('open')}
 openSheet(html,kind=''){const w=this.$('#sheetWrap'),s=this.$('#sheet');s.className=`sheet ${kind}`;s.innerHTML=html;w.classList.add('open')}
 showBuilding(id){this.hideSheets();this.selectedBuilding=id;this.detail.visible=true;this.renderBuilding(id)}
 showWorldTile(id){this.hideSheets();this.selectedWorld=id;this.worldPanel.visible=true;this.renderWorldPanel(id)}
 showProfile(){const s=this.game.state,w=s.world;this.openSheet(`<div class="sheet-head"><div class="sheet-icon">R</div><div><small>SETTLEMENT</small><h2>EMBERFALL</h2><p>Furnace ${s.buildings.furnace} · ${furnaceTier(s.buildings.furnace)}</p></div><button data-action="close">×</button></div><div class="stat-grid"><div><small>Total power</small><b>${fmt(s.power)}</b></div><div><small>Army power</small><b>${fmt(this.game.armyPower())}</b></div><div><small>Territories</small><b>${w.owned.length}</b></div><div><small>Commander</small><b>${esc(this.game.commanderName())}</b></div></div><button class="danger ghost" data-action="reset">RESET LOCAL SAVE</button>`,'profile-sheet')}
 renderBuilding(id){
  const s=this.game.state,d=BUILDINGS[id],lvl=s.buildings[id]??0,target=nextBuildingLevel(s,id),spec=d.levels[target],req=spec?buildingRequirements(s,id,target):[],role=id==='furnace'?'The settlement core. Its heat and level gate the entire city.':buildingRole(id),effects=lvl?buildingEffectLines(id,lvl):[],nextEffects=spec&&id!=='furnace'?buildingEffectLines(id,target):[],icon=buildingIcon[id]??'◇'
  let body=`<div class="sheet-head"><div class="sheet-icon building">${icon}</div><div><small>${categoryLabel[d.category]??d.category}</small><h2>${esc(d.name)}</h2><p>${id==='furnace'?`${furnaceTier(lvl)} · `:''}Level ${lvl}${id==='furnace'?`/${FURNACE_MAX_LEVEL}`:''}</p></div><button data-action="close">×</button></div><p class="role">${esc(role)}</p>`
  if(effects.length)body+=`<div class="effect-list">${effects.map(x=>`<div><span>${esc(x)}</span><b>ACTIVE</b></div>`).join('')}</div>`
  if(id==='furnace'){const unlock=nextFurnaceUnlock(lvl);if(unlock)body+=`<div class="unlock-banner"><small>NEXT MAJOR UNLOCK · FURNACE ${unlock.level}</small><b>${esc(unlock.items.join(' · '))}</b></div>`}
  if(spec){const duration=spec.seconds*1000/DEMO_SPEED;body+=`<section class="upgrade-card"><div class="upgrade-title"><span>UPGRADE TO LEVEL ${target}</span><b>+${fmt(spec.power)} POWER</b></div>${nextEffects.length?`<div class="next-effects">${nextEffects.map(x=>`<span>↑ ${esc(x)}</span>`).join('')}</div>`:''}<div class="cost-row">${costLine(spec.cost)}</div><div class="time-row"><span>⏱ ${time(duration)}</span><span>${req.length?`⚠ ${esc(req.join(' · '))}`:'✓ Requirements met'}</span></div></section>`
   const locator=this.locateRequirement(id,target);if(locator)body+=`<button class="secondary full" data-action="locate" data-id="${locator}">LOCATE ${esc(BUILDINGS[locator].name).toUpperCase()}</button>`
   if(d.production&&lvl&&this.game.isCollectReady(id))body+=`<button class="collect full" data-action="collect" data-id="${id}">COLLECT ${RESOURCES[d.production.resource].short}</button>`
   body+=`<button class="primary full" data-action="upgrade" data-id="${id}" ${s.construction?'disabled':''}>${s.construction?`BUILDER BUSY · ${esc(BUILDINGS[s.construction.id]?.name??'')}`:(lvl?'UPGRADE':'CONSTRUCT')}</button>`
  }else body+=`<div class="maxed">MAXIMUM LEVEL REACHED</div>`
  this.openSheet(body,'building-sheet')
 }
 locateRequirement(id,target){const d=BUILDINGS[id];if(d.unlockFurnace&&(this.game.state.buildings.furnace??0)<d.unlockFurnace)return'furnace';if(d.gate&&id!=='furnace'&&target>(this.game.state.buildings.furnace??0))return'furnace';for(const [other,lvl] of(d.requires?.[target]??[]))if((this.game.state.buildings[other]??0)<lvl)return other;return null}
 openResearch(){this.hideSheets();this.researchPanel.visible=true;this.renderResearch()}
 renderResearch(){const s=this.game.state,center=s.buildings.researchCenter??0;if(center<1){this.openSheet(`<div class="sheet-head"><div class="sheet-icon">⌬</div><div><small>TECHNOLOGY</small><h2>Research Center locked</h2><p>Build Research Center at Furnace 9</p></div><button data-action="close">×</button></div><button class="secondary full" data-action="locate" data-id="researchCenter">LOCATE RESEARCH CENTER</button>`,'research-sheet');return}
  let html=`<div class="sheet-head"><div class="sheet-icon">⌬</div><div><small>TECHNOLOGY</small><h2>Research</h2><p>Center Lv.${center}${s.researchJob?' · Research in progress':''}</p></div><button data-action="close">×</button></div><div class="tech-tabs">Growth · Economy · Battle</div><div class="tech-list">`
  for(const [branch,b] of Object.entries(RESEARCH)){html+=`<h3>${esc(b.label)}</h3>`;for(const [id,d] of Object.entries(b.items)){const lvl=s.research[id]??0,target=lvl+1,maxed=lvl>=d.max,cost=maxed?null:researchCost(d,target),locked=d.requires.some(([dep,n])=>(s.research[dep]??0)<n);html+=`<div class="tech-item ${locked?'locked-tech':''}"><div><b>${esc(d.name)}</b><small>${branch.toUpperCase()} · Lv.${lvl}/${d.max}</small></div><div class="tech-action">${maxed?'<em>MAX</em>':`<span>${costLine(cost)}</span><button data-action="research-start" data-id="${id}" ${locked||s.researchJob?'disabled':''}>${locked?'LOCKED':'RESEARCH'}</button>`}</div></div>`}}
  html+=`</div>`;this.openSheet(html,'research-sheet')
 }
 openArmy(){this.hideSheets();this.armyPanel.visible=true;this.renderArmy()}
 renderArmy(){const s=this.game.state,w=s.world,heroId=this.game.selectedHeroId(),hero=HEROES[heroId],hs=w.heroes?.[heroId]??{level:1,xp:0},free=this.game.freeTroops(),job=w.trainingJob,report=w.battleReports?.[0];let html=`<div class="sheet-head"><div class="sheet-icon">⚔</div><div><small>WAR COUNCIL</small><h2>Army Command</h2><p>${fmt(this.game.armyPower())} power · ${w.marches.length}/${this.game.marchCapacity()} marches</p></div><button data-action="close">×</button></div><div class="commander-card"><div class="portrait">${esc(hero?.name?.[0]??'C')}</div><div><small>COMMANDER</small><b>${esc(hero?.name??'Commander')} · Lv.${hs.level}</b><span>${esc(hero?.role??'')} · XP ${fmt(hs.xp)}/${fmt(heroXpToNext(hs.level))}</span></div><button data-action="hero">CHANGE</button></div><div class="formation-row"><span>Formation <b>${esc(FORMATIONS[w.formation]?.name??'Balanced')}</b></span><button data-action="formation">CHANGE</button></div><div class="troop-grid">`
  for(const [type,camp] of Object.entries({infantry:'infantryCamp',lancer:'lancerCamp',marksman:'marksmanCamp'})){const level=s.buildings[camp]??0;html+=`<div class="troop-card"><small>${esc(type.toUpperCase())}</small><b>${fmt(w.troops[type]??0)}</b><span>${fmt(free[type]??0)} free · Camp Lv.${level}</span><button data-action="train" data-id="${type}" ${level<1||job?'disabled':''}>${job?.type===type?`TRAINING ${time(job.finishAt-Date.now())}`:'TRAIN'}</button></div>`}
  html+=`</div>`;if(report)html+=`<div class="battle-report ${report.win?'win':'loss'}"><small>LATEST BATTLE</small><b>${report.win?'VICTORY':'DEFEAT'} · ${esc(report.name??report.target)}</b><span>Power ${fmt(report.power)} vs ${fmt(report.enemy)} · ${report.losses} casualties</span></div>`;this.openSheet(html,'army-sheet')
 }
 renderWorldPanel(id){if(!id)return;const [x,y]=parseTile(id),d=worldTile(x,y),w=this.game.state.world,scouted=w.scouted.includes(id),owned=w.owned.includes(id),march=this.game.activeMarchFor(id),faction=d.faction?FACTIONS[d.faction]:null;let html=`<div class="sheet-head"><div class="sheet-icon world">${d.kind==='settlement'?'♜':d.kind==='camp'?'☠':d.kind==='resource'?resourceIcon[d.resource]:'◎'}</div><div><small>${esc(d.region?.name??'FRONTIER')} · ${esc(d.kind.toUpperCase())}</small><h2>${esc(scouted?d.name:'Uncharted territory')}</h2><p>Tile ${id}${faction?` · [${d.faction}] ${esc(faction.name)}`:''}</p></div><button data-action="close">×</button></div>`
  if(!scouted){html+=`<div class="intel-card"><small>FOG OF WAR</small><b>Send scouts to reveal terrain, threats and resources.</b></div>`;const can=adjacentTo(id,w.scouted);html+=`<button class="primary full" data-action="scout" data-id="${id}" ${!can||march?'disabled':''}>${march?'SCOUT EN ROUTE':can?'SCOUT TERRITORY':'OUT OF SCOUT RANGE'}</button>`;this.openSheet(html,'world-sheet');return}
  if(d.kind==='resource')html+=`<div class="intel-card"><small>RESOURCE NODE · LEVEL ${d.level}</small><b>${esc(d.resource.toUpperCase())} yield ${fmt(d.yield)}</b><span>${owned?'Controlled territory':'Occupy this tile before gathering'}</span></div>`
  if(d.kind==='camp'||d.kind==='settlement')html+=`<div class="intel-card danger"><small>${d.kind==='settlement'?'RIVAL CITY':'HOSTILE FORCE'} · LEVEL ${d.level}</small><b>Enemy power ${fmt(d.strength)}</b><span>Your available march power ${fmt(this.game.freeArmyPower())}</span></div>`
  if(d.kind==='wild')html+=`<div class="intel-card"><small>TERRAIN · LEVEL ${d.level}</small><b>${esc(d.terrain??d.name)}</b><span>${owned?'Under Emberfall control':'Unclaimed territory'}</span></div>`
  if(march)html+=`<div class="march-banner"><b>${march.type.toUpperCase()} MARCH</b><span>${esc(march.phase)} · ${time((march.phase==='gathering'?march.gatherDoneAt:march.arriveAt)-Date.now())}</span></div>`
  const adjacent=adjacentTo(id,w.owned);if(!owned&&!['camp','settlement'].includes(d.kind))html+=`<button class="primary full" data-action="claim" data-id="${id}" ${!adjacent||march?'disabled':''}>${adjacent?'OCCUPY TERRITORY':'NOT CONNECTED TO YOUR BORDER'}</button>`
  if(owned&&d.kind==='resource')html+=`<button class="collect full" data-action="gather" data-id="${id}" ${!this.game.worldNodeReady(id)||march?'disabled':''}>${this.game.worldNodeReady(id)?'GATHER RESOURCE':'NODE DEPLETED'}</button>`
  if(['camp','settlement'].includes(d.kind)&&adjacent){html+=`<div class="action-split"><button class="danger" data-action="attack" data-id="${id}" ${march?'disabled':''}>ATTACK</button><button class="secondary" data-action="rally" data-id="${id}" ${march||w.rally?'disabled':''}>RALLY</button></div>`}
  this.openSheet(html,'world-sheet')
 }
}
