import {FURNACE_LEVELS,FURNACE_REQUIRES} from './furnace.js'
import {BUILDING_PROGRESSION,buildingEffects} from './buildingProgression.js'

export const RESOURCES={
 meat:{label:'Meat',short:'MEAT',color:0xe86464},
 wood:{label:'Wood',short:'WOOD',color:0xc98b4b},
 coal:{label:'Coal',short:'COAL',color:0x4b5661},
 iron:{label:'Iron',short:'IRON',color:0x85a9bb}
}

const b=(id,name,category,extra={})=>{
 const p=BUILDING_PROGRESSION[id]
 return{name,category,levels:p.levels,unlockFurnace:p.unlockFurnace,gate:'furnace',role:p.role,production:p.production,...extra}
}

export const BUILDINGS={
 furnace:{name:'Furnace',category:'core',levels:FURNACE_LEVELS,requires:FURNACE_REQUIRES},
 shelter:b('shelter','Shelter','city'),
 sawmill:b('sawmill','Sawmill','resource'),
 huntersHut:b('huntersHut',"Hunter's Hut",'resource'),
 coalMine:b('coalMine','Coal Mine','resource'),
 storehouse:b('storehouse','Storehouse','city'),
 infantryCamp:b('infantryCamp','Infantry Camp','military'),
 infirmary:b('infirmary','Infirmary','city'),
 ironMine:b('ironMine','Iron Mine','resource'),
 lancerCamp:b('lancerCamp','Lancer Camp','military'),
 embassy:b('embassy','Embassy','city'),
 marksmanCamp:b('marksmanCamp','Marksman Camp','military'),
 researchCenter:b('researchCenter','Research Center','science'),
}

export function nextBuildingLevel(state,id){return (state.buildings[id]??0)+1}
export function buildingRequirements(state,id,target){
 const def=BUILDINGS[id];const req=[]
 if(def.unlockFurnace&&(state.buildings.furnace??0)<def.unlockFurnace)req.push(`Furnace ${def.unlockFurnace}`)
 if(def.gate&&id!=='furnace'&&target>(state.buildings.furnace??0))req.push(`Furnace ${target}`)
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
