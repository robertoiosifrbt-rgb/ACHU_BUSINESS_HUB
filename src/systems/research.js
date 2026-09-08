import { findResearch,researchCost } from '../data/research.js'
import { buildingEffects } from '../data/buildingProgression.js'
import { DEMO_SPEED } from './state.js'
const enough=(r,c)=>Object.entries(c).every(([k,v])=>(r[k]??0)>=v)
const spend=(r,c)=>Object.entries(c).forEach(([k,v])=>r[k]-=v)
export function researchBonus(state,key){let n=0;for(const [id,l] of Object.entries(state.research)){const d=findResearch(id);if(d?.bonus?.[key])n+=d.bonus[key]*l}return n}
export function startResearch(state,id){
 if(state.researchJob)return{ok:false,error:'Research queue is busy'}
 const center=state.buildings.researchCenter??0;if(center<1)return{ok:false,error:'Build Research Center first'}
 const def=findResearch(id);if(!def)return{ok:false,error:'Unknown research'}
 const target=(state.research[id]??0)+1;if(target>def.max)return{ok:false,error:'Max level reached'}
 for(const [dep,lvl] of def.requires)if((state.research[dep]??0)<lvl)return{ok:false,error:`Requires ${findResearch(dep)?.name??dep} ${lvl}`}
 const cost=researchCost(def,target);if(!enough(state.resources,cost))return{ok:false,error:'Not enough resources'}
 spend(state.resources,cost)
 const centerSpeed=buildingEffects('researchCenter',center)?.researchSpeed??0
 const speed=1+researchBonus(state,'researchSpeed')+centerSpeed
 const ms=def.seconds*Math.pow(1.5,target-1)*1000/DEMO_SPEED/speed
 state.researchJob={id,target,startedAt:Date.now(),finishAt:Date.now()+ms};return{ok:true}
}
export function tickResearch(state){const j=state.researchJob;if(!j||Date.now()<j.finishAt)return false;state.research[j.id]=j.target;state.power+=90*j.target;state.researchJob=null;return true}
