import { worldTile,parseTile,adjacentTo } from '../data/world.js'

const SIZE=21
const id=(x,y)=>`${x},${y}`
const allTiles=()=>{const out=[];for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)out.push(id(x,y));return out}

function distanceFromCovered(tile,covered){
 const [x,y]=parseTile(tile)
 let best=99
 for(const o of covered){const [ox,oy]=parseTile(o);best=Math.min(best,Math.abs(x-ox)+Math.abs(y-oy))}
 return best
}
function nearest(list,covered){return [...list].sort((a,b)=>distanceFromCovered(a,covered)-distanceFromCovered(b,covered))[0]??null}

export function fourXFlow(state){
 const w=state.world,known=new Set(w.scouted??[]),covered=new Set(w.owned??[]),won=new Set(w.defeated??[]),tiles=allTiles()
 const researchable=tiles.filter(t=>!known.has(t)&&adjacentTo(t,[...known]))
 const expandable=tiles.filter(t=>known.has(t)&&!covered.has(t)&&adjacentTo(t,[...covered])&&!['camp','settlement'].includes(worldTile(...parseTile(t)).kind))
 const jobs=tiles.filter(t=>covered.has(t)&&worldTile(...parseTile(t)).businessType==='lead'&&Date.now()>=(w.nodeReady?.[t]??0))
 const tenders=tiles.filter(t=>known.has(t)&&['camp','settlement'].includes(worldTile(...parseTile(t)).kind)&&!won.has(t))
 const targetResearch=nearest(researchable,[...covered]),targetExpand=nearest(expandable,[...covered]),targetJob=nearest(jobs,[...covered]),targetTender=nearest(tenders,[...covered])

 if((w.scouted?.length??0)<4)return{
  key:'explore',index:0,label:'EXPLORE',eyebrow:'ACT I · UNDERSTAND THE MARKET',title:'Find where cleaning demand actually is',copy:'Research nearby neighbourhoods to reveal demand, average job value, travel time, property mix and competition.',target:targetResearch,action:'RESEARCH A MARKET',metric:`${w.scouted.length}/4 markets understood`
 }
 if((w.owned?.length??0)<3)return{
  key:'expand',index:1,label:'EXPAND',eyebrow:'ACT II · OPEN COVERAGE',title:'Choose an area the operation can really serve',copy:'Open service coverage only where travel, demand and team capacity make sense. Coverage unlocks real cleaning enquiries.',target:targetExpand,action:'OPEN SERVICE COVERAGE',metric:`${w.owned.length}/3 active coverage areas`
 }
 if((w.defeated?.length??0)<1&&targetJob)return{
  key:'operate',index:2,label:'OPERATE',eyebrow:'ACT III · DELIVER THE SERVICE',title:'Turn market reach into a completed cleaning job',copy:'Review the enquiry, accept the quote and dispatch an available crew. Revenue and reputation arrive only after the job is completed.',target:targetJob,action:'ACCEPT A CLEANING JOB',metric:`${w.marches.length} field operation${w.marches.length===1?'':'s'} active`
 }
 if((w.defeated?.length??0)<1)return{
  key:'compete',index:3,label:'COMPETE',eyebrow:'ACT IV · WIN A CONTRACT',title:'Submit the first serious commercial bid',copy:'Compare the contract requirements with ACHU capability. Strong training, quality, fleet and staffing improve the bid.',target:targetTender,action:'OPEN A TENDER',metric:`Operational capability ${Math.round(state.world.armyPower??0).toLocaleString()}+`
 }
 const target=targetJob??targetTender??targetResearch??targetExpand
 return{
  key:'scale',index:3,label:'SCALE',eyebrow:'THE BUSINESS IS WORKING',title:'Build a stronger local operation before going wider',copy:'Keep researching markets, opening viable coverage, completing jobs and bidding for contracts. Every 4X action must strengthen the cleaning company.',target,action:'CONTINUE GROWTH',metric:`${w.owned.length} coverage areas · ${w.defeated.length} contracts won`
 }
}

export const FOUR_X_STEPS=[
 {key:'explore',label:'EXPLORE',copy:'Research demand'},
 {key:'expand',label:'EXPAND',copy:'Open coverage'},
 {key:'operate',label:'OPERATE',copy:'Complete jobs'},
 {key:'compete',label:'COMPETE',copy:'Win contracts'}
]
