import { BusinessCleaningUI } from './BusinessCleaningUI.js'
import { BUILDINGS,RESOURCES } from '../data/buildings.js'
import { currentChapter,chapterStatus } from '../data/chapters.js'
import { fourXFlow } from './fourXFlow.js'

const short=n=>{const v=Math.floor(Number(n)||0);return v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(1)}K`:`${v}`}
const costs=c=>Object.entries(c??{}).map(([k,v])=>`<span class="cost ${k}"><i>${RESOURCES[k]?.icon??'•'}</i>${short(v)} ${RESOURCES[k]?.short??k}</span>`).join('')

export class StoryMissionUI extends BusinessCleaningUI{
 maybeStartStory(){
  const key='achu_story_dialogue_v5',ch=currentChapter(this.game.state);if(localStorage.getItem(key)||!ch)return
  localStorage.setItem(key,'seen');setTimeout(()=>this.openMission(ch),350)
 }
 missionDialogue(ch){
  const st=chapterStatus(this.game.state,ch),task=this.currentStoryTask(),next=task?.id?BUILDINGS[task.id]?.name:'the next step'
  if(st.done)return[
   {who:'ACHU',tone:'brand',text:`We did it. ${ch.success}`},
   {who:'YOU',tone:'you',text:'Good. What does this unlock for the business?'},
   {who:'ACHU',tone:'coach',text:`Collect the reward and the next chapter opens immediately. ${ch.unlocks?.length?`This unlocks: ${ch.unlocks.join(', ')}.`:''}`}
  ]
  return[
   {who:'YOU',tone:'you',text:'What is happening in the business right now?'},
   {who:'ACHU',tone:'brand',text:ch.story},
   {who:'OPERATIONS',tone:'coach',text:`Here is why this matters: ${ch.why}`},
   {who:'OPERATIONS',tone:'coach',text:`Your next move is ${next}. ${ch.objective}`},
   {who:'YOU',tone:'you',text:'Show me exactly what to do.'}
  ]
 }
 openMission(ch){this.renderMissionDialogue(ch,0)}
 renderMissionDialogue(ch,index){
  const st=chapterStatus(this.game.state,ch),task=this.currentStoryTask(),dialogue=this.missionDialogue(ch),atEnd=index>=dialogue.length
  if(atEnd){this.renderMissionBoard(ch);return}
  const line=dialogue[index],progress=`${Math.min(index+1,dialogue.length)}/${dialogue.length}`
  this.openSheet(`<header><div><small>${ch.kicker}</small><h2>${ch.title.split(' · ')[1]??ch.title}</h2><p>Story briefing · ${progress}</p></div><button data-close>×</button></header><div class="sheet-body dialogue-body"><div class="dialogue-scene"><div class="speaker ${line.tone}">${line.who.slice(0,2)}</div><div class="dialogue-bubble ${line.tone}"><span>${line.who}</span><p>${line.text}</p></div></div><div class="dialogue-context"><b>${st.done?'CHAPTER COMPLETE':'CURRENT GOAL'}</b><span>${st.done?ch.success:(task?.id?`${BUILDINGS[task.id]?.name} → level ${task.lvl}`:ch.objective)}</span></div><button id="dialogue-next" class="primary">${index===dialogue.length-1?(st.done?'SEE REWARD':'SHOW THE MISSION'):'CONTINUE'}</button><button id="dialogue-skip" class="dialogue-skip">SKIP DIALOGUE</button></div>`)
  this.root.querySelector('#dialogue-next').onclick=()=>this.renderMissionDialogue(ch,index+1)
  this.root.querySelector('#dialogue-skip').onclick=()=>this.renderMissionBoard(ch)
 }
 renderMissionBoard(ch){
  const st=chapterStatus(this.game.state,ch),task=this.currentStoryTask()
  const rows=ch.tasks.map(([id,lvl,label,reason])=>{const current=this.game.state.buildings[id]??0,done=current>=lvl,active=!done&&task?.id===id&&task?.lvl===lvl;return`<button class="mission-row ${done?'done':''} ${active?'active':''}" data-mission-row="${active?id:''}"><span>${done?'✓':active?'→':'○'}</span><div><b>${label??BUILDINGS[id]?.name??id}</b><small>${reason??`Reach level ${lvl}`} · ${current}/${lvl}</small></div></button>`}).join('')
  this.openSheet(`<header><div><small>${ch.kicker}</small><h2>${ch.title.split(' · ')[1]??ch.title}</h2><p>${st.complete}/${st.total} objectives complete</p></div><button data-close>×</button></header><div class="sheet-body"><div class="mission-brief"><span>${st.done?'MISSION COMPLETE':'WHAT YOU DO NOW'}</span><h3>${st.done?ch.success:ch.objective}</h3><p>${st.done?'Collect the reward to continue the story.':`The highlighted step is the only thing you need to worry about now. The game will explain the cost and timer on the next screen.`}</p></div><div class="mission-list">${rows}</div><h3>REWARD</h3><div class="costs">${costs(ch.reward)}</div><button id="mission-go" class="primary">${st.done?'COLLECT REWARD':`GO TO ${BUILDINGS[task?.id]?.name?.toUpperCase()??'NEXT STEP'}`}</button><button id="mission-story" class="dialogue-skip">REPLAY STORY</button></div>`)
  const go=()=>{if(st.done){this.game.claimChapter(ch);const next=currentChapter(this.game.state);if(next){this.game.audio?.success();setTimeout(()=>this.renderMissionDialogue(next,0),120)}else this.openCompanyProfile()}else if(task?.id){this.hideSheet();this.game.focusBuilding(task.id);setTimeout(()=>this.openBuilding(task.id),90)}}
  this.root.querySelector('#mission-go').onclick=go;this.root.querySelector('#mission-story').onclick=()=>this.renderMissionDialogue(ch,0);this.root.querySelectorAll('[data-mission-row]').forEach(b=>{if(b.dataset.missionRow)b.onclick=go})
 }
 openCityBriefing(){
  if((this.game.state.buildings.furnace??1)<4){const ch=currentChapter(this.game.state);if(ch)this.openMission(ch);return}
  const f=fourXFlow(this.game.state),w=this.game.state.world
  this.openSheet(`<header><div><small>FIELD BRIEFING</small><h2>${f.label}: ${f.title}</h2><p>${w.scouted.length} researched · ${w.owned.length} service areas · ${w.defeated.length} contracts</p></div><button data-close>×</button></header><div class="sheet-body dialogue-body"><div class="dialogue-scene"><div class="speaker coach">OP</div><div class="dialogue-bubble coach"><span>OPERATIONS</span><p>The base is only where ACHU builds capacity. The city is where that capacity becomes real work.</p></div></div><div class="dialogue-scene"><div class="speaker you">YO</div><div class="dialogue-bubble you"><span>YOU</span><p>So what do I actually do on this map?</p></div></div><div class="map-loop"><div><b>1 · RESEARCH</b><span>Find out what demand exists.</span></div><div><b>2 · COVER</b><span>Open service areas you can reach.</span></div><div><b>3 · WORK</b><span>Send crews to real enquiries.</span></div><div><b>4 · BID</b><span>Compete for recurring contracts.</span></div></div><div class="dialogue-scene"><div class="speaker brand">AC</div><div class="dialogue-bubble brand"><span>ACHU</span><p>Right now: ${f.copy}</p></div></div><button id="fourx-go" class="primary">SHOW THE NEXT AREA</button></div>`)
  this.root.querySelector('#fourx-go').onclick=()=>{this.hideSheet();this.game.setMode('world');if(f.target)setTimeout(()=>this.openWorldTile(f.target),100)}
 }
}
