import {StrategyGame} from './StrategyGame.js'
import {BUILDINGS} from '../data/buildings.js'
import {buildingEffects} from '../data/buildingProgression.js'
import {saveState} from '../systems/state.js'

const CAMP={infantry:'infantryCamp',lancer:'lancerCamp',marksman:'marksmanCamp'}
const BASE_POWER={infantry:7,lancer:8,marksman:9}
const enough=(r,c)=>Object.entries(c).every(([k,v])=>(r[k]??0)>=v)
const spend=(r,c)=>Object.entries(c).forEach(([k,v])=>r[k]-=v)

const originalProductionRates=StrategyGame.prototype.productionRates
StrategyGame.prototype.productionRates=function(){
 const rates=originalProductionRates.call(this)
 const lvl=this.state.buildings.storehouse??0,cap=lvl?(buildingEffects('storehouse',lvl)?.capacity??5000):5000
 for(const k of Object.keys(rates))if((this.state.resources[k]??0)>=cap)rates[k]=0
 return rates
}

StrategyGame.prototype.marchCapacity=function(){
 const lvl=this.state.buildings.embassy??0
 return lvl?(buildingEffects('embassy',lvl)?.marchSlots??2):2
}

StrategyGame.prototype.trainTroops=function(type){
 const w=this.state.world
 if(w.trainingJob){this.toast('Training queue is busy');return}
 const camp=CAMP[type],lvl=this.state.buildings[camp]??0
 if(lvl<1){this.toast(`Build ${BUILDINGS[camp].name} first`);return}
 const e=buildingEffects(camp,lvl),shelter=this.state.buildings.shelter??0,pop=shelter?(buildingEffects('shelter',shelter)?.population??100):100
 const current=Object.values(w.troops??{}).reduce((a,n)=>a+(n??0),0)
 const room=Math.max(0,pop-current),amount=Math.min(e?.batch??(20+lvl*10),room)
 if(amount<1){this.toast('Population capacity reached · upgrade Shelter');return}
 const tier=e?.tier??1,cost={meat:amount*2,wood:amount,coal:Math.ceil(amount*.2),iron:tier>=3?Math.ceil(amount*.05):0}
 if(!enough(this.state.resources,cost)){this.toast('Not enough resources to train');return}
 spend(this.state.resources,cost)
 const now=Date.now(),speed=1+(e?.speed??0),finish=now+Math.max(3500,Math.round(11000/speed))
 w.trainingJob={type,amount,tier,startedAt:now,finishAt:finish}
 saveState(this.state);this.hud.armyPanel.open();this.toast(`Training ${amount} T${tier} ${type}`)
}

const originalDetachmentPower=StrategyGame.prototype.detachmentPower
StrategyGame.prototype.detachmentPower=function(t,heroId,formation,rallyPower){
 let power=originalDetachmentPower.call(this,t,heroId,formation,rallyPower)
 for(const [type,count] of Object.entries(t??{})){const camp=CAMP[type],lvl=this.state.buildings[camp]??0,tier=lvl?(buildingEffects(camp,lvl)?.tier??1):1;power+=Math.round((count??0)*(BASE_POWER[type]??7)*(tier-1)*.22)}
 return Math.round(power)
}

const originalArmyPower=StrategyGame.prototype.armyPower
StrategyGame.prototype.armyPower=function(){
 let power=originalArmyPower.call(this),t=this.state.world.troops??{}
 for(const [type,count] of Object.entries(t)){const camp=CAMP[type],lvl=this.state.buildings[camp]??0,tier=lvl?(buildingEffects(camp,lvl)?.tier??1):1;power+=Math.round((count??0)*(BASE_POWER[type]??7)*(tier-1)*.22)}
 return Math.round(power)
}

const originalResolveAttack=StrategyGame.prototype.resolveAttack
StrategyGame.prototype.resolveAttack=function(m){
 const before={...this.state.world.troops}
 originalResolveAttack.call(this,m)
 const lvl=this.state.buildings.infirmary??0;if(!lvl)return
 const e=buildingEffects('infirmary',lvl),chance=e?.saveChance??0,capacity=e?.capacity??0
 let recovered=0
 for(const k of Object.keys(before)){const lost=Math.max(0,(before[k]??0)-(this.state.world.troops[k]??0)),save=Math.min(lost,Math.floor(lost*chance),Math.max(0,capacity-recovered));if(save>0){this.state.world.troops[k]=(this.state.world.troops[k]??0)+save;recovered+=save}}
 if(recovered){const report=this.state.world.battleReports?.[0];if(report)report.losses=Math.max(0,(report.losses??0)-recovered);this.toast(`${recovered} casualties recovered by Infirmary`)}
}

const originalStartRally=StrategyGame.prototype.startRally
StrategyGame.prototype.startRally=function(id){
 originalStartRally.call(this,id)
 const r=this.state.world.rally,lvl=this.state.buildings.embassy??0
 if(r&&lvl){const e=buildingEffects('embassy',lvl);r.allyPower+=Math.round((e?.rally??0)*.35);r.participants=Math.max(r.participants??3,e?.helps??3);saveState(this.state)}
}
