import { worldTile,parseTile,adjacentTo } from '../data/world.js'

const SIZE=21
const id=(x,y)=>`${x},${y}`
const allTiles=()=>{const out=[];for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)out.push(id(x,y));return out}

function distanceFromOwned(tile,owned){
 const [x,y]=parseTile(tile)
 let best=99
 for(const o of owned){const [ox,oy]=parseTile(o);best=Math.min(best,Math.abs(x-ox)+Math.abs(y-oy))}
 return best
}

function nearest(list,owned){return [...list].sort((a,b)=>distanceFromOwned(a,owned)-distanceFromOwned(b,owned))[0]??null}

export function fourXFlow(state){
 const w=state.world,scouted=new Set(w.scouted??[]),owned=new Set(w.owned??[]),defeated=new Set(w.defeated??[]),tiles=allTiles()
 const researchable=tiles.filter(t=>!scouted.has(t)&&adjacentTo(t,[...scouted]))
 const expandable=tiles.filter(t=>scouted.has(t)&&!owned.has(t)&&adjacentTo(t,[...owned])&&!['camp','settlement'].includes(worldTile(...parseTile(t)).kind))
 const operable=tiles.filter(t=>owned.has(t)&&worldTile(...parseTile(t)).kind==='resource'&&Date.now()>=(w.nodeReady?.[t]??0))
 const contracts=tiles.filter(t=>scouted.has(t)&&['camp','settlement'].includes(worldTile(...parseTile(t)).kind)&&!defeated.has(t))
 const firstContract=nearest(contracts,[...owned])
 const firstOperate=nearest(operable,[...owned])
 const firstExpand=nearest(expandable,[...owned])
 const firstExplore=nearest(researchable,[...owned])

 if((w.scouted?.length??0)<4)return{
  key:'explore',index:0,label:'EXPLORE',eyebrow:'ACT I · FIND THE WORK',title:'The city does not know ACHU yet',copy:'Research nearby streets. Find where clients, suppliers and contracts actually are.',target:firstExplore,action:'RESEARCH THE NEXT AREA',metric:`${w.scouted.length}/4 areas understood`
 }
 if((w.owned?.length??0)<3)return{
  key:'expand',index:1,label:'EXPAND',eyebrow:'ACT II · CHOOSE YOUR GROUND',title:'Do not serve everywhere. Own a route.',copy:'Turn researched neighbourhoods into service areas so crews can operate there.',target:firstExpand,action:'OPEN A SERVICE AREA',metric:`${w.owned.length}/3 areas on your route`
 }
 if((w.defeated?.length??0)<1&&firstOperate)return{
  key:'operate',index:2,label:'OPERATE',eyebrow:'ACT III · MAKE THE MAP PAY',title:'A footprint is useless without work',copy:'Send a crew to a live opportunity and turn territory into cash, supplies, reputation or talent.',target:firstOperate,action:'SEND A CREW',metric:`${w.marches.length} crews currently deployed`
 }
 if((w.defeated?.length??0)<1)return{
  key:'compete',index:3,label:'COMPETE',eyebrow:'ACT IV · PROVE THE COMPANY',title:'Win the first serious contract',copy:'Find a commercial opportunity. Your crew strength must beat its difficulty.',target:firstContract,action:'OPEN CONTRACT',metric:`Crew strength ${Math.round(state.world.armyPower??0).toLocaleString()}`
 }
 const expansionTarget=firstExplore??firstExpand??firstOperate??firstContract
 return{
  key:'scale',index:3,label:'SCALE',eyebrow:'THE COMPANY IS ON THE MAP',title:'Grow faster than the city can ignore',copy:'Explore farther, add profitable areas, operate opportunities and win harder contracts.',target:expansionTarget,action:'CONTINUE EXPANSION',metric:`${w.owned.length} areas · ${w.defeated.length} contracts`
 }
}

export const FOUR_X_STEPS=[
 {key:'explore',label:'EXPLORE',copy:'Discover demand'},
 {key:'expand',label:'EXPAND',copy:'Open service areas'},
 {key:'operate',label:'OPERATE',copy:'Turn territory into value'},
 {key:'compete',label:'COMPETE',copy:'Win contracts'}
]
