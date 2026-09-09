import { GameUI } from './ui.js'
import { BUILDINGS,RESOURCES } from '../data/buildings.js'
import { CHAPTERS,currentChapter,chapterStatus } from '../data/chapters.js'
import { furnaceTier } from '../data/furnace.js'
import { fourXFlow,FOUR_X_STEPS } from './fourXFlow.js'

const short=n=>{const v=Math.floor(Number(n)||0);return v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(1)}K`:`${v}`}
const costHtml=c=>Object.entries(c??{}).map(([k,v])=>`<span class="cost ${k}"><i>${RESOURCES[k]?.icon??'•'}</i>${short(v)} ${RESOURCES[k]?.short??k}</span>`).join('')

export class GameUI4X extends GameUI{
 renderShell(){this.root.innerHTML=`
  <div class="topbar fourx-topbar">
   <button id="company-profile" class="profile company-profile" aria-label="Open ACHU company story"><b>A</b><div><strong>ACHU</strong><small id="power"></small></div><em>›</em></button>
   <div id="resources" class="resources"></div>
  </div>
  <div id="phase-rail" class="phase-rail"></div>
  <button id="quest" class="quest-card fourx-quest"></button>
  <div id="mode-tag" class="mode-tag">ACHU BASE</div>
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
  this.root.addEventListener('pointerdown',e=>{if(e.target.closest('button')){this.game.audio?.unlock();this.game.audio?.ui()}},{passive:true})
  this.root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>this.game.setMode(b.dataset.mode))
  this.root.querySelector('#company-profile').onclick=()=>this.openCompanyProfile()
  this.root.querySelector('[data-action="army"]').onclick=()=>this.openArmy()
  this.root.querySelector('[data-action="tech"]').onclick=()=>this.openTech()
  this.root.querySelector('[data-action="more"]').onclick=()=>this.openMore()
  this.root.querySelector('#quest').onclick=()=>this.questAction()
  this.root.querySelector('#update-app').onclick=()=>window.appUpdater?.checkAndApply?.()
 }
 refresh(){super.refresh();this.refreshPhaseRail()}
 refreshPhaseRail(){
  const el=this.root.querySelector('#phase-rail');if(!el)return
  const unlocked=(this.game.state.buildings.furnace??1)>=4
  el.hidden=!unlocked
  if(!unlocked){el.innerHTML='';return}
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
  if(!ch){q.innerHTML='<i>✓</i><div><strong>THE STORY</strong><b>ACHU has become a national platform</b><small>The campaign is complete. The city remains yours to grow.</small><span>READ THE COMPANY STORY</span></div><em>›</em>';return}
  const st=chapterStatus(this.game.state,ch)
  q.innerHTML=`<i>${st.done?'✓':'⌂'}</i><div><strong>${ch.title}</strong><b>${ch.title.split(' · ')[1]??ch.title}</b><small>${ch.story}</small><span>${st.done?'CHAPTER COMPLETE · COLLECT REWARD':`CONTINUE STORY · ${st.complete}/${st.total} OBJECTIVES`}</span></div><em>›</em>`
 }
 questAction(){
  if(this.game.mode==='world'){
   const f=fourXFlow(this.game.state)
   if(f.target){this.openWorldTile(f.target);return}
   this.openCityBriefing();return
  }
  const ch=currentChapter(this.game.state)
  if(ch){this.openMission(ch);return}
  this.openCompanyProfile()
 }
 refreshNav(){
  const unlocked=(this.game.state.buildings.furnace??1)>=4
  this.root.querySelector('#mode-tag').textContent=this.game.mode==='world'?'STRATEGIC MAP':'ACHU BASE'
  this.root.querySelectorAll('[data-mode]').forEach(b=>{
   b.classList.toggle('active',b.dataset.mode===this.game.mode)
   if(b.dataset.mode==='world')b.title=unlocked?'Open the city':'Unlocks at Headquarters 4'
  })
 }
 openCompanyProfile(){
  const s=this.game.state,hq=s.buildings.furnace??1,ch=currentChapter(s),claimed=s.claimedChapters??{},w=s.world
  const completed=CHAPTERS.filter(c=>claimed[c.id]).length
  const timeline=CHAPTERS.map((c,i)=>{const done=!!claimed[c.id],active=ch?.id===c.id;return`<div class="story-step ${done?'done':''} ${active?'active':''}"><i>${done?'✓':active?'●':i+1}</i><div><b>${c.title}</b><small>${active?c.story:done?c.success:'Locked until the previous chapter is finished.'}</small></div></div>`}).join('')
  this.openSheet(`<header><div><small>ACHU · COMPANY STORY</small><h2>${furnaceTier(hq)}</h2><p>Headquarters ${hq}/12 · ${completed}/${CHAPTERS.length} chapters complete</p></div><button data-close>×</button></header><div class="sheet-body"><div class="story-hero"><span>YOU STARTED WITH A PROMISE</span><h3>Build a cleaning company that can grow without losing the standard.</h3><p>Every base upgrade creates capacity. Every district gives you a market. Every crew turns that reach into work. Every contract tests whether ACHU is strong enough for the next stage.</p><div><b>${short(s.power)} company value</b><b>${w.owned.length} service areas</b><b>${w.defeated.length} contracts won</b></div></div>${ch?`<h3>CURRENT CHAPTER</h3><button id="profile-current-story" class="current-story"><b>${ch.title}</b><span>${ch.story}</span><em>CONTINUE CHAPTER ›</em></button>`:'<div class="story-card success"><b>Campaign complete.</b><p>ACHU has reached the national platform stage. Keep competing for the city and building the company beyond the campaign.</p></div>'}<h3>STORY SO FAR</h3><div class="story-timeline">${timeline}</div></div>`)
  const b=this.root.querySelector('#profile-current-story');if(b)b.onclick=()=>this.openMission(ch)
 }
 openMission(ch){
  const st=chapterStatus(this.game.state,ch)
  const tasks=ch.tasks.map(([id,lvl])=>{const current=this.game.state.buildings[id]??0,done=current>=lvl;return`<div class="mission-row ${done?'done':''}"><span>${done?'✓':'○'}</span><div><b>${BUILDINGS[id]?.name??id}</b><small>Reach level ${lvl} · currently ${current}</small></div></div>`}).join('')
  const unlocks=(ch.unlocks??[]).map(x=>`<span>${x}</span>`).join('')
  this.openSheet(`<header><div><small>${ch.kicker}</small><h2>${ch.title.split(' · ')[1]??ch.title}</h2><p>${st.complete}/${st.total} objectives complete</p></div><button data-close>×</button></header><div class="sheet-body"><div class="chapter-story"><span>STORY</span><p>${ch.story}</p></div><h3>YOUR OBJECTIVE</h3><p class="brief-copy">${ch.objective}</p><div class="mission-list">${tasks}</div><h3>WHY IT MATTERS</h3><p class="brief-copy">${ch.why}</p><h3>WHEN YOU FINISH</h3><div class="story-card success"><b>${ch.success}</b></div><h3>REWARD</h3><div class="costs">${costHtml(ch.reward)}</div>${unlocks?`<h3>UNLOCKS</h3><div class="unlock-row">${unlocks}</div>`:''}<button id="mission-go" class="primary">${st.done?'COLLECT CHAPTER REWARD':st.next?`GO TO ${BUILDINGS[st.next[0]]?.name?.toUpperCase()}`:'CONTINUE'}</button></div>`)
  this.root.querySelector('#mission-go').onclick=()=>{
   if(st.done){
    this.game.claimChapter(ch)
    const next=currentChapter(this.game.state)
    if(next){this.game.audio?.success();setTimeout(()=>this.openMission(next),120)}else this.openCompanyProfile()
   }else if(st.next){
    this.hideSheet();this.game.focusBuilding(st.next[0]);setTimeout(()=>this.openBuilding(st.next[0]),70)
   }
  }
 }
 openCityBriefing(){
  if((this.game.state.buildings.furnace??1)<4){const ch=currentChapter(this.game.state);if(ch)this.openMission(ch);return}
  const f=fourXFlow(this.game.state),w=this.game.state.world
  this.openSheet(`<header><div><small>ACHU BUSINESS 4X</small><h2>${f.label}: ${f.title}</h2><p>${w.scouted.length} researched · ${w.owned.length} service areas · ${w.defeated.length} contracts</p></div><button data-close>×</button></header><div class="sheet-body"><div class="fourx-explain"><div><b>1 · EXPLORE</b><span>Research demand and opportunities.</span></div><div><b>2 · EXPAND</b><span>Add profitable neighbourhoods to your route.</span></div><div><b>3 · OPERATE</b><span>Send crews and turn territory into value.</span></div><div><b>4 · COMPETE</b><span>Win commercial contracts against harder rivals.</span></div></div><div class="story-card compact-story"><b>${f.eyebrow}</b><p>${f.copy}</p></div><button id="fourx-go" class="primary">${f.action}</button></div>`)
  this.root.querySelector('#fourx-go').onclick=()=>{this.hideSheet();this.game.setMode('world');if(f.target)setTimeout(()=>this.openWorldTile(f.target),60)}
 }
 openMore(){
  const s=this.game.state,sound=this.game.audio?.enabled!==false
  this.openSheet(`<header><div><small>COMPANY</small><h2>More</h2><p>Story, partners, events, sound and game controls</p></div><button data-close>×</button></header><div class="sheet-body"><div class="quick-grid"><button id="more-story"><b>COMPANY STORY</b><span>${currentChapter(s)?.title??'Campaign complete'}</span></button><button id="more-partners"><b>PARTNERS</b><span>${s.guild?.id?s.guild.name:'Build a support network'}</span></button><button id="more-inbox"><b>INBOX</b><span>${s.events?.active?.length??0} live situations</span></button><button id="more-sound"><b>SOUND</b><span>${sound?'ON · ambient + game effects':'OFF · tap to enable'}</span></button><button id="more-reset"><b>RESET GAME</b><span>Start the ACHU story again from Chapter 1</span></button></div></div>`)
  this.root.querySelector('#more-story').onclick=()=>this.openCompanyProfile()
  this.root.querySelector('#more-partners').onclick=()=>this.openGuild()
  this.root.querySelector('#more-inbox').onclick=()=>this.openEvents()
  this.root.querySelector('#more-sound').onclick=()=>{this.game.toggleAudio();setTimeout(()=>this.openMore(),30)}
  this.root.querySelector('#more-reset').onclick=()=>{if(confirm('Reset ACHU Business Hub? This restarts the story, buildings, city progress and resources from the beginning.'))this.game.resetGame()}
 }
}
