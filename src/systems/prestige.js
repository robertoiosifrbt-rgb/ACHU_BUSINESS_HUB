export function recordBattleWin(state){
 state.prestige.stats.battlesWon++
 checkAchievements(state)
}

export function recordBattleLoss(state){
 state.prestige.stats.battlesLost++
 checkAchievements(state)
}

function checkAchievements(state){
 if(state.prestige.stats.battlesWon===1&&!state.prestige.achievements.firstVictory){
  state.prestige.achievements.firstVictory=true
  state.prestige.badges.push('FIRST_VICTORY')
 }
 if(state.prestige.stats.battlesWon===10&&!state.prestige.achievements.warmaster){
  state.prestige.achievements.warmaster=true
  state.prestige.badges.push('WARMASTER')
 }
}
