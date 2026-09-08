export const CHAPTERS=[
 {id:'first-shelter',title:'CHAPTER 1 · KEEP THE FIRE ALIVE',tasks:[['shelter',1],['furnace',2]],reward:{meat:220,wood:260,coal:45,iron:8}},
 {id:'timber',title:'CHAPTER 2 · FEED THE HEARTH',tasks:[['sawmill',2],['furnace',3]],reward:{meat:320,wood:420,coal:70,iron:12}},
 {id:'hunt',title:'CHAPTER 3 · FOOD FOR THE CAMP',tasks:[['huntersHut',3],['furnace',4]],reward:{meat:520,wood:480,coal:100,iron:18}},
 {id:'black-fuel',title:'CHAPTER 4 · BLACK FUEL',tasks:[['coalMine',3],['furnace',5]],reward:{meat:760,wood:850,coal:220,iron:35}},
 {id:'garrison',title:'CHAPTER 5 · RAISE THE GARRISON',tasks:[['infantryCamp',5],['furnace',6]],reward:{meat:1250,wood:1350,coal:340,iron:65}},
 {id:'survive',title:'CHAPTER 6 · KEEP THEM ALIVE',tasks:[['infirmary',6],['furnace',7]],reward:{meat:1800,wood:1900,coal:480,iron:95}},
 {id:'gates',title:'CHAPTER 7 · OPEN THE GATES',tasks:[['embassy',7],['furnace',8]],reward:{meat:2600,wood:2800,coal:720,iron:140}},
 {id:'citadel',title:'CHAPTER 8 · BUILD THE CITADEL',tasks:[['embassy',8],['infirmary',8],['furnace',9],['researchCenter',1]],reward:{meat:4200,wood:4500,coal:1150,iron:240}},
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
