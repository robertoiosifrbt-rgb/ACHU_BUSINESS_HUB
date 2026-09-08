const KEY='build_strategy_v13_furnace_first'
const LEGACY_KEYS=['build_strategy_v04','build_strategy_v03','build_strategy_v02','build_strategy_backup']
export const DEMO_SPEED=120
const MAP_VERSION=2
const SHIFT=5
const initialWorld=()=>({
 mapVersion:MAP_VERSION,
 scouted:['10,10'],owned:['10,10'],defeated:[],nodeReady:{},armyPower:60,
 troops:{infantry:12,lancer:0,marksman:0},marches:[],battleReports:[],trainingJob:null,
 selectedHero:'astrid',formation:'balanced',heroes:{astrid:{level:1,xp:0},kael:{level:1,xp:0},mira:{level:1,xp:0}},settlementCooldown:{},rally:null
})
export function defaultState(){return{
 playerId:'p'+Math.random().toString(36).substr(2,9),
 resources:{meat:900,wood:1000,coal:180,iron:35},
 buildings:{furnace:1,shelter:0,sawmill:0,huntersHut:0,coalMine:0,ironMine:0,storehouse:0,infirmary:0,embassy:0,infantryCamp:0,lancerCamp:0,marksmanCamp:0,researchCenter:0},
 research:{},construction:null,researchJob:null,power:190,lastSavedAt:Date.now(),collectReady:{},claimedChapters:{},world:initialWorld(),
 guild:{id:null,name:'',leader:null,members:{},treasury:{},level:1,perks:[],wars:[],allies:[],enemies:[],createdAt:0},
 events:{active:[],completed:[],log:[],nextEventAt:Date.now()+Math.random()*120000+60000},
 heroPool:{astrid:{level:1,xp:0},kael:{level:1,xp:0},mira:{level:1,xp:0},iris:{level:1,xp:0},torven:{level:1,xp:0},vex:{level:1,xp:0},lyra:{level:1,xp:0},drax:{level:1,xp:0}},
 marketplace:{listings:[],transactionHistory:[]},
 prestige:{battlesWon:0,battlesLost:0,resourcesGathered:0,territoriesOwned:1,heroesRecruited:0,buildingsUpgraded:0,rank:'bronze'}
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
 return{...base,...raw,resources,buildings,world,collectReady:{...base.collectReady,...raw.collectReady},claimedChapters:{...base.claimedChapters,...raw.claimedChapters},guild:{...base.guild,...raw.guild},events:{...base.events,...raw.events},heroPool:{...base.heroPool,...raw.heroPool},marketplace:{...base.marketplace,...raw.marketplace},prestige:{...base.prestige,...raw.prestige},lastSavedAt:raw.lastSavedAt??Date.now()}
}
const parse=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}}
const score=s=>{if(!s)return-1;const b=Object.values(s.buildings??{}).reduce((a,n)=>a+(Number(n)||0),0),r=Object.values(s.resources??{}).reduce((a,n)=>a+Math.log10(1+Math.max(0,Number(n)||0)),0),troops=Object.values(s.world?.troops??{}).reduce((a,n)=>a+(Number(n)||0),0);return b*10000+(Number(s.power)||0)+r+troops}
export function loadState(){
 const candidates=[KEY,...LEGACY_KEYS].map(k=>({k,raw:parse(k)})).filter(x=>x.raw)
 if(!candidates.length)return defaultState()
 candidates.sort((a,b)=>score(b.raw)-score(a.raw))
 const best=migrate(candidates[0].raw)
 try{localStorage.setItem(KEY,JSON.stringify(best))}catch{}
 return best
}
export function saveState(s){s.lastSavedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(s))}
export function resetState(){
 const current=parse(KEY)
 if(current)try{localStorage.setItem('build_strategy_backup',JSON.stringify(current))}catch{}
 localStorage.removeItem(KEY)
 return defaultState()
}
