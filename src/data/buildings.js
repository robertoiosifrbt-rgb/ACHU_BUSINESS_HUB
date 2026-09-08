import {FURNACE_LEVELS,FURNACE_REQUIRES} from './furnace.js'
import {BUILDING_PROGRESSION,buildingEffects} from './buildingProgression.js'

export const RESOURCES={
 meat:{label:'Cash',short:'CASH',color:0x54d39b,icon:'£'},
 wood:{label:'Supplies',short:'SUP',color:0x62b8ff,icon:'◆'},
 coal:{label:'Reputation',short:'REP',color:0xf3b95f,icon:'★'},
 iron:{label:'Talent',short:'TAL',color:0xc89cff,icon:'●'}
}

const b=(id,name,category,description,extra={})=>{
 const p=BUILDING_PROGRESSION[id]
 return{name,category,description,levels:p.levels,unlockFurnace:p.unlockFurnace,gate:'furnace',role:p.role,production:p.production,...extra}
}

export const BUILDINGS={
 furnace:{name:'Headquarters',category:'core',description:'The heart of the company. Upgrade it to unlock new divisions, systems and markets.',levels:FURNACE_LEVELS,requires:FURNACE_REQUIRES},
 shelter:b('shelter','Client Centre','service','Turns enquiries into organised client relationships and unlocks service capacity.'),
 sawmill:b('sawmill','Supply Depot','operations','Keeps equipment, consumables and field teams supplied.',{theme:'logistics'}),
 huntersHut:b('huntersHut','Sales Office','growth','Generates new business opportunities and feeds the contract pipeline.'),
 coalMine:b('coalMine','Marketing Studio','growth','Builds brand awareness and reputation across new markets.'),
 storehouse:b('storehouse','Central Warehouse','operations','Protects stock and supports larger operating capacity.'),
 infantryCamp:b('infantryCamp','Field Academy','people','Recruits and trains frontline service teams.'),
 infirmary:b('infirmary','Quality Centre','service','Improves standards, recovery and client satisfaction.'),
 ironMine:b('ironMine','Recruitment Hub','people','Finds stronger candidates and expands the talent pool.'),
 lancerCamp:b('lancerCamp','Fleet Depot','operations','Adds mobile capacity for faster dispatch and wider coverage.'),
 embassy:b('embassy','Partnership Office','network','Unlocks partner support, cooperation and larger shared opportunities.'),
 marksmanCamp:b('marksmanCamp','Specialist Unit','people','Develops high-skill teams for premium and complex contracts.'),
 researchCenter:b('researchCenter','Innovation Lab','systems','Improves automation, processes, data and company-wide efficiency.'),
}

export function nextBuildingLevel(state,id){return (state.buildings[id]??0)+1}
export function buildingRequirements(state,id,target){
 const def=BUILDINGS[id];const req=[]
 if(def.unlockFurnace&&(state.buildings.furnace??0)<def.unlockFurnace)req.push(`Headquarters ${def.unlockFurnace}`)
 if(def.gate&&id!=='furnace'&&target>(state.buildings.furnace??0))req.push(`Headquarters ${target}`)
 for(const [other,lvl] of(def.requires?.[target]??[]))if((state.buildings[other]??0)<lvl)req.push(`${BUILDINGS[other].name} ${lvl}`)
 return req
}

export function buildingOutputPerSecond(state,id){
 const def=BUILDINGS[id],lvl=state.buildings[id]??0
 if(!def?.production||!lvl)return 0
 return buildingEffects(id,lvl)?.output??0
}
export function resourceProduction(state){
 const out={meat:0,wood:0,coal:0,iron:0}
 for(const [id,def] of Object.entries(BUILDINGS))if(def.production)out[def.production.resource]+=buildingOutputPerSecond(state,id)
 return out
}
