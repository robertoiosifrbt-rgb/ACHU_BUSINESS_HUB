export const CHAPTERS=[
 {id:'first-shelter',title:'STAGE 1 · OPEN FOR BUSINESS',tasks:[['shelter',1],['furnace',2]],reward:{meat:220,wood:260,coal:45,iron:8}},
 {id:'timber',title:'STAGE 2 · BUILD THE OPERATION',tasks:[['sawmill',2],['furnace',3]],reward:{meat:320,wood:420,coal:70,iron:12}},
 {id:'hunt',title:'STAGE 3 · FILL THE PIPELINE',tasks:[['huntersHut',3],['furnace',4]],reward:{meat:520,wood:480,coal:100,iron:18}},
 {id:'black-fuel',title:'STAGE 4 · BUILD THE BRAND',tasks:[['coalMine',3],['furnace',5]],reward:{meat:760,wood:850,coal:220,iron:35}},
 {id:'garrison',title:'STAGE 5 · BUILD THE TEAM',tasks:[['infantryCamp',5],['furnace',6]],reward:{meat:1250,wood:1350,coal:340,iron:65}},
 {id:'survive',title:'STAGE 6 · RAISE THE STANDARD',tasks:[['infirmary',6],['furnace',7]],reward:{meat:1800,wood:1900,coal:480,iron:95}},
 {id:'gates',title:'STAGE 7 · BUILD THE NETWORK',tasks:[['embassy',7],['furnace',8]],reward:{meat:2600,wood:2800,coal:720,iron:140}},
 {id:'citadel',title:'STAGE 8 · SCALE THE COMPANY',tasks:[['embassy',8],['infirmary',8],['furnace',9],['researchCenter',1]],reward:{meat:4200,wood:4500,coal:1150,iron:240}},
]

export function currentChapter(state){
 for(const chapter of CHAPTERS)if(!state.claimedChapters?.[chapter.id])return chapter
 return null
}
export function chapterStatus(state,chapter){
 if(!chapter)return{done:true,complete:0,total:0,next:null}
 const complete=chapter.tasks.filter(([id,lvl])=>(state.buildings[id]??0)>=lvl).length
 const next=chapter.tasks.find(([id,lvl])=>(state.buildings[id]??0)<lvl)??null
 return{done:complete===chapter.tasks.length,complete,total:chapter.tasks.length,next}
}
