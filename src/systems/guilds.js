export function createGuild(state,name){
 if(state.guild.id)return{ok:false,error:'Already in a guild'}
 if(name.length<3||name.length>20)return{ok:false,error:'Name must be 3-20 chars'}
 state.guild={
  id:'g'+Math.random().toString(36).substr(2,9),
  name,leader:state.playerId,members:{[state.playerId]:{joined:Date.now(),role:'leader'}},
  treasury:{meat:0,wood:0,coal:0,iron:0},level:1,perks:[],wars:[],allies:[],enemies:[],createdAt:Date.now()
 }
 return{ok:true}
}

export function leaveGuild(state){
 if(!state.guild.id)return{ok:false,error:'Not in a guild'}
 if(state.guild.leader===state.playerId)return{ok:false,error:'Leader cannot leave (disband first)'}
 state.guild={id:null,name:'',leader:null,members:{},treasury:{},level:1,perks:[],wars:[],allies:[],enemies:[],createdAt:0}
 return{ok:true}
}

export function contributeTreasury(state,amount){
 const guildMember=state.guild.members?.[state.playerId]
 if(!guildMember)return{ok:false,error:'Not in guild'}
 if(state.resources.meat<amount.meat||state.resources.wood<amount.wood||state.resources.coal<amount.coal||state.resources.iron<amount.iron)
  return{ok:false,error:'Not enough resources'}
 Object.entries(amount).forEach(([k,v])=>{
  state.resources[k]-=v
  state.guild.treasury[k]=(state.guild.treasury[k]??0)+v
 })
 return{ok:true}
}

export function declareWar(state,targetGuildId){
 if(!state.guild.id)return{ok:false,error:'Must be in guild'}
 if(state.guild.leader!==state.playerId)return{ok:false,error:'Only leader can declare war'}
 if(state.guild.enemies.includes(targetGuildId))return{ok:false,error:'Already at war'}
 state.guild.enemies.push(targetGuildId)
 state.guild.wars.push({target:targetGuildId,startedAt:Date.now(),battles:0,wins:0})
 return{ok:true}
}

export function declareAlly(state,targetGuildId){
 if(!state.guild.id)return{ok:false,error:'Must be in guild'}
 if(state.guild.leader!==state.playerId)return{ok:false,error:'Only leader can make alliances'}
 if(state.guild.allies.includes(targetGuildId))return{ok:false,error:'Already allied'}
 state.guild.allies.push(targetGuildId)
 return{ok:true}
}
