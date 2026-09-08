import { Container } from 'pixi.js'
import { BUILDINGS,buildingRequirements,nextBuildingLevel } from '../../data/buildings.js'
import { buildingEffectLines,buildingRole } from '../../data/buildingProgression.js'
import { panel,text,button,fmt } from './primitives.js'
import { renderFurnacePanel } from './FurnacePanel.js'

function locateRequirement(state,id,target){const d=BUILDINGS[id];if(d.unlockFurnace&&(state.buildings.furnace??0)<d.unlockFurnace)return'furnace';if(d.gate&&id!=='furnace'&&target>(state.buildings.furnace??0))return'furnace';for(const [other,lvl] of(d.requires?.[target]??[]))if((state.buildings[other]??0)<lvl)return other;return null}
export class BuildingSheet extends Container{
 constructor(game){super();this.game=game;this.visible=false}
 open(id){
  if(id==='furnace'){renderFurnacePanel(this,this.game);return}
  this.removeChildren();this.visible=true
  const d=BUILDINGS[id],lvl=this.game.state.buildings[id]??0,target=nextBuildingLevel(this.game.state,id),spec=d.levels[target],req=spec?buildingRequirements(this.game.state,id,target):[],locateId=spec?locateRequirement(this.game.state,id,target):null
  const current=buildingEffectLines(id,lvl),next=spec?buildingEffectLines(id,target):[]
  const w=Math.min(420,window.innerWidth-20),h=Math.min(window.innerHeight-100,356+(current.length+next.length)*17+(locateId?38:0));this.sheetW=w;this.sheetH=h
  const p=panel(w,h,.985,0x0d2833,22);this.addChild(p)
  const title=text(d.name,21,0xffffff,'900');title.position.set(18,14);p.addChild(title)
  const sub=text(`LEVEL ${lvl}/12 · ${d.category.toUpperCase()} · UNLOCK FURNACE ${d.unlockFurnace}`,9,0x9fc6d5,'900');sub.position.set(18,43);p.addChild(sub)
  const role=text(buildingRole(id),10,0xd6e8ed,'700');role.position.set(18,66);p.addChild(role)
  let y=94
  if(lvl>0){const head=text('CURRENT',9,0xffd777,'900');head.position.set(18,y);p.addChild(head);y+=18;for(const line of current){const t=text(line,10,0xa8e7b8,'800');t.position.set(18,y);p.addChild(t);y+=17}y+=6}
  if(spec){
   const head=text(lvl?`NEXT · LEVEL ${target}`:'CONSTRUCT · LEVEL 1',9,0xffd777,'900');head.position.set(18,y);p.addChild(head);y+=18
   for(const line of next){const t=text(line,10,0xcfe8f0,'800');t.position.set(18,y);p.addChild(t);y+=17}y+=4
   const c=spec.cost,costText=text(`COST  Meat ${fmt(c.meat)} · Wood ${fmt(c.wood)} · Coal ${fmt(c.coal)} · Iron ${fmt(c.iron)}`,9,0xffffff,'800');costText.position.set(18,y);p.addChild(costText);y+=21
   const rq=text(req.length?`REQUIRES  ${req.join(' · ')}`:'ALL REQUIREMENTS MET',9,req.length?0xffae9f:0xa8e7b8,'900');rq.position.set(18,y);p.addChild(rq);y+=24
   if(locateId){const go=button(`LOCATE ${BUILDINGS[locateId].name.toUpperCase()}`,w-36,32,0xa76434);go.position.set(18,y);go.on('pointertap',()=>this.game.focusBuilding(locateId));p.addChild(go)}
   const upW=Math.floor((w-54)*.61),busy=this.game.state.construction,up=button(busy?'BUILDER BUSY':lvl===0?'CONSTRUCT':'UPGRADE',upW,42,busy?0x53666f:0x337fa1);up.position.set(18,h-56);if(!busy)up.on('pointertap',()=>this.game.upgradeBuilding(id));p.addChild(up)
   const close=button('CLOSE',Math.floor((w-54)*.35),42,0x526b76);close.position.set(30+upW,h-56);close.on('pointertap',()=>this.visible=false);p.addChild(close)
  }else{const max=text('MAXIMUM LEVEL REACHED',12,0xffd777,'900');max.position.set(18,y+8);p.addChild(max);const close=button('CLOSE',120,42,0x526b76);close.position.set(18,h-56);close.on('pointertap',()=>this.visible=false);p.addChild(close)}
 }
}
