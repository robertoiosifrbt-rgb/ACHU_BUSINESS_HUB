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
 1:{name:'Ember Camp',heat:230},
 2:{name:'Ember Camp',heat:255},
 3:{name:'Hearth',heat:285},
 4:{name:'Hearth',heat:315},
 5:{name:'Foundry',heat:350},
 6:{name:'Foundry',heat:385},
 7:{name:'Bastion',heat:425},
 8:{name:'Bastion',heat:465},
 9:{name:'Citadel',heat:510},
 10:{name:'Citadel',heat:555},
 11:{name:'Crown Forge',heat:605},
 12:{name:'Crown Forge',heat:660},
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
