import * as THREE from 'three'
import { Retro4XGame } from './Retro4XGame.js'
import { GameUI } from './ui.js'
import { BUILDINGS } from '../data/buildings.js'
import { RESEARCH,findResearch,researchCost } from '../data/research.js'
import { currentChapter,chapterStatus } from '../data/chapters.js'
import { worldTile,parseTile,adjacentTo } from '../data/world.js'
import { HEROES,FORMATIONS,heroPower,heroMultiplier,formationMultiplier } from '../data/heroes.js'
import { researchCenterRequired,researchDurationMs,researchRequirements } from '../systems/research.js'
import { buildingPosition } from './cityFactory.js'
import { saveState } from '../systems/state.js'

const TROOP_BASE={infantry:7,lancer:8,marksman:9}
const LOAD={infantry:40,lancer:55,marksman:35}
const ACTION_COST=(type,d)=>type==='scout'?{meat:25,wood:15}:type==='claim'?{wood:60,coal:20,iron:4}:type==='gather'?{meat:12}:type==='attack'?{meat:Math.ceil((d.strength??0)*.08)}:{}
const has=(r,c)=>Object.entries(c).every(([k,v])=>(r[k]??0)>=v)
const spend=(r,c)=>Object.entries(c).forEach(([k,v])=>r[k]-=v)
const count=t=>Object.values(t??{}).reduce((a,b)=>a+(Number(b)||0),0)
const short=n=>{const v=Math.floor(Number(n)||0);return v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(1)}K`:`${v}`}
const clock=ms=>{let s=Math.max(0,Math.ceil(ms/1000));if(s<60)return`${s}s`;const m=Math.floor(s/60);s%=60;return`${m}m ${s}s`}
const costHtml=c=>Object.entries(c??{}).filter(([,v])=>v>0).map(([k,v])=>`<span class="cost ${k}">${k.toUpperCase()} ${short(v)}</span>`).join('')
const bonusLabel=(def,lvl)=>Object.entries(def.bonus??{}).map(([k,v])=>`${k.replace(/([A-Z])/g,' $1').replace(/^./,x=>x.toUpperCase())} +${Math.round(v*lvl*100)}%`).join(' · ')
const tap=(el,fn)=>{if(!el)return;const run=e=>{e.preventDefault();e.stopPropagation();fn(e)};el.addEventListener('pointerup',run,{passive:false})}

Retro4XGame.prototype.nodeAvailable=function(id){
 const d=worldTile(...parseTile(id)),w=this.state.world;if(d.kind!=='resource')return 0
 w.nodeRemaining??={};w.nodeReady??={};let value=w.nodeRemaining[id]
 if(value==null)value=d.yield
 if(value<=0&&Date.now()>=(w.nodeReady[id]??0)){value=d.yield;w.nodeRemaining[id]=value;delete w.nodeReady[id]}
 return Math.max(0,Math.round(value))
}
Retro4XGame.prototype.marchLoad=function(t){return Object.entries(LOAD).reduce((a,[k,v])=>a+(Number(t?.[k])||0)*v,0)}
Retro4XGame.prototype.detachmentPower=function(t,hero=this.state.world.selectedHero??'astrid',formation=this.state.world.formation??'balanced'){
 let troopPower=0
 for(const [k,base] of Object.entries(TROOP_BASE)){const tier=this.trainingTier?.(k)??1;troopPower+=(Number(t?.[k])||0)*base*(1+(tier-1)*.28)}
 const raw=troopPower+heroPower(this.state,hero)
 return Math.round(raw*heroMultiplier(this.state,hero,t)*formationMultiplier(this.state,formation,t)*(1+(this.state.research?.infantry??0)*.01+(this.state.research?.command??0)*.015))
}
Retro4XGame.prototype.marchStats=function(type,id,t,hero=this.state.world.selectedHero??'astrid',formation=this.state.world.formation??'balanced'){
 const d=worldTile(...parseTile(id)),travel=this.travelMs(id),load=this.marchLoad(t),available=d.kind==='resource'?this.nodeAvailable(id):0
 const cargo=type==='gather'?Math.min(available,load):0,gatherMs=type==='gather'?Math.max(2400,1800+cargo*5):0
 return{size:count(t),power:this.detachmentPower(t,hero,formation),load,travel,cargo,gatherMs,totalTrip:type==='gather'?travel*2+gatherMs:travel*2}
}
Retro4XGame.prototype.dispatchConfigured=function(type,id,troops,hero,formation){
 const w=this.state.world,d=worldTile(...parseTile(id)),free=this.freeTroops(),clean={infantry:0,lancer:0,marksman:0}
 for(const k of Object.keys(clean)){clean[k]=Math.max(0,Math.floor(Number(troops?.[k])||0));if(clean[k]>(free[k]??0)){this.ui.toast(`Not enough free ${k}`);return false}}
 if(count(clean)<1){this.ui.toast('Select at least one troop');return false}
 if(w.marches.length>=this.marchCapacity()){this.ui.toast('All march queues are busy');return false}
 if(w.marches.some(m=>m.target===id)){this.ui.toast('A march is already moving there');return false}
 const cost=ACTION_COST(type,d);if(!has(this.state.resources,cost)){this.ui.toast('Not enough resources');return false}
 const stats=this.marchStats(type,id,clean,hero,formation);if(type==='attack'&&stats.power<(d.strength??0)){this.ui.toast(`March power ${short(stats.power)} is below enemy ${short(d.strength)}`);return false}
 if(type==='gather'&&stats.cargo<1){this.ui.toast('Resource node is empty');return false}
 spend(this.state.resources,cost);w.selectedHero=hero;w.formation=formation
 const now=Date.now();w.marches.push({id:`m${now}${Math.floor(Math.random()*99)}`,type,target:id,phase:'outbound',phaseStartedAt:now,arriveAt:now+stats.travel,travelMs:stats.travel,troops:clean,hero,formation,expectedCargo:stats.cargo,gatherMs:stats.gatherMs,cargo:null})
 saveState(this.state);this.world.refreshMarches();this.ui.refresh();this.ui.toast(`${type.toUpperCase()} march dispatched`);return true
}
const oldTickMarches=Retro4XGame.prototype.tickMarches
Retro4XGame.prototype.tickMarches=function(now){
 const w=this.state.world;w.nodeRemaining??={};w.nodeReady??={};let changed=false
 for(const m of w.marches??[]){
  if(m.phase==='outbound'&&now>=m.arriveAt){
   if(m.type==='gather'){m.phase='gathering';m.phaseStartedAt=now;m.gatherDoneAt=now+(m.gatherMs??5000);changed=true}
   else{this.finishOutbound(m,now);changed=true}
  }else if(m.phase==='gathering'&&now>=m.gatherDoneAt){
   const d=worldTile(...parseTile(m.target)),available=this.nodeAvailable(m.target),amount=Math.min(available,m.expectedCargo??this.marchLoad(m.troops))
   w.nodeRemaining[m.target]=Math.max(0,available-amount);if(w.nodeRemaining[m.target]<=0)w.nodeReady[m.target]=now+30000
   m.cargo={resource:d.resource,amount};m.phase='returning';m.phaseStartedAt=now;m.arriveAt=now+m.travelMs;changed=true
  }
 }
 const keep=[]
 for(const m of w.marches??[]){if(m.phase==='returning'&&now>=m.arriveAt){if(m.cargo?.amount){this.state.resources[m.cargo.resource]=(this.state.resources[m.cargo.resource]??0)+m.cargo.amount;this.ui.toast(`+${short(m.cargo.amount)} ${m.cargo.resource.toUpperCase()} delivered`)}changed=true}else keep.push(m)}
 if(keep.length!==(w.marches??[]).length)w.marches=keep;if(changed)this.world.refresh();return changed
}

GameUI.prototype.openMarchSetup=function(type,id){
 const d=worldTile(...parseTile(id)),free=this.game.freeTroops(),auto=this.game.detachment(type==='attack'?'attack':'gather'),selected={infantry:Math.min(free.infantry??0,auto.infantry??Math.min(8,free.infantry??0)),lancer:type==='attack'?Math.min(free.lancer??0,auto.lancer??0):0,marksman:type==='attack'?Math.min(free.marksman??0,auto.marksman??0):0}
 let hero=this.game.state.world.selectedHero??'astrid',formation=this.game.state.world.formation??'balanced'
 const rows=Object.keys(selected).map(k=>`<div class="troop-picker"><div><b>${k.toUpperCase()} · T${this.game.trainingTier?.(k)??1}</b><small><span data-count="${k}">${selected[k]}</span> / ${free[k]??0} free</small></div><input data-troop="${k}" type="range" min="0" max="${free[k]??0}" value="${selected[k]}"></div>`).join('')
 this.openSheet(`<header><div><small>MARCH SETUP · ${type.toUpperCase()}</small><h2>${d.name}</h2><p>Choose the army before dispatch</p></div><button data-close>×</button></header><div class="sheet-body march-setup">
 <div class="march-selects"><label>COMMANDER<select id="march-hero">${Object.entries(HEROES).map(([k,v])=>`<option value="${k}" ${k===hero?'selected':''}>${v.name} · ${v.role}</option>`).join('')}</select></label><label>FORMATION<select id="march-formation">${Object.entries(FORMATIONS).map(([k,v])=>`<option value="${k}" ${k===formation?'selected':''}>${v.name}</option>`).join('')}</select></label></div>
 ${rows}<div id="march-stats" class="stat-grid"></div><div class="costs">${costHtml(ACTION_COST(type,d))}</div><button id="dispatch-march" class="primary">DISPATCH MARCH</button></div>`)
 const statsEl=this.root.querySelector('#march-stats'),paint=()=>{const s=this.game.marchStats(type,id,selected,hero,formation),extra=type==='gather'?`<div class="stat"><small>NODE AVAILABLE</small><b>${short(this.game.nodeAvailable(id))} ${d.resource.toUpperCase()}</b></div><div class="stat"><small>EXPECTED CARGO</small><b>${short(s.cargo)} / ${short(s.load)}</b></div><div class="stat"><small>GATHER</small><b>${clock(s.gatherMs)}</b></div>`:type==='attack'?`<div class="stat"><small>ENEMY POWER</small><b>${short(d.strength)}</b></div>`:'';statsEl.innerHTML=`<div class="stat"><small>MARCH SIZE</small><b>${s.size} troops</b></div><div class="stat"><small>MARCH POWER</small><b>${short(s.power)}</b></div><div class="stat"><small>ONE-WAY ETA</small><b>${clock(s.travel)}</b></div><div class="stat"><small>LOAD</small><b>${short(s.load)}</b></div>${extra}`}
 this.root.querySelectorAll('[data-troop]').forEach(input=>input.addEventListener('input',()=>{selected[input.dataset.troop]=Number(input.value);this.root.querySelector(`[data-count="${input.dataset.troop}"]`).textContent=input.value;paint()}))
 this.root.querySelector('#march-hero').addEventListener('change',e=>{hero=e.target.value;paint()});this.root.querySelector('#march-formation').addEventListener('change',e=>{formation=e.target.value;paint()});paint()
 tap(this.root.querySelector('#dispatch-march'),()=>{if(this.game.dispatchConfigured(type,id,selected,hero,formation))this.hideSheet()})
}
GameUI.prototype.openWorldTile=function(id){
 const [x,y]=parseTile(id),d=worldTile(x,y),w=this.game.state.world,scouted=w.scouted.includes(id),owned=w.owned.includes(id),ready=Math.max(0,(w.nodeReady?.[id]??0)-Date.now())
 let type=null,label='',details=''
 if(!scouted&&adjacentTo(id,w.scouted)){type='scout';label='SET SCOUT MARCH'}
 else if(scouted&&!owned&&!['camp','settlement'].includes(d.kind)&&adjacentTo(id,w.owned)){type='claim';label='SET OCCUPATION MARCH'}
 else if(scouted&&d.kind==='resource'&&owned){type='gather';label='SET GATHER MARCH';details=`<div class="stat-grid"><div class="stat"><small>AVAILABLE</small><b>${short(this.game.nodeAvailable(id))} ${d.resource.toUpperCase()}</b></div><div class="stat"><small>NODE CAPACITY</small><b>${short(d.yield)}</b></div><div class="stat"><small>LEVEL</small><b>${d.level}</b></div><div class="stat"><small>REFRESH</small><b>${ready?clock(ready):'READY'}</b></div></div>`}
 else if(scouted&&['camp','settlement'].includes(d.kind)){type='attack';label='SET ATTACK MARCH';details=`<div class="stat-grid"><div class="stat"><small>ENEMY POWER</small><b>${short(d.strength)}</b></div><div class="stat"><small>LEVEL</small><b>${d.level??1}</b></div></div>${d.reward?`<h3>BATTLE REWARD</h3><div class="costs">${costHtml(d.reward)}</div>`:''}`}
 this.openSheet(`<header><div><small>${d.region.toUpperCase()}</small><h2>${scouted?d.name:'Unknown territory'}</h2><p>${scouted?`Level ${d.level??1} · ${d.kind}`:'Fog of war'}</p></div><button data-close>×</button></header><div class="sheet-body">${details}${type?`<button id="prepare-march" class="primary">${label}</button>`:'<p>Secure adjacent territory to interact.</p>'}</div>`)
 tap(this.root.querySelector('#prepare-march'),()=>this.openMarchSetup(type,id))
}

GameUI.prototype.openMission=function(){
 const ch=currentChapter(this.game.state)
 if(!ch){const w=this.game.state.world;this.openSheet(`<header><div><small>DOMINION</small><h2>Frontier campaign</h2><p>Expand beyond the settlement</p></div><button data-close>×</button></header><div class="sheet-body"><div class="objective-row"><span><b>Explore</b><small>Scout 12 territories</small></span><em>${Math.min(12,w.scouted.length)}/12</em></div><div class="objective-row"><span><b>Expand</b><small>Control 5 territories</small></span><em>${Math.min(5,w.owned.length)}/5</em></div><div class="objective-row"><span><b>Exterminate</b><small>Defeat a raider camp</small></span><em>${Math.min(1,w.defeated.length)}/1</em></div><button id="mission-world" class="primary">OPEN WORLD</button></div>`);tap(this.root.querySelector('#mission-world'),()=>{this.hideSheet();this.game.setMode('world')});return}
 const st=chapterStatus(this.game.state,ch)
 this.openSheet(`<header><div><small>SETTLEMENT CAMPAIGN</small><h2>${ch.title.replace(/^CHAPTER \d+ · /,'')}</h2><p>${st.complete}/${st.total} objectives complete</p></div><button data-close>×</button></header><div class="sheet-body"><h3>OBJECTIVES</h3>${ch.tasks.map(([id,lvl])=>{const cur=this.game.state.buildings[id]??0,done=cur>=lvl;return`<div class="objective-row ${done?'done':''}"><span><b>${done?'✓ ':''}${BUILDINGS[id].name} → Lv. ${lvl}</b><small>Current level ${cur}</small></span>${done?'<em>DONE</em>':`<button data-go="${id}">GO</button>`}</div>`}).join('')}<h3>CHAPTER REWARD</h3><div class="reward-box">${costHtml(ch.reward)}</div>${st.done?'<button id="claim-mission" class="primary">CLAIM REWARD</button>':'<p class="mission-hint">Complete every objective to claim the reward.</p>'}</div>`)
 this.root.querySelectorAll('[data-go]').forEach(b=>tap(b,()=>{this.hideSheet();this.game.focusBuilding(b.dataset.go)}));tap(this.root.querySelector('#claim-mission'),()=>{this.game.claimChapter(ch);this.hideSheet()})
}
GameUI.prototype.questAction=function(){this.openMission()}
GameUI.prototype.refreshQuest=function(){
 const q=this.root.querySelector('#quest'),ch=currentChapter(this.game.state)
 if(ch){const st=chapterStatus(this.game.state,ch);q.innerHTML=`<i>✦</i><div><strong>${ch.title}</strong><b>${st.done?'Reward ready':`${BUILDINGS[st.next?.[0]]?.name??'Settlement'} → Lv. ${st.next?.[1]??''}`}</b><small>${st.complete}/${st.total} objectives · tap for rewards</small></div><em>›</em>`;return}
 const w=this.game.state.world;q.innerHTML=`<i>✦</i><div><strong>DOMINION</strong><b>${w.scouted.length<12?'Explore the frontier':w.owned.length<5?'Expand your territory':w.defeated.length<1?'Defeat a raider camp':'Exploit, expand and defeat rival cities'}</b><small>${w.owned.length} territories · ${w.defeated.length} camps defeated</small></div><em>›</em>`
}

GameUI.prototype.openTech=function(){
 const s=this.game.state,branchHtml=Object.entries(RESEARCH).map(([,branch])=>`<section class="tech-branch"><h3>${branch.label.toUpperCase()}</h3>${Object.entries(branch.items).map(([id,d])=>{const lvl=s.research[id]??0,target=lvl+1,max=lvl>=d.max,cost=max?{}:researchCost(d,target),req=max?[]:researchRequirements(s,d,target),center=max?researchCenterRequired(d.max):researchCenterRequired(target),duration=max?0:researchDurationMs(s,d,target);return`<div class="tech-card ${req.length?'locked':''}"><div class="tech-title"><span><b>${d.name}</b><small>Lv. ${lvl}/${d.max}</small></span><em>${max?'MAX':clock(duration)}</em></div><p>${lvl?`Current: ${bonusLabel(d,lvl)}`:'No bonus researched yet.'}</p>${!max?`<p class="next-bonus">Next: ${bonusLabel(d,target)}</p><div class="costs">${costHtml(cost)}</div><div class="req-list"><small>REQUIRES</small><b>${req.length?req.join(' · '):`Research Center ${center} ✓`}</b></div><button data-research="${id}" ${req.length||s.researchJob?'disabled':''}>${req.length?'LOCKED':s.researchJob?'QUEUE BUSY':'RESEARCH'}</button>`:''}</div>`}).join('')}</section>`).join('')
 this.openSheet(`<header><div><small>SCIENCE</small><h2>Research</h2><p>Research Center Lv. ${s.buildings.researchCenter??0}${s.researchJob?' · queue active':' · queue idle'}</p></div><button data-close>×</button></header><div class="sheet-body tech-tree">${branchHtml}</div>`)
 this.root.querySelectorAll('[data-research]').forEach(b=>tap(b,()=>{this.game.research(b.dataset.research);this.openTech()}))
}

const oldRefresh=GameUI.prototype.refresh
GameUI.prototype.refresh=function(){
 oldRefresh.call(this)
 let timer=this.root.querySelector('#building-timer');if(!timer){timer=document.createElement('div');timer.id='building-timer';timer.className='building-timer hidden';this.root.appendChild(timer)}
 const c=this.game.state.construction
 if(!c||this.game.mode!=='city'){timer.classList.add('hidden');return}
 const p=buildingPosition(c.id).clone();p.y=3.4;p.project(this.game.camera);const x=(p.x*.5+.5)*innerWidth,y=(-p.y*.5+.5)*innerHeight
 timer.style.left=`${Math.max(75,Math.min(innerWidth-75,x))}px`;timer.style.top=`${Math.max(190,Math.min(innerHeight-150,y))}px`;timer.innerHTML=`<b>🔨 ${BUILDINGS[c.id].name} · Lv.${c.target}</b><small>${clock(c.finishAt-Date.now())}</small>`;timer.classList.remove('hidden')
}
