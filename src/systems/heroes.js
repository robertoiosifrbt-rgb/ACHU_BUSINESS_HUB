export const HERO_DATA={
 astrid:{name:'Astrid',role:'warrior',class:'knight',stat:{str:18,int:8,agi:12},skills:['slash','shieldWall','challenge']},
 kael:{name:'Kael',role:'mage',class:'sorcerer',stat:{str:8,int:18,agi:10},skills:['fireball','frostbolt','arcaneShield']},
 mira:{name:'Mira',role:'archer',class:'ranger',stat:{str:12,int:10,agi:18},skills:['multishot','pierceShot','evasion']},
 iris:{name:'Iris',role:'healer',class:'cleric',stat:{str:10,int:15,agi:12},skills:['heal','hollyNova','blessing']},
 torven:{name:'Torven',role:'tank',class:'paladin',stat:{str:16,int:12,agi:8},skills:['fortress','counterattack','aura']},
 vex:{name:'Vex',role:'rogue',class:'assassin',stat:{str:12,int:10,agi:16},skills:['backstab','shadowClone','poisons']},
 lyra:{name:'Lyra',role:'support',class:'bard',stat:{str:10,int:14,agi:14},skills:['inspire','harmony','resonate']},
 drax:{name:'Drax',role:'berserker',class:'barbarian',stat:{str:20,int:6,agi:10},skills:['rampage','crush','frenzy']}
}

export function canRecruitHero(state,heroId){
 const hero=HERO_DATA[heroId]
 if(!hero)return false
 if(state.world.heroes[heroId])return false

 const availability=state.heroPool.find(h=>h.id===heroId)?.availability??'start'
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
 if(!canRecruitHero(state,heroId))return{ok:false,error:'Hero not available'}

 const cost={meat:200,wood:150}
 if(state.resources.meat<cost.meat||state.resources.wood<cost.wood)
  return{ok:false,error:'Not enough resources (200 meat, 150 wood)'}

 state.resources.meat-=cost.meat
 state.resources.wood-=cost.wood
 state.world.heroes[heroId]={level:1,xp:0}
 state.prestige.stats.heroesRecruited+=1
 return{ok:true,hero:HERO_DATA[heroId]}
}

export function upgradeHeroSkill(state,heroId,skillName){
 const hero=state.world.heroes[heroId]
 if(!hero)return{ok:false,error:'Hero not recruited'}

 const skills=hero.skills??{}
 if(!skills[skillName]){
  skills[skillName]={level:1,xp:0}
  const cost={meat:100,coal:50}
  if(state.resources.meat<cost.meat||state.resources.coal<cost.coal)
   return{ok:false,error:'Not enough resources'}
  state.resources.meat-=cost.meat
  state.resources.coal-=cost.coal
 }else{
  skills[skillName].level+=1
  const cost={meat:Math.pow(2,skills[skillName].level)*50,coal:Math.pow(2,skills[skillName].level)*25}
  if(state.resources.meat<cost.meat||state.resources.coal<cost.coal)
   return{ok:false,error:'Not enough resources'}
  state.resources.meat-=cost.meat
  state.resources.coal-=cost.coal
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
