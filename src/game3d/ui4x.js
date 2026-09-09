import { GameUI } from './ui.js'
import { BUILDINGS,RESOURCES } from '../data/buildings.js'
import { CHAPTERS,currentChapter,chapterStatus } from '../data/chapters.js'
import { furnaceTier } from '../data/furnace.js'
import { fourXFlow,FOUR_X_STEPS } from './fourXFlow.js'

const short=n=>{const v=Math.floor(Number(n)||0);return v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(1)}K`:`${v}`}
const costHtml=c=>Object.entries(c??{}).map(([k,v])=>`<span class="cost ${k}"><i>${RESOURCES[k]?.icon??'•'}</i>${short(v)} ${RESOURCES[k]?.short??k}</span>`).join('')
const CITY_GUIDE={
 explore:['RESEARCH THIS AREA','This spends a small amount of business resources and sends a team to learn what demand exists there. When the team returns, the tile is revealed.'],
 expand:['ADD AREA TO YOUR ROUTE','This turns a researched neighbouring tile into an ACHU service area. You can only expand next to territory you already serve.'],
 operate:['SEND A CREW','This sends available staff to an opportunity inside your territory. The crew returns with Cash, Supplies, Reputation or Talent.'],
 compete:['MAKE A PITCH','Commercial contracts compare your crew strength with the contract difficulty. If your strength is lower, hire or improve the business first.'],
 scale:['CONTINUE EXPANSION','Keep repeating the loop: research, open useful areas, operate them and win harder contracts.']
}

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
 maybeStartStory(){
  const key='achu_story_guide_v2',ch=currentChapter(this.game.state)
  if(localStorage.getItem(key)||!ch)return
  localStorage.setItem(key,'seen');setTimeout(()=>this.openMission(ch),350)
 }
 currentStoryTask(){
  const ch=currentChapter(this.game.state);if(!ch)return null
  const st=chapterStatus(this.game.state,ch);if(!st.next)return{ch,st,id:null,lvl:null,index:ch.tasks.length,total:ch.tasks.length}
  const index=ch.tasks.findIndex(x=>x[0]===st.next[0]&&x[1]===st.next[1])
  return{ch,st,id:st.next[0],lvl:st.next[1],index:Math.max(0,index),total:ch.tasks.length}
 }
 stepExplanation(id,lvl){
  const d=BUILDINGS[id],current=this.game.state.buildings[id]??0,verb=current?'UPGRADE':'OPEN'
  return `<div class="story-click-guide"><span>HOW TO PLAY THIS STORY STEP</span><b>1. You are here because the story needs ${d?.name??id} level ${lvl}.</b><p>2. Press <strong>${verb}${current?` TO LEVEL ${current+1}`:''}</strong> below. The listed resources are spent immediately and one development timer starts.</p><p>3. You can leave this screen. Watch the <strong>Queue</strong> at the top. When the timer finishes, the mission updates automatically. If the target is a higher level, repeat the upgrade until level ${lvl}.</p></div>`
 }
 refresh(){super.refresh();this.refreshPhaseRail()}
 refreshPhaseRail(){
  const el=this.root.querySelector('#phase-rail');if(!el)return
  const unlocked=(this.game.state.buildings.furnace??1)>=4;el.hidden=!unlocked
  if(!unlocked){el.innerHTML='';return}
  const flow=fourXFlow(this.game.state)
  el.innerHTML=FOUR_X_STEPS.map((s,i)=>`<button class="${i===flow.index?'active':''} ${i<flow.index?'done':''}" data-fourx="${s.key}"><i>${i<flow.index?'✓':i+1}</i><span><b>${s.label}</b><small>${s.copy}</small></span></button>`).join('')
  el.querySelectorAll('[data-fourx]').forEach(b=>b.onclick=()=>{this.game.setMode('world');this.openCityBriefing()})
 }
 refreshQuest(){
  const q=this.root.querySelector('#quest')
  if(this.game.mode==='world'){
   const f=fourXFlow(this.game.state);q.innerHTML=`<i>${f.index+1}</i><div><strong>${f.eyebrow}</strong><b>${f.title}</b><small>${f.copy}</small><span>NEXT CLICK · ${f.action} · ${f.metric}</span></div><em>›</em>`;return
  }
  const task=this.currentStoryTask(),ch=task?.ch??currentChapter(this.game.state)
  if(!ch){q.innerHTML='<i>✓</i><div><strong>THE STORY</strong><b>ACHU has become a national platform</b><small>The campaign is complete. The city remains yours to grow.</small><span>READ THE COMPANY STORY</span></div><em>›</em>';return}
  const st=task.st
  const next=task.id?BUILDINGS[task.id]?.name:null
  q.innerHTML=`<i>${st.done?'✓':'⌂'}</i><div><strong>${ch.title}</strong><b>${st.done?'Chapter objective complete':`Next: ${next} → level ${task.lvl}`}</b><small>${st.done?ch.success:ch.story}</small><span>${st.done?'COLLECT REWARD':`TAP TO CONTINUE STORY · ${st.complete}/${st.total}`}</span></div><em>›</em>`
 }
 questAction(){
  if(this.game.mode==='world'){const f=fourXFlow(this.game.state);if(f.target){this.openWorldTile(f.target);return}this.openCityBriefing();return}
  const ch=currentChapter(this.game.state);if(ch){this.openMission(ch);return}this.openCompanyProfile()
 }
 refreshNav(){
  const unlocked=(this.game.state.buildings.furnace??1)>=4
  this.root.querySelector('#mode-tag').textContent=this.game.mode==='world'?'STRATEGIC MAP':'ACHU BASE'
  this.root.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===this.game.mode);if(b.dataset.mode==='world')b.title=unlocked?'Open the city':'Unlocks at Headquarters 4'})
 }
 openCompanyProfile(){
  const s=this.game.state,hq=s.buildings.furnace??1,ch=currentChapter(s),claimed=s.claimedChapters??{},w=s.world,completed=CHAPTERS.filter(c=>claimed[c.id]).length
  const timeline=CHAPTERS.map((c,i)=>{const done=!!claimed[c.id],active=ch?.id===c.id;return`<div class="story-step ${done?'done':''} ${active?'active':''}"><i>${done?'✓':active?'●':i+1}</i><div><b>${c.title}</b><small>${active?c.story:done?c.success:'Locked until the previous chapter is finished.'}</small></div></div>`}).join('')
  this.openSheet(`<header><div><small>ACHU · COMPANY STORY</small><h2>${furnaceTier(hq)}</h2><p>Headquarters ${hq}/12 · ${completed}/${CHAPTERS.length} chapters complete</p></div><button data-close>×</button></header><div class="sheet-body"><div class="story-hero"><span>THIS STORY IS THE TUTORIAL</span><h3>Build the company by following the story one real action at a time.</h3><p>Every chapter tells you why ACHU needs something. Tapping Continue takes you to the exact building or city action. The next screen explains the button, the cost, the timer and what unlocks after it.</p><div><b>${short(s.power)} company value</b><b>${w.owned.length} service areas</b><b>${w.defeated.length} contracts won</b></div></div>${ch?`<h3>CURRENT CHAPTER</h3><button id="profile-current-story" class="current-story"><b>${ch.title}</b><span>${ch.story}</span><em>CONTINUE THE NEXT ACTION ›</em></button>`:'<div class="story-card success"><b>Campaign complete.</b><p>Keep competing for the city and growing the company.</p></div>'}<h3>STORY SO FAR</h3><div class="story-timeline">${timeline}</div></div>`)
  const b=this.root.querySelector('#profile-current-story');if(b)b.onclick=()=>this.openMission(ch)
 }
 openMission(ch){
  const st=chapterStatus(this.game.state,ch),task=this.currentStoryTask()
  const tasks=ch.tasks.map(([id,lvl],i)=>{const current=this.game.state.buildings[id]??0,done=current>=lvl,active=!done&&task?.id===id&&task?.lvl===lvl;return`<button class="mission-row ${done?'done':''} ${active?'active':''}" data-story-task="${active?id:''}"><span>${done?'✓':active?'→':'○'}</span><div><b>${BUILDINGS[id]?.name??id}</b><small>${done?'Done':active?'NEXT ACTION · tap to go there':`Reach level ${lvl}`} · level ${current}/${lvl}</small></div></button>`}).join('')
  const unlocks=(ch.unlocks??[]).map(x=>`<span>${x}</span>`).join('')
  const play=st.done?'<div class="story-play-guide"><b>The work is done.</b><p>Collect the chapter reward. The next chapter opens immediately and explains the next part of the game.</p></div>':`<div class="story-play-guide"><b>What do I do now?</b><p><strong>${task.index+1}/${task.total}:</strong> Go to <strong>${BUILDINGS[task.id]?.name}</strong> and reach level ${task.lvl}. Tap the green button below; the next screen will tell you exactly which upgrade button to press and how the timer works.</p></div>`
  this.openSheet(`<header><div><small>${ch.kicker}</small><h2>${ch.title.split(' · ')[1]??ch.title}</h2><p>${st.complete}/${st.total} objectives complete</p></div><button data-close>×</button></header><div class="sheet-body"><div class="chapter-story"><span>STORY</span><p>${ch.story}</p></div>${play}<h3>MISSION</h3><p class="brief-copy">${ch.objective}</p><div class="mission-list">${tasks}</div><h3>WHY IT MATTERS</h3><p class="brief-copy">${ch.why}</p><h3>WHEN YOU FINISH</h3><div class="story-card success"><b>${ch.success}</b></div><h3>REWARD</h3><div class="costs">${costHtml(ch.reward)}</div>${unlocks?`<h3>UNLOCKS</h3><div class="unlock-row">${unlocks}</div>`:''}<button id="mission-go" class="primary">${st.done?'COLLECT CHAPTER REWARD':`GO TO ${BUILDINGS[task.id]?.name?.toUpperCase()}`}</button></div>`)
  const go=()=>{if(st.done){this.game.claimChapter(ch);const next=currentChapter(this.game.state);if(next){this.game.audio?.success();setTimeout(()=>this.openMission(next),120)}else this.openCompanyProfile()}else if(task?.id){this.hideSheet();this.game.focusBuilding(task.id);setTimeout(()=>this.openBuilding(task.id),80)}}
  this.root.querySelector('#mission-go').onclick=go;this.root.querySelectorAll('[data-story-task]').forEach(b=>{if(b.dataset.storyTask)b.onclick=go})
 }
 openBuilding(id){
  super.openBuilding(id)
  const task=this.currentStoryTask();if(!task||task.id!==id)return
  const body=this.root.querySelector('#sheet .sheet-body');if(body)body.insertAdjacentHTML('afterbegin',this.stepExplanation(id,task.lvl))
 }
 openWorldTile(id){
  super.openWorldTile(id)
  const f=fourXFlow(this.game.state),g=CITY_GUIDE[f.key]??CITY_GUIDE.scale,body=this.root.querySelector('#sheet .sheet-body');if(!body)return
  body.insertAdjacentHTML('afterbegin',`<div class="story-click-guide city-guide"><span>${f.eyebrow}</span><b>Next click: ${g[0]}</b><p>${g[1]}</p><p>The story card at the top always points to the next useful tile. You can also explore freely.</p></div>`)
 }
 openCityBriefing(){
  if((this.game.state.buildings.furnace??1)<4){const ch=currentChapter(this.game.state);if(ch)this.openMission(ch);return}
  const f=fourXFlow(this.game.state),w=this.game.state.world,g=CITY_GUIDE[f.key]??CITY_GUIDE.scale
  this.openSheet(`<header><div><small>THE STORY MOVES INTO THE CITY</small><h2>${f.label}: ${f.title}</h2><p>${w.scouted.length} researched · ${w.owned.length} service areas · ${w.defeated.length} contracts</p></div><button data-close>×</button></header><div class="sheet-body"><div class="chapter-story"><span>WHY YOU ARE HERE</span><p>Your base created capacity. Now the story teaches you how to turn that capacity into actual business across the city.</p></div><div class="fourx-explain"><div><b>1 · EXPLORE</b><span>Tap an unknown neighbouring tile → Research This Area.</span></div><div><b>2 · EXPAND</b><span>Tap a useful researched tile → Add Area To Your Route.</span></div><div><b>3 · OPERATE</b><span>Tap an opportunity you own → Send A Crew.</span></div><div><b>4 · COMPETE</b><span>Tap a commercial contract → Make A Pitch.</span></div></div><div class="story-click-guide"><span>CURRENT LESSON</span><b>${g[0]}</b><p>${g[1]}</p></div><button id="fourx-go" class="primary">SHOW ME WHERE TO CLICK</button></div>`)
  this.root.querySelector('#fourx-go').onclick=()=>{this.hideSheet();this.game.setMode('world');if(f.target)setTimeout(()=>this.openWorldTile(f.target),80)}
 }
 openMore(){
  const s=this.game.state,sound=this.game.audio?.enabled!==false
  this.openSheet(`<header><div><small>COMPANY</small><h2>More</h2><p>Story, partners, events, music and game controls</p></div><button data-close>×</button></header><div class="sheet-body"><div class="quick-grid"><button id="more-story"><b>COMPANY STORY + TUTORIAL</b><span>${currentChapter(s)?.title??'Campaign complete'}</span></button><button id="more-partners"><b>PARTNERS</b><span>${s.guild?.id?s.guild.name:'Build a support network'}</span></button><button id="more-inbox"><b>INBOX</b><span>${s.events?.active?.length??0} live situations</span></button><button id="more-sound"><b>MUSIC + SOUND</b><span>${sound?'ON · background music + effects':'OFF · tap to enable'}</span></button><button id="more-reset"><b>RESET GAME</b><span>Start the ACHU story again from Chapter 1</span></button></div></div>`)
  this.root.querySelector('#more-story').onclick=()=>this.openCompanyProfile();this.root.querySelector('#more-partners').onclick=()=>this.openGuild();this.root.querySelector('#more-inbox').onclick=()=>this.openEvents();this.root.querySelector('#more-sound').onclick=()=>{this.game.toggleAudio();setTimeout(()=>this.openMore(),30)};this.root.querySelector('#more-reset').onclick=()=>{if(confirm('Reset ACHU Business Hub? This restarts the story, buildings, city progress and resources from the beginning.'))this.game.resetGame()}
 }
}
