import { GameUI } from './ui.js'
import { BUILDINGS,RESOURCES } from '../data/buildings.js'
import { currentChapter,chapterStatus } from '../data/chapters.js'
import { fourXFlow,FOUR_X_STEPS } from './fourXFlow.js'

const short=n=>{const v=Math.floor(Number(n)||0);return v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(1)}K`:`${v}`}
const costHtml=c=>Object.entries(c??{}).map(([k,v])=>`<span class="cost ${k}"><i>${RESOURCES[k]?.icon??'•'}</i>${short(v)} ${RESOURCES[k]?.short??k}</span>`).join('')

export class GameUI4X extends GameUI{
 renderShell(){this.root.innerHTML=`
  <div class="topbar fourx-topbar">
   <div class="profile"><b>A</b><div><strong>ACHU</strong><small id="power"></small></div></div>
   <div id="resources" class="resources"></div>
  </div>
  <div id="phase-rail" class="phase-rail"></div>
  <button id="quest" class="quest-card fourx-quest"></button>
  <div id="mode-tag" class="mode-tag">THE CITY</div>
  <button id="update-app" class="update-app">SYNC</button>
  <div id="queue" class="queue-card"></div>
  <div id="toast" class="toast"></div>
  <div id="sheet" class="sheet hidden"></div>
  <nav class="bottom-nav fourx-nav">
   <button data-mode="world"><span>⌖</span><b>CITY</b></button>
   <button data-mode="city"><span>⌂</span><b>BASE</b></button>
   <button data-action="army"><span>◉</span><b>CREWS</b></button>
   <button data-action="tech"><span>✦</span><b>SYSTEMS</b></button>
   <button data-action="more"><span>•••</span><b>MORE</b></button>
  </nav>`
 }
 bind(){
  this.root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>this.game.setMode(b.dataset.mode))
  this.root.querySelector('[data-action="army"]').onclick=()=>this.openArmy()
  this.root.querySelector('[data-action="tech"]').onclick=()=>this.openTech()
  this.root.querySelector('[data-action="more"]').onclick=()=>this.openMore()
  this.root.querySelector('#quest').onclick=()=>this.questAction()
  this.root.querySelector('#update-app').onclick=()=>window.appUpdater?.checkAndApply?.()
 }
 refresh(){super.refresh();this.refreshPhaseRail()}
 refreshPhaseRail(){
  const el=this.root.querySelector('#phase-rail');if(!el)return
  const flow=fourXFlow(this.game.state)
  el.innerHTML=FOUR_X_STEPS.map((s,i)=>`<button class="${i===flow.index?'active':''} ${i<flow.index?'done':''}" data-fourx="${s.key}"><i>${i<flow.index?'✓':i+1}</i><span><b>${s.label}</b><small>${s.copy}</small></span></button>`).join('')
  el.querySelectorAll('[data-fourx]').forEach(b=>b.onclick=()=>{this.game.setMode('world');this.openCityBriefing()})
 }
 refreshQuest(){
  const q=this.root.querySelector('#quest')
  if(this.game.mode==='world'){
   const f=fourXFlow(this.game.state)
   q.innerHTML=`<i>${f.index+1}</i><div><strong>${f.eyebrow}</strong><b>${f.title}</b><small>${f.copy}</small><span>${f.action} · ${f.metric}</span></div><em>›</em>`
   return
  }
  const ch=currentChapter(this.game.state)
  if(!ch){q.innerHTML='<i>✓</i><div><strong>BASE READY</strong><b>The company can scale from here</b><small>Go back to the city and keep expanding.</small><span>OPEN THE CITY</span></div><em>›</em>';return}
  const st=chapterStatus(this.game.state,ch),next=st.next?BUILDINGS[st.next[0]]?.name:null
  q.innerHTML=`<i>${st.done?'✓':'⌂'}</i><div><strong>${ch.title}</strong><b>${ch.objective}</b><small>${st.complete}/${st.total} base objectives complete.</small><span>${st.done?'COLLECT MILESTONE':`GO TO ${next?.toUpperCase()??'NEXT OBJECTIVE'}`}</span></div><em>›</em>`
 }
 questAction(){
  if(this.game.mode==='world'){
   const f=fourXFlow(this.game.state)
   if(f.target){this.openWorldTile(f.target);return}
   this.openCityBriefing();return
  }
  const ch=currentChapter(this.game.state)
  if(!ch){this.game.setMode('world');return}
  const st=chapterStatus(this.game.state,ch)
  if(st.done){this.game.claimChapter(ch);return}
  if(st.next){this.game.focusBuilding(st.next[0]);this.openBuilding(st.next[0])}
 }
 refreshNav(){
  this.root.querySelector('#mode-tag').textContent=this.game.mode==='world'?'STRATEGIC MAP':'ACHU BASE'
  this.root.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===this.game.mode))
 }
 openMission(ch){
  const st=chapterStatus(this.game.state,ch)
  const tasks=ch.tasks.map(([id,lvl])=>{const current=this.game.state.buildings[id]??0,done=current>=lvl;return`<div class="mission-row ${done?'done':''}"><span>${done?'✓':'○'}</span><div><b>${BUILDINGS[id]?.name??id}</b><small>${current}/${lvl}</small></div></div>`}).join('')
  this.openSheet(`<header><div><small>${ch.kicker}</small><h2>${ch.title.split(' · ')[1]??ch.title}</h2><p>${st.complete}/${st.total} complete</p></div><button data-close>×</button></header><div class="sheet-body"><div class="story-card compact-story"><b>${ch.story}</b></div><div class="mission-list">${tasks}</div><h3>WHY</h3><p class="brief-copy">${ch.why}</p><h3>REWARD</h3><div class="costs">${costHtml(ch.reward)}</div><button id="mission-go" class="primary">${st.done?'COLLECT':st.next?`GO TO ${BUILDINGS[st.next[0]]?.name?.toUpperCase()}`:'CONTINUE'}</button></div>`)
  this.root.querySelector('#mission-go').onclick=()=>{if(st.done)this.game.claimChapter(ch);else if(st.next){this.hideSheet();this.game.focusBuilding(st.next[0]);this.openBuilding(st.next[0])}}
 }
 openCityBriefing(){
  const f=fourXFlow(this.game.state),w=this.game.state.world
  this.openSheet(`<header><div><small>ACHU BUSINESS 4X</small><h2>${f.label}: ${f.title}</h2><p>${w.scouted.length} researched · ${w.owned.length} service areas · ${w.defeated.length} contracts</p></div><button data-close>×</button></header><div class="sheet-body"><div class="fourx-explain"><div><b>1 · EXPLORE</b><span>Research demand and opportunities.</span></div><div><b>2 · EXPAND</b><span>Add profitable neighbourhoods to your route.</span></div><div><b>3 · OPERATE</b><span>Send crews and turn territory into value.</span></div><div><b>4 · COMPETE</b><span>Win commercial contracts against harder rivals.</span></div></div><div class="story-card compact-story"><b>${f.eyebrow}</b><p>${f.copy}</p></div><button id="fourx-go" class="primary">${f.action}</button></div>`)
  this.root.querySelector('#fourx-go').onclick=()=>{this.hideSheet();this.game.setMode('world');if(f.target)setTimeout(()=>this.openWorldTile(f.target),60)}
 }
 openMore(){
  const s=this.game.state
  this.openSheet(`<header><div><small>COMPANY</small><h2>More</h2><p>Secondary systems unlock as ACHU grows</p></div><button data-close>×</button></header><div class="sheet-body"><div class="quick-grid"><button id="more-partners"><b>PARTNERS</b><span>${s.guild?.id?s.guild.name:'Build a support network'}</span></button><button id="more-inbox"><b>INBOX</b><span>${s.events?.active?.length??0} live situations</span></button><button id="more-story"><b>BASE STORY</b><span>${currentChapter(s)?.title??'All chapters complete'}</span></button></div></div>`)
  this.root.querySelector('#more-partners').onclick=()=>this.openGuild()
  this.root.querySelector('#more-inbox').onclick=()=>this.openEvents()
  this.root.querySelector('#more-story').onclick=()=>{const ch=currentChapter(this.game.state);ch?this.openMission(ch):this.game.setMode('world')}
 }
}
