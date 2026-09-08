export const RESEARCH={
 growth:{label:'Operations',items:{
  tools:{name:'Workflow Automation',max:5,baseCost:{meat:90,wood:120,coal:20,iron:4},seconds:70,requires:[],bonus:{constructionSpeed:.04}},
  architecture:{name:'Process Design',max:5,baseCost:{meat:110,wood:150,coal:30,iron:6},seconds:95,requires:[['tools',2]],bonus:{constructionSpeed:.05}},
  scholarship:{name:'Data & Insight',max:5,baseCost:{meat:140,wood:170,coal:28,iron:7},seconds:110,requires:[['architecture',2]],bonus:{researchSpeed:.05}},
  drafting:{name:'Rapid Scaling',max:5,baseCost:{meat:175,wood:210,coal:38,iron:9},seconds:135,requires:[['scholarship',2]],bonus:{constructionSpeed:.06,researchSpeed:.03}}
 }},
 economy:{label:'Growth',items:{
  hunting:{name:'Cashflow Discipline',max:5,baseCost:{meat:85,wood:95,coal:14,iron:2},seconds:62,requires:[],bonus:{meatOutput:.08}},
  logging:{name:'Smart Procurement',max:5,baseCost:{meat:90,wood:100,coal:16,iron:3},seconds:65,requires:[],bonus:{woodOutput:.08}},
  coal:{name:'Brand Reach',max:5,baseCost:{meat:110,wood:135,coal:24,iron:5},seconds:90,requires:[['logging',2]],bonus:{coalOutput:.08}},
  smelting:{name:'Talent Pipeline',max:5,baseCost:{meat:130,wood:150,coal:30,iron:5},seconds:102,requires:[['coal',2]],bonus:{ironOutput:.08}},
  storage:{name:'Portfolio Optimisation',max:5,baseCost:{meat:125,wood:155,coal:27,iron:6},seconds:105,requires:[['hunting',2],['smelting',2]],bonus:{allOutput:.04}}
 }},
 battle:{label:'People',items:{
  infantry:{name:'Field Team Training',max:5,baseCost:{meat:135,wood:115,coal:20,iron:5},seconds:80,requires:[],bonus:{troopPower:.04}},
  lancer:{name:'Fleet Routing',max:5,baseCost:{meat:140,wood:120,coal:22,iron:5},seconds:84,requires:[['infantry',1]],bonus:{troopPower:.04}},
  marksman:{name:'Specialist Standards',max:5,baseCost:{meat:145,wood:125,coal:24,iron:6},seconds:88,requires:[['infantry',2]],bonus:{troopPower:.05}},
  command:{name:'Operations Leadership',max:5,baseCost:{meat:180,wood:170,coal:34,iron:9},seconds:125,requires:[['lancer',2],['marksman',2]],bonus:{troopPower:.07}}
 }}
}

export function findResearch(id){for(const [branch,b] of Object.entries(RESEARCH))if(b.items[id])return{branch,...b.items[id]};return null}
export function researchCost(def,target){const m=Math.pow(1.65,target-1);return Object.fromEntries(Object.entries(def.baseCost).map(([k,v])=>[k,Math.round(v*m)]))}
