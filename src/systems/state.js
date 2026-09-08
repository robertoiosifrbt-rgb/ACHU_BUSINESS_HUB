const KEY='build_strategy_v04'
export const DEMO_SPEED=120
const initialWorld=()=>({
 scouted:['5,5','5,4','5,6','4,5','6,5'],owned:['5,5'],defeated:[],nodeReady:{},armyPower:780
})
export function defaultState(){return{
 resources:{meat:2200,wood:2200,coal:850,iron:260},
 buildings:{furnace:1,shelter:1,sawmill:1,huntersHut:1,coalMine:1,ironMine:0,storehouse:0,infirmary:0,embassy:0,infantryCamp:0,lancerCamp:0,marksmanCamp:0,researchCenter:0},
 research:{},construction:null,researchJob:null,power:520,lastSavedAt:Date.now(),collectReady:{},claimedChapters:{},world:initialWorld()
}}
function migrate(raw){
 const base=defaultState();if(!raw)return base
 const resources={...base.resources,...raw.resources};if(resources.meat==null&&raw.resources?.food!=null)resources.meat=raw.resources.food
 const buildings={...base.buildings,...raw.buildings};if(raw.buildings?.house!=null&&raw.buildings?.shelter==null)buildings.shelter=raw.buildings.house
 const world={...base.world,...raw.world,nodeReady:{...base.world.nodeReady,...raw.world?.nodeReady}}
 return{...base,...raw,resources,buildings,world,collectReady:{...base.collectReady,...raw.collectReady},claimedChapters:{...base.claimedChapters,...raw.claimedChapters},lastSavedAt:raw.lastSavedAt??Date.now()}
}
export function loadState(){try{return migrate(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{return defaultState()}}
export function saveState(s){s.lastSavedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(s))}
export function resetState(){localStorage.removeItem(KEY);return defaultState()}
