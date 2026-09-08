export const RESEARCH={
 growth:{label:'Growth',items:{
  tools:{name:'Tool Enhancement',max:5,baseCost:{wood:120,food:90,coal:20,iron:4},seconds:70,requires:[],bonus:{constructionSpeed:.04}},
  architecture:{name:'Architecture',max:5,baseCost:{wood:150,food:110,coal:30,iron:6},seconds:95,requires:[['tools',2]],bonus:{constructionSpeed:.05}},
  scholarship:{name:'Scholarship',max:5,baseCost:{wood:170,food:140,coal:28,iron:7},seconds:110,requires:[['architecture',2]],bonus:{researchSpeed:.05}}
 }},
 economy:{label:'Economy',items:{
  logging:{name:'Efficient Logging',max:5,baseCost:{wood:100,food:90,coal:16,iron:3},seconds:65,requires:[],bonus:{woodOutput:.08}},
  coal:{name:'Deep Mining',max:5,baseCost:{wood:135,food:110,coal:24,iron:5},seconds:90,requires:[['logging',2]],bonus:{coalOutput:.08}},
  storage:{name:'Storehouse Planning',max:5,baseCost:{wood:155,food:125,coal:27,iron:6},seconds:105,requires:[['coal',2]],bonus:{allOutput:.04}}
 }},
 battle:{label:'Battle',items:{
  infantry:{name:'Infantry Drills',max:5,baseCost:{wood:115,food:135,coal:20,iron:5},seconds:80,requires:[],bonus:{troopPower:.04}},
  marksman:{name:'Marksman Tactics',max:5,baseCost:{wood:125,food:145,coal:24,iron:6},seconds:88,requires:[['infantry',2]],bonus:{troopPower:.05}},
  command:{name:'Field Command',max:5,baseCost:{wood:170,food:180,coal:34,iron:9},seconds:125,requires:[['marksman',2]],bonus:{troopPower:.07}}
 }}
}

export function findResearch(id){for(const [branch,b] of Object.entries(RESEARCH))if(b.items[id])return{branch,...b.items[id]};return null}
export function researchCost(def,target){const m=Math.pow(1.65,target-1);return Object.fromEntries(Object.entries(def.baseCost).map(([k,v])=>[k,Math.round(v*m)]))}
