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
 state.guild={id:null,name:'',leader:null,members:{},treasury:{meat:0,wood:0,coal:0,iron:0},level:1,perks:[],wars:[],allies:[],enemies:[],createdAt:0}
 return{ok:true}
}
