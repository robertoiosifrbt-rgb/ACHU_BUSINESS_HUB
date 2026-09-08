import { BUILDINGS,buildingRequirements,nextBuildingLevel } from '../data/buildings.js'
import { buildingEffects } from '../data/buildingProgression.js'
import { DEMO_SPEED } from './state.js'

const enough=(r,c)=>Object.entries(c).every(([k,v])=>(r[k]??0)>=v)
const spend=(r,c)=>Object.entries(c).forEach(([k,v])=>r[k]-=v)
export function constructionBonus(state){let b=0;for(const [id,l] of Object.entries(state.research))if(['tools','architecture'].includes(id))b+=l*(id==='tools'?.04:.05);return b}
export function startConstruction(state,id){
 if(state.construction)return{ok:false,error:'Construction queue is busy'}
 const def=BUILDINGS[id],target=nextBuildingLevel(state,id);if(!def?.levels[target])return{ok:false,error:'Max level reached'}
 const req=buildingRequirements(state,id,target);if(req.length)return{ok:false,error:`Requires ${req.join(' · ')}`}
 const lvl=def.levels[target];if(!enough(state.resources,lvl.cost))return{ok:false,error:'Not enough resources'}
 spend(state.resources,lvl.cost);const speed=1+constructionBonus(state);const ms=lvl.seconds*1000/DEMO_SPEED/speed
 state.construction={id,target,startedAt:Date.now(),finishAt:Date.now()+ms,helpUsed:0};return{ok:true}
}
export function tickConstruction(state){const j=state.construction;if(!j||Date.now()<j.finishAt)return false;state.buildings[j.id]=j.target;state.power+=BUILDINGS[j.id].levels[j.target].power;state.construction=null;return true}
export function allianceHelp(state){
 if(!state.construction)return false
 const embassy=state.buildings.embassy??0,e=embassy?buildingEffects('embassy',embassy):null,max=e?.helps??1
 if((state.construction.helpUsed??0)>=max)return false
 const reduction=e?.helpReduction??.05,left=state.construction.finishAt-Date.now()
 state.construction.finishAt-=Math.max(300,Math.min(left*reduction,5000));state.construction.helpUsed=(state.construction.helpUsed??0)+1
 return true
}
