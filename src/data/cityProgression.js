export const BUILDING_UNLOCK_FURNACE={
 furnace:1,
 shelter:1,
 sawmill:1,
 huntersHut:2,
 coalMine:3,
 storehouse:3,
 infantryCamp:5,
 infirmary:5,
 ironMine:6,
 lancerCamp:6,
 embassy:7,
 marksmanCamp:8,
 researchCenter:9,
}

export const SYSTEM_UNLOCKS={world:4,army:5,alliance:7,research:9}

export const CITY_STAGES={
 1:{name:'Startup Hub',heat:230},
 2:{name:'Startup Hub',heat:255},
 3:{name:'Local Operator',heat:285},
 4:{name:'Local Operator',heat:315},
 5:{name:'City Network',heat:350},
 6:{name:'City Network',heat:385},
 7:{name:'Regional Brand',heat:425},
 8:{name:'Regional Brand',heat:465},
 9:{name:'Enterprise Group',heat:510},
 10:{name:'Enterprise Group',heat:555},
 11:{name:'National Platform',heat:605},
 12:{name:'National Platform',heat:660},
}

export const unlockLevelForBuilding=id=>BUILDING_UNLOCK_FURNACE[id]??12
export function buildingUnlocked(state,id){
 if(id==='furnace')return true
 if((state.buildings[id]??0)>0)return true
 return(state.buildings.furnace??1)>=unlockLevelForBuilding(id)
}
export function buildingTeased(state,id){
 if(buildingUnlocked(state,id))return true
 return(state.buildings.furnace??1)+1>=unlockLevelForBuilding(id)
}
export const cityHeatRadius=level=>CITY_STAGES[Math.max(1,Math.min(12,level||1))]?.heat??230
