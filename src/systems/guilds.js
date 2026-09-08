export function createGuild(state,name){
 if(state.guild.id)return{ok:false,error:'Already in a business network'}
 if(name.length<3||name.length>20)return{ok:false,error:'Name must be 3-20 chars'}
 state.guild={
  id:'g'+Math.random().toString(36).substr(2,9),
  name,leader:state.playerId,members:{[state.playerId]:{joined:Date.now(),role:'owner'}},
  treasury:{meat:0,wood:0,coal:0,iron:0},level:1,perks:[],wars:[],allies:[],enemies:[],createdAt:Date.now()
 }
 return{ok:true}
}

export function leaveGuild(state){
 if(!state.guild.id)return{ok:false,error:'Not in a business network'}
 if(state.guild.leader===state.playerId)return{ok:false,error:'Network owner cannot leave before transferring or closing it'}
 state.guild={id:null,name:'',leader:null,members:{},treasury:{},level:1,perks:[],wars:[],allies:[],enemies:[],createdAt:0}
 return{ok:true}
}

export function contributeTreasury(state,amount){
 const member=state.guild.members?.[state.playerId]
 if(!member)return{ok:false,error:'Not in a business network'}
 if(state.resources.meat<amount.meat||state.resources.wood<amount.wood||state.resources.coal<amount.coal||state.resources.iron<amount.iron)return{ok:false,error:'Not enough resources'}
 Object.entries(amount).forEach(([k,v])=>{
  state.resources[k]-=v
  state.guild.treasury[k]=(state.guild.treasury[k]??0)+v
 })
 return{ok:true}
}

export function declareWar(state,targetGuildId){
 if(!state.guild.id)return{ok:false,error:'Must be in a business network'}
 if(state.guild.leader!==state.playerId)return{ok:false,error:'Only the network owner can start a market challenge'}
 if(state.guild.enemies.includes(targetGuildId))return{ok:false,error:'Market challenge already active'}
 state.guild.enemies.push(targetGuildId)
 state.guild.wars.push({target:targetGuildId,startedAt:Date.now(),battles:0,wins:0})
 return{ok:true}
}

export function declareAlly(state,targetGuildId){
 if(!state.guild.id)return{ok:false,error:'Must be in a business network'}
 if(state.guild.leader!==state.playerId)return{ok:false,error:'Only the network owner can add strategic partners'}
 if(state.guild.allies.includes(targetGuildId))return{ok:false,error:'Already a strategic partner'}
 state.guild.allies.push(targetGuildId)
 return{ok:true}
}
