const scaleCost=(base,lvl)=>Math.round(base*Math.pow(1.58,lvl-1))
const scaleTime=(base,lvl)=>Math.round(base*Math.pow(1.72,lvl-1))
const levels=(base,time,max=10)=>Object.fromEntries(Array.from({length:max},(_,i)=>{const l=i+1;return[l,{cost:{wood:scaleCost(base.wood,l),food:scaleCost(base.food,l),coal:scaleCost(base.coal,l),iron:scaleCost(base.iron,l)},seconds:scaleTime(time,l),power:Math.round(120*Math.pow(1.7,l-1))}]}))

export const BUILDINGS={
  furnace:{name:'Furnace',x:0,y:0,levels:levels({wood:80,food:70,coal:20,iron:4},55),requires:{2:[],3:[['house',2]],4:[['sawmill',3]],5:[['coalMine',3]],6:[['infantryCamp',5]],7:[['infirmary',6]],8:[['embassy',7]],9:[['embassy',8],['infirmary',1]],10:[['marksmanCamp',9],['researchCenter',1]]}},
  house:{name:'Shelter',x:-260,y:120,levels:levels({wood:35,food:25,coal:4,iron:0},22),gate:'furnace'},
  sawmill:{name:'Sawmill',x:280,y:130,levels:levels({wood:45,food:35,coal:5,iron:0},28),gate:'furnace',production:{wood:2.2}},
  coalMine:{name:'Coal Mine',x:360,y:-110,levels:levels({wood:55,food:40,coal:3,iron:1},34),gate:'furnace',production:{coal:1.15}},
  infirmary:{name:'Infirmary',x:-360,y:-80,levels:levels({wood:60,food:55,coal:9,iron:2},42),gate:'furnace'},
  embassy:{name:'Embassy',x:-170,y:-220,levels:levels({wood:65,food:60,coal:10,iron:2},48),gate:'furnace'},
  infantryCamp:{name:'Infantry Camp',x:175,y:-235,levels:levels({wood:70,food:65,coal:11,iron:2},50),gate:'furnace'},
  marksmanCamp:{name:'Marksman Camp',x:455,y:45,levels:levels({wood:72,food:68,coal:12,iron:3},52),gate:'furnace'},
  researchCenter:{name:'Research Center',x:-455,y:55,levels:levels({wood:95,food:80,coal:18,iron:5},65),gate:'furnace',unlockFurnace:9}
}

export function nextBuildingLevel(state,id){return (state.buildings[id]??0)+1}
export function buildingRequirements(state,id,target){
  const def=BUILDINGS[id];const req=[]
  if(def.unlockFurnace && (state.buildings.furnace??0)<def.unlockFurnace) req.push(`Furnace ${def.unlockFurnace}`)
  if(def.gate && id!=='furnace' && target>(state.buildings.furnace??0)) req.push(`Furnace ${target}`)
  for(const [other,lvl] of (def.requires?.[target]??[])) if((state.buildings[other]??0)<lvl) req.push(`${BUILDINGS[other].name} ${lvl}`)
  return req
}
