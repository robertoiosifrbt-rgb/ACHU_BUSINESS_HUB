export const HEROES={
 astrid:{name:'Ava',role:'Field Operations Lead',basePower:420,perLevel:95,troop:'infantry',bonus:.18},
 kael:{name:'Noah',role:'Fleet Operations Lead',basePower:390,perLevel:105,troop:'lancer',bonus:.20},
 mira:{name:'Maya',role:'Specialist Services Lead',basePower:405,perLevel:100,troop:'marksman',bonus:.20},
}

export const FORMATIONS={
 balanced:{name:'Balanced Coverage',bonuses:{}},
 shieldWall:{name:'Service Reliability',bonuses:{infantry:.18,marksman:-.05}},
 lancerWedge:{name:'Rapid Dispatch',bonuses:{lancer:.20,infantry:-.05}},
 firingLine:{name:'Premium Delivery',bonuses:{marksman:.20,lancer:-.05}},
}

export const HERO_ORDER=Object.keys(HEROES)
export const FORMATION_ORDER=Object.keys(FORMATIONS)

export function heroPower(state,id=state.world.selectedHero){const def=HEROES[id]??HEROES.astrid,h=state.world.heroes?.[id]??{level:1};return def.basePower+Math.max(0,(h.level??1)-1)*def.perLevel}
export function heroMultiplier(state,id,troops){const def=HEROES[id]??HEROES.astrid,total=Object.values(troops??{}).reduce((a,b)=>a+b,0)||1,share=(troops?.[def.troop]??0)/total;return 1+def.bonus*share}
export function formationMultiplier(state,formation,troops){const def=FORMATIONS[formation]??FORMATIONS.balanced,total=Object.values(troops??{}).reduce((a,b)=>a+b,0)||1;let weighted=0;for(const [type,count] of Object.entries(troops??{}))weighted+=(count/total)*(def.bonuses[type]??0);return 1+weighted}
export function heroXpToNext(level){return 350+Math.max(1,level)*180}
