const KEY='build_strategy_v04'
export const DEMO_SPEED=120
const MAP_VERSION=2
const SHIFT=5
const initialWorld=()=>({
 mapVersion:MAP_VERSION,
 scouted:['10,10','10,9','10,11','9,10','11,10'],owned:['10,10'],defeated:[],nodeReady:{},armyPower:300,
 troops:{infantry:70,lancer:35,marksman:35},marches:[],battleReports:[],trainingJob:null,
 selectedHero:'astrid',formation:'balanced',heroes:{astrid:{level:1,xp:0},kael:{level:1,xp:0},mira:{level:1,xp:0}},settlementCooldown:{},rally:null
})
export function defaultState(){return{
 resources:{meat:2200,wood:2200,coal:850,iron:260},
 buildings:{furnace:1,shelter:1,sawmill:1,huntersHut:1,coalMine:1,ironMine:0,storehouse:0,infirmary:0,embassy:0,infantryCamp:0,lancerCamp:0,marksmanCamp:0,researchCenter:0},
 research:{},construction:null,researchJob:null,power:520,lastSavedAt:Date.now(),collectReady:{},claimedChapters:{},world:initialWorld()
}}
const shiftId=id=>{if(typeof id!=='string'||!id.includes(','))return id;const [x,y]=id.split(',').map(Number);if(!Number.isFinite(x)||!Number.isFinite(y))return id;return`${x+SHIFT},${y+SHIFT}`}
const shiftList=list=>(Array.isArray(list)?list:[]).map(shiftId)
const shiftMap=map=>Object.fromEntries(Object.entries(map??{}).map(([k,v])=>[shiftId(k),v]))
function migrateWorld(oldWorld,base){
 const legacy=(oldWorld.mapVersion??1)<MAP_VERSION
 const marches=(Array.isArray(oldWorld.marches)?oldWorld.marches:[]).map(m=>legacy?{...m,target:shiftId(m.target)}:{...m})
 const battleReports=(Array.isArray(oldWorld.battleReports)?oldWorld.battleReports:[]).map(r=>legacy?{...r,target:shiftId(r.target)}:{...r})
 const rally=oldWorld.rally&&legacy?{...oldWorld.rally,target:shiftId(oldWorld.rally.target)}:oldWorld.rally??null
 return{
  ...base,...oldWorld,mapVersion:MAP_VERSION,
  scouted:legacy?shiftList(oldWorld.scouted):Array.isArray(oldWorld.scouted)?oldWorld.scouted:base.scouted,
  owned:legacy?shiftList(oldWorld.owned):Array.isArray(oldWorld.owned)?oldWorld.owned:base.owned,
  defeated:legacy?shiftList(oldWorld.defeated):Array.isArray(oldWorld.defeated)?oldWorld.defeated:[],
  troops:{...base.troops,...oldWorld.troops},heroes:{...base.heroes,...oldWorld.heroes},
  nodeReady:legacy?shiftMap(oldWorld.nodeReady):{...base.nodeReady,...oldWorld.nodeReady},
  settlementCooldown:legacy?shiftMap(oldWorld.settlementCooldown):{...base.settlementCooldown,...oldWorld.settlementCooldown},
  marches,battleReports,rally
 }
}
function migrate(raw){
 const base=defaultState();if(!raw)return base
 const resources={...base.resources,...raw.resources};if(resources.meat==null&&raw.resources?.food!=null)resources.meat=raw.resources.food
 const buildings={...base.buildings,...raw.buildings};if(raw.buildings?.house!=null&&raw.buildings?.shelter==null)buildings.shelter=raw.buildings.house
 const world=migrateWorld(raw.world??{},base.world)
 return{...base,...raw,resources,buildings,world,collectReady:{...base.collectReady,...raw.collectReady},claimedChapters:{...base.claimedChapters,...raw.claimedChapters},lastSavedAt:raw.lastSavedAt??Date.now()}
}
export function loadState(){try{return migrate(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{return defaultState()}}
export function saveState(s){s.lastSavedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(s))}
export function resetState(){localStorage.removeItem(KEY);return defaultState()}
