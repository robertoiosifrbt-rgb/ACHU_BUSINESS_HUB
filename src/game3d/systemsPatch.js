import { Retro4XGame } from './Retro4XGame.js'
import { GameUI } from './ui.js'
import { saveState } from '../systems/state.js'
import { BUILDINGS } from '../data/buildings.js'
import { worldTile,parseTile } from '../data/world.js'

const has=(r,c)=>Object.entries(c).every(([k,v])=>(r[k]??0)>=v)
const spend=(r,c)=>Object.entries(c).forEach(([k,v])=>r[k]-=v)
const short=n=>{const v=Math.floor(Number(n)||0);return v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(1)}K`:`${v}`}
const originalFinish=Retro4XGame.prototype.finishOutbound

Retro4XGame.prototype.trainingTier=function(type){
 const camp={infantry:'infantryCamp',lancer:'lancerCamp',marksman:'marksmanCamp'}[type]
 const lvl=this.state.buildings[camp]??0,f=this.state.buildings.furnace??1
 return Math.max(1,Math.min(4,1+Math.floor(Math.min(lvl,f)/3)))
}
Retro4XGame.prototype.trainTroops=function(type){
 const w=this.state.world;if(w.trainingJob){this.ui.toast('Training queue is busy');return}
 const camp={infantry:'infantryCamp',lancer:'lancerCamp',marksman:'marksmanCamp'}[type],lvl=this.state.buildings[camp]??0
 if(lvl<1){this.ui.toast(`Build ${BUILDINGS[camp].name} first`);return}
 const tier=this.trainingTier(type),amount=20+lvl*10,cost={meat:amount*(2+tier),wood:amount*(1+Math.floor(tier/2)),coal:Math.ceil(amount*.2*tier),iron:tier>=3?Math.ceil(amount*.04*tier):0}
 if(!has(this.state.resources,cost)){this.ui.toast('Not enough resources');return}
 spend(this.state.resources,cost);const duration=Math.max(3500,9000-lvl*250-tier*350)
 w.trainingJob={type,tier,amount,cost,startedAt:Date.now(),finishAt:Date.now()+duration};saveState(this.state);this.ui.toast(`Training ${amount} T${tier} ${type}`);this.ui.refresh()
}
Retro4XGame.prototype.hospitalCapacity=function(){return (this.state.buildings.infirmary??0)*90}
Retro4XGame.prototype.healWounded=function(){
 const w=this.state.world;if(w.healingJob){this.ui.toast('Infirmary is already healing');return}
 const infirmary=this.state.buildings.infirmary??0;if(infirmary<1){this.ui.toast('Build Infirmary first');return}
 const wounded=w.wounded??{},total=Object.values(wounded).reduce((a,b)=>a+b,0);if(total<1){this.ui.toast('No wounded troops');return}
 const amount=Math.min(total,50+infirmary*25),batch={infantry:0,lancer:0,marksman:0};let left=amount
 for(const k of ['infantry','lancer','marksman']){const n=Math.min(left,wounded[k]??0);batch[k]=n;left-=n}
 const cost={meat:amount*2,wood:amount,coal:Math.ceil(amount*.15)};if(!has(this.state.resources,cost)){this.ui.toast('Not enough resources to heal');return}
 spend(this.state.resources,cost);w.healingJob={batch,amount,startedAt:Date.now(),finishAt:Date.now()+Math.max(3500,8000-infirmary*250)};saveState(this.state);this.ui.toast(`Healing ${amount} troops`);this.ui.refresh()
}
Retro4XGame.prototype.tickTraining=function(now){
 const w=this.state.world;let changed=false,j=w.trainingJob
 if(j&&now>=j.finishAt){w.troops[j.type]=(w.troops[j.type]??0)+j.amount;w.trainingJob=null;this.state.power+=j.amount*(2+(j.tier??1));this.ui.toast(`${j.amount} T${j.tier??1} ${j.type} ready`);changed=true}
 const h=w.healingJob
 if(h&&now>=h.finishAt){for(const [k,n] of Object.entries(h.batch)){w.wounded[k]=Math.max(0,(w.wounded[k]??0)-n);w.troops[k]=(w.troops[k]??0)+n}w.healingJob=null;this.ui.toast(`${h.amount} troops recovered`);changed=true}
 return changed
}
Retro4XGame.prototype.finishOutbound=function(m,now){
 if(m.type!=='attack')return originalFinish.call(this,m,now)
 const w=this.state.world,d=worldTile(...parseTile(m.target)),power=this.detachmentPower(m.troops),win=power>=d.strength,totalSent=Object.values(m.troops).reduce((a,b)=>a+b,0),losses=Math.max(1,Math.round(totalSent*(win?.08:.24)))
 const hospitalFree=Math.max(0,this.hospitalCapacity()-Object.values(w.wounded??{}).reduce((a,b)=>a+b,0)),woundCount=Math.min(losses,hospitalFree),dead=losses-woundCount
 let remainingWounds=woundCount,remainingDead=dead
 for(const k of ['infantry','lancer','marksman']){
  const share=Math.min(m.troops[k]??0,Math.round(losses*((m.troops[k]??0)/Math.max(1,totalSent))))
  const wounded=Math.min(share,remainingWounds),killed=Math.min(share-wounded,remainingDead)
  w.troops[k]=Math.max(0,(w.troops[k]??0)-wounded-killed);w.wounded[k]=(w.wounded[k]??0)+wounded;remainingWounds-=wounded;remainingDead-=killed
 }
 if(win){if(d.kind==='camp'&&!w.defeated.includes(m.target))w.defeated.push(m.target);if(!w.owned.includes(m.target)&&d.kind==='camp')w.owned.push(m.target);for(const [k,v] of Object.entries(d.reward??{}))this.state.resources[k]=(this.state.resources[k]??0)+v;this.state.power+=Math.round(d.strength*.05);const hero=w.heroes?.[w.selectedHero];if(hero)hero.xp=(hero.xp??0)+Math.max(10,Math.round(d.strength/100))}
 w.battleReports.unshift({at:now,target:m.target,name:d.name,enemy:d.strength,power,win,losses,wounded:woundCount,dead});w.battleReports=w.battleReports.slice(0,12)
 this.ui.toast(win?`Victory · ${woundCount} wounded · ${dead} lost`:`Defeat · ${woundCount} wounded · ${dead} lost`);m.phase='returning';m.phaseStartedAt=now;m.arriveAt=now+m.travelMs
}

GameUI.prototype.openArmy=function(){
 const w=this.game.state.world,free=this.game.freeTroops(),wounded=w.wounded??{},cap=this.game.hospitalCapacity(),woundedTotal=Object.values(wounded).reduce((a,b)=>a+b,0),training=w.trainingJob,healing=w.healingJob
 this.openSheet(`<header><div><small>COMMAND CENTRE</small><h2>Army & Infirmary</h2><p>Power ${short(this.game.armyPower())} · Hospital ${woundedTotal}/${cap}</p></div><button data-close>×</button></header><div class="sheet-body army-list">
 ${training?`<div class="system-status"><span><b>TRAINING T${training.tier??1} ${training.type.toUpperCase()}</b><small>${training.amount} troops in queue</small></span></div>`:''}
 ${['infantry','lancer','marksman'].map(k=>`<div><span><b>${k.toUpperCase()} · T${this.game.trainingTier(k)}</b><small>${short(w.troops[k]??0)} total · ${short(free[k]??0)} free · ${short(wounded[k]??0)} wounded</small></span><button data-train="${k}" ${training?'disabled':''}>TRAIN</button></div>`).join('')}
 <div class="hospital-row"><span><b>INFIRMARY</b><small>${healing?`${healing.amount} healing now`:`${woundedTotal} wounded waiting`}</small></span><button id="heal" ${healing||woundedTotal<1?'disabled':''}>HEAL</button></div>
 <h3>RECENT BATTLES</h3>${(w.battleReports??[]).slice(0,4).map(r=>`<div class="battle-report ${r.win?'win':'loss'}"><span><b>${r.win?'VICTORY':'DEFEAT'} · ${r.name}</b><small>${r.wounded??0} wounded · ${r.dead??r.losses??0} lost</small></span><em>${short(r.enemy)}</em></div>`).join('')||'<p>No battle reports yet.</p>'}
 </div>`)
 this.root.querySelectorAll('[data-train]').forEach(b=>b.onclick=()=>{this.game.trainTroops(b.dataset.train);this.openArmy()});const heal=this.root.querySelector('#heal');if(heal)heal.onclick=()=>{this.game.healWounded();this.openArmy()}
}
const originalRefreshQueue=GameUI.prototype.refreshQueue
GameUI.prototype.refreshQueue=function(){originalRefreshQueue.call(this);const q=this.root.querySelector('#queue'),w=this.game.state.world,lines=[];if(w.trainingJob)lines.push(`⚔ T${w.trainingJob.tier??1} ${w.trainingJob.type} · ${Math.max(0,Math.ceil((w.trainingJob.finishAt-Date.now())/1000))}s`);if(w.healingJob)lines.push(`✚ healing ${w.healingJob.amount} · ${Math.max(0,Math.ceil((w.healingJob.finishAt-Date.now())/1000))}s`);if(lines.length)q.querySelector('small').textContent=lines.join(' · ')}
