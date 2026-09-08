export const CHAPTERS=[
 {id:'ember',title:'CHAPTER 1 · EMBER IN THE SNOW',tasks:[['furnace',2],['sawmill',2],['huntersHut',2]],reward:{meat:500,wood:500,coal:120,iron:20}},
 {id:'black-fuel',title:'CHAPTER 2 · BLACK FUEL',tasks:[['huntersHut',3],['coalMine',3],['furnace',5]],reward:{meat:900,wood:850,coal:260,iron:45}},
 {id:'garrison',title:'CHAPTER 3 · THE GARRISON',tasks:[['infantryCamp',5],['infirmary',3],['furnace',6]],reward:{meat:1300,wood:1200,coal:380,iron:75}},
 {id:'diplomacy',title:'CHAPTER 4 · OPEN THE GATES',tasks:[['embassy',8],['infirmary',8],['furnace',9],['researchCenter',1]],reward:{meat:2200,wood:2000,coal:650,iron:150}},
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
