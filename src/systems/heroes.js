export const HERO_DATA={
 astrid:{name:'Ava',role:'operations',class:'field lead',stat:{str:18,int:8,agi:12},skills:['teamBriefing','qualityControl','clientRecovery']},
 kael:{name:'Noah',role:'logistics',class:'fleet lead',stat:{str:8,int:18,agi:10},skills:['routePlanning','capacityShift','supplierControl']},
 mira:{name:'Maya',role:'specialist',class:'service lead',stat:{str:12,int:10,agi:18},skills:['premiumStandards','rapidAudit','clientRetention']},
 iris:{name:'Iris',role:'people',class:'people lead',stat:{str:10,int:15,agi:12},skills:['coaching','onboarding','engagement']},
 torven:{name:'Theo',role:'quality',class:'quality lead',stat:{str:16,int:12,agi:8},skills:['processControl','riskReview','recoveryPlan']},
 vex:{name:'Vera',role:'sales',class:'growth lead',stat:{str:12,int:10,agi:16},skills:['leadQualification','negotiation','upsell']},
 lyra:{name:'Lina',role:'network',class:'partnership lead',stat:{str:10,int:14,agi:14},skills:['partnerBoost','referrals','jointDelivery']},
 drax:{name:'Darius',role:'expansion',class:'regional lead',stat:{str:20,int:6,agi:10},skills:['marketEntry','fastScale','turnaround']}
}

const availabilityFor=(state,heroId)=>state.heroPool?.[heroId]?.availability??'start'

export function canRecruitHero(state,heroId){
 const hero=HERO_DATA[heroId]
 if(!hero)return false
 if(state.world.heroes[heroId])return false
 const availability=availabilityFor(state,heroId)
 if(availability==='start')return true
 if(availability.startsWith('unlock:')){
  const [,type,target,level]=availability.split(':')
  if(type==='researchCenter')return(state.buildings.researchCenter??0)>=parseInt(level)
  if(type==='embassy')return(state.buildings.embassy??0)>=parseInt(level)
  if(type==='research')return(state.research[target]??0)>=parseInt(level)
  if(type==='troops')return Object.values(state.world.troops??{}).reduce((a,b)=>a+b,0)>=parseInt(level)
  if(type==='battles')return state.prestige.stats.battlesWon>=parseInt(level)
 }
 return false
}

export function recruitHero(state,heroId){
 if(!canRecruitHero(state,heroId))return{ok:false,error:'Manager not available'}
 const cost={meat:200,wood:150}
 if(state.resources.meat<cost.meat||state.resources.wood<cost.wood)return{ok:false,error:'Not enough Cash and Supplies'}
 state.resources.meat-=cost.meat
 state.resources.wood-=cost.wood
 state.world.heroes[heroId]={level:1,xp:0}
 state.prestige.stats.heroesRecruited+=1
 return{ok:true,hero:HERO_DATA[heroId]}
}

export function upgradeHeroSkill(state,heroId,skillName){
 const hero=state.world.heroes[heroId]
 if(!hero)return{ok:false,error:'Manager not recruited'}
 const skills=hero.skills??{}
 if(!skills[skillName]){
  const cost={meat:100,coal:50}
  if(state.resources.meat<cost.meat||state.resources.coal<cost.coal)return{ok:false,error:'Not enough Cash and Reputation'}
  state.resources.meat-=cost.meat
  state.resources.coal-=cost.coal
  skills[skillName]={level:1,xp:0}
 }else{
  const next=skills[skillName].level+1,cost={meat:Math.pow(2,next)*50,coal:Math.pow(2,next)*25}
  if(state.resources.meat<cost.meat||state.resources.coal<cost.coal)return{ok:false,error:'Not enough Cash and Reputation'}
  state.resources.meat-=cost.meat
  state.resources.coal-=cost.coal
  skills[skillName].level=next
 }
 hero.skills=skills
 return{ok:true}
}

export function getHeroPower(state,heroId){
 const hero=state.world.heroes[heroId]
 if(!hero)return 0
 const data=HERO_DATA[heroId]
 const basePower=Object.values(data.stat).reduce((a,b)=>a+b,0)*2
 const levelBonus=(hero.level-1)*15
 const skillBonus=Object.values(hero.skills??{}).reduce((a,s)=>a+(s.level??0)*5,0)
 return Math.round(basePower+levelBonus+skillBonus)
}
