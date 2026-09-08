const ACHIEVEMENT_DEFINITIONS={
 firstBattle:{name:'First Blood',desc:'Win your first battle',icon:'⚔️',reward:50},
 tenBattles:{name:'Veteran',desc:'Win 10 battles',icon:'🛡️',reward:200},
 gatherThousand:{name:'Harvester',desc:'Gather 1000 resources',icon:'🌾',reward:150},
 buildTenBuildngs:{name:'Architect',desc:'Build 10 buildings',icon:'🏰',reward:300},
 reachRank5:{name:'Rising Star',desc:'Reach rank 5',icon:'⭐',reward:500},
 joinGuild:{name:'Unite',desc:'Join a guild',icon:'👥',reward:100},
 recruitFiveHeroes:{name:'Commander',desc:'Recruit 5 heroes',icon:'👑',reward:400},
 completeEventChain:{name:'Chosen One',desc:'Complete an event chain',icon:'✨',reward:250}
}

const BADGE_TIERS={
 bronze:{name:'Bronze Badge',requirement:100},
 silver:{name:'Silver Badge',requirement:500},
 gold:{name:'Gold Badge',requirement:2000},
 platinum:{name:'Platinum Badge',requirement:5000}
}

export function checkAchievements(state){
 const unlocked=[]

 if(state.prestige.stats.battlesWon===1&&!state.prestige.achievements.firstBattle){
  state.prestige.achievements.firstBattle=true
  unlocked.push(ACHIEVEMENT_DEFINITIONS.firstBattle)
 }

 if(state.prestige.stats.battlesWon>=10&&!state.prestige.achievements.tenBattles){
  state.prestige.achievements.tenBattles=true
  unlocked.push(ACHIEVEMENT_DEFINITIONS.tenBattles)
 }

 if(state.prestige.stats.resourcesGathered>=1000&&!state.prestige.achievements.gatherThousand){
  state.prestige.achievements.gatherThousand=true
  unlocked.push(ACHIEVEMENT_DEFINITIONS.gatherThousand)
 }

 if(Object.values(state.buildings).reduce((a,b)=>a+b,0)>=10&&!state.prestige.achievements.buildTenBuildings){
  state.prestige.achievements.buildTenBuildings=true
  unlocked.push(ACHIEVEMENT_DEFINITIONS.buildTenBuildngs)
 }

 if(state.guild.id&&!state.prestige.achievements.joinGuild){
  state.prestige.achievements.joinGuild=true
  unlocked.push(ACHIEVEMENT_DEFINITIONS.joinGuild)
 }

 if(Object.values(state.world.heroes).length>=5&&!state.prestige.achievements.recruitFiveHeroes){
  state.prestige.achievements.recruitFiveHeroes=true
  unlocked.push(ACHIEVEMENT_DEFINITIONS.recruitFiveHeroes)
 }

 unlocked.forEach(a=>state.prestige.prestige+=a.reward)
 return unlocked
}

export function updatePrestigeRank(state){
 const totalScore=state.prestige.totalPower+state.prestige.totalBuildings*100+Object.keys(state.prestige.achievements).length*50
 const newRank=Math.floor(1+totalScore/1000)

 if(newRank>state.prestige.rank){
  state.prestige.rank=newRank
  const tier=Object.entries(BADGE_TIERS).reverse().find(([,def])=>newRank>=def.requirement/100)?.[0]
  if(tier&&!state.prestige.badges.includes(tier)){
   state.prestige.badges.push(tier)
   return{ranked:true,newRank,badge:BADGE_TIERS[tier].name}
  }
  return{ranked:true,newRank}
 }
 return{ranked:false}
}

export function recordBattleWin(state){
 state.prestige.stats.battlesWon+=1
 state.prestige.totalPower+=Math.random()*100+50
 const achievements=checkAchievements(state)
 const rank=updatePrestigeRank(state)
 return{achievements,rank}
}

export function recordBattleLoss(state){
 state.prestige.stats.battlesLost+=1
 state.prestige.totalPower+=Math.random()*20+5
}

export function recordResourceGather(state,amount){
 state.prestige.stats.resourcesGathered+=amount
}

export function recordTerritoryOwned(state,amount){
 state.prestige.stats.territoriesOwned+=amount
 state.prestige.totalBuildings+=1
}
