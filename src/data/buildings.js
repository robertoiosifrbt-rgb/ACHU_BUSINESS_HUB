import {FURNACE_LEVELS,FURNACE_REQUIRES} from './furnace.js'
import {BUILDING_UNLOCK_FURNACE} from './cityProgression.js'

const RESOURCE_KEYS=['meat','wood','coal','iron']
const scaleCost=(base,lvl)=>Math.round(base*Math.pow(1.56,lvl-1))
const scaleTime=(base,lvl)=>Math.round(base*Math.pow(1.70,lvl-1))
const levels=(base,time,max=12,powerBase=120)=>Object.fromEntries(Array.from({length:max},(_,i)=>{const l=i+1;return[l,{cost:Object.fromEntries(RESOURCE_KEYS.map(k=>[k,scaleCost(base[k]??0,l)])),seconds:scaleTime(time,l),power:Math.round(powerBase*Math.pow(1.68,l-1))}]}))

export const RESOURCES={
 meat:{label:'Meat',short:'MEAT',color:0xe86464},
 wood:{label:'Wood',short:'WOOD',color:0xc98b4b},
 coal:{label:'Coal',short:'COAL',color:0x4b5661},
 iron:{label:'Iron',short:'IRON',color:0x85a9bb}
}

export const BUILDINGS={
 furnace:{name:'Furnace',category:'core',x:0,y:20,levels:FURNACE_LEVELS,requires:FURNACE_REQUIRES},
 shelter:{name:'Shelter',category:'city',x:-180,y:145,levels:levels({meat:25,wood:38,coal:4,iron:0},22),gate:'furnace',unlockFurnace:BUILDING_UNLOCK_FURNACE.shelter},
 sawmill:{name:'Sawmill',category:'resource',x:180,y:150,levels:levels({meat:34,wood:46,coal:5,iron:0},28),gate:'furnace',unlockFurnace:BUILDING_UNLOCK_FURNACE.sawmill,production:{resource:'wood',base:2.4}},
 huntersHut:{name:"Hunter's Hut",category:'resource',x:285,y:20,levels:levels({meat:42,wood:52,coal:5,iron:0},31),gate:'furnace',unlockFurnace:BUILDING_UNLOCK_FURNACE.huntersHut,production:{resource:'meat',base:2.7}},
 coalMine:{name:'Coal Mine',category:'resource',x:155,y:-105,levels:levels({meat:44,wood:58,coal:4,iron:1},36),gate:'furnace',unlockFurnace:BUILDING_UNLOCK_FURNACE.coalMine,production:{resource:'coal',base:1.35}},
 ironMine:{name:'Iron Mine',category:'resource',x:305,y:190,levels:levels({meat:68,wood:82,coal:18,iron:2},48),gate:'furnace',unlockFurnace:BUILDING_UNLOCK_FURNACE.ironMine,production:{resource:'iron',base:.55}},
 storehouse:{name:'Storehouse',category:'city',x:65,y:245,levels:levels({meat:48,wood:72,coal:10,iron:2},39),gate:'furnace',unlockFurnace:BUILDING_UNLOCK_FURNACE.storehouse},
 infirmary:{name:'Infirmary',category:'city',x:-265,y:-80,levels:levels({meat:58,wood:64,coal:9,iron:2},42),gate:'furnace',unlockFurnace:BUILDING_UNLOCK_FURNACE.infirmary},
 embassy:{name:'Embassy',category:'city',x:-145,y:-210,levels:levels({meat:62,wood:68,coal:10,iron:2},48),gate:'furnace',unlockFurnace:BUILDING_UNLOCK_FURNACE.embassy},
 infantryCamp:{name:'Infantry Camp',category:'military',x:45,y:-225,levels:levels({meat:72,wood:74,coal:11,iron:2},50),gate:'furnace',unlockFurnace:BUILDING_UNLOCK_FURNACE.infantryCamp},
 lancerCamp:{name:'Lancer Camp',category:'military',x:250,y:-245,levels:levels({meat:78,wood:78,coal:13,iron:3},52),gate:'furnace',unlockFurnace:BUILDING_UNLOCK_FURNACE.lancerCamp},
 marksmanCamp:{name:'Marksman Camp',category:'military',x:315,y:-115,levels:levels({meat:76,wood:82,coal:13,iron:3},54),gate:'furnace',unlockFurnace:BUILDING_UNLOCK_FURNACE.marksmanCamp},
 researchCenter:{name:'Research Center',category:'science',x:-305,y:55,levels:levels({meat:82,wood:98,coal:18,iron:5},65),gate:'furnace',unlockFurnace:BUILDING_UNLOCK_FURNACE.researchCenter}
}

export function nextBuildingLevel(state,id){return (state.buildings[id]??0)+1}
export function buildingRequirements(state,id,target){
 const def=BUILDINGS[id];const req=[]
 if(def.unlockFurnace&&(state.buildings.furnace??0)<def.unlockFurnace)req.push(`Furnace ${def.unlockFurnace}`)
 if(def.gate&&id!=='furnace'&&target>(state.buildings.furnace??0))req.push(`Furnace ${target}`)
 for(const [other,lvl] of (def.requires?.[target]??[]))if((state.buildings[other]??0)<lvl)req.push(`${BUILDINGS[other].name} ${lvl}`)
 return req
}

export function resourceProduction(state){
 const out={meat:0,wood:0,coal:0,iron:0}
 for(const [id,def] of Object.entries(BUILDINGS)){
  if(!def.production)continue
  const lvl=state.buildings[id]??0
  if(lvl>0)out[def.production.resource]+=def.production.base*lvl*Math.pow(1.10,Math.max(0,lvl-1))
 }
 return out
}
