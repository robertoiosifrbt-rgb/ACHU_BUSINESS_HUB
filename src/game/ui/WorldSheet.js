import {Container} from 'pixi.js'
import {worldTile,parseTile,adjacentTo,FACTIONS} from '../../data/world.js'
import {REGIONS} from '../../data/regions.js'
import {panel,text,button,fmt,fmtTime} from './primitives.js'

export class WorldSheet extends Container{
 constructor(game){super();this.game=game;this.visible=false;this.sheetW=390;this.sheetH=374;this.tileId=null}
 open(id){this.tileId=id;this.render()}
 render(){
  const id=this.tileId;if(!id)return;this.removeChildren();this.visible=true
  const [x,y]=parseTile(id),d=worldTile(x,y),w=this.game.state.world,scouted=w.scouted.includes(id),owned=w.owned.includes(id),defeated=w.defeated.includes(id),march=this.game.activeMarchFor(id),burning=(w.settlementCooldown?.[id]??0)>Date.now(),rally=w.rally?.target===id,adjacent=adjacentTo(id,w.owned),hostile=['camp','settlement'].includes(d.kind),canScout=!scouted&&adjacentTo(id,w.scouted),canClaim=scouted&&!owned&&!hostile&&adjacent,canAttack=scouted&&hostile&&adjacent&&!march&&!rally&&!(d.kind==='camp'&&defeated)&&!burning,canRally=scouted&&hostile&&adjacent&&!march&&!w.rally&&!(d.kind==='camp'&&defeated)&&!burning,canGather=scouted&&owned&&d.kind==='resource'
  const width=Math.min(390,window.innerWidth-20),h=374;this.sheetW=width;this.sheetH=h;const p=panel(width,h,.98,0x0c2732,22);this.addChild(p)
  const title=text(scouted?(d.kind==='settlement'?`[${d.tag}] ${d.name}`:d.name):'Unexplored territory',20,0xffffff,'900');title.position.set(18,16);p.addChild(title)
  const region=REGIONS[d.region]?.name??'Unknown region',meta=text(`${region} · ${scouted?`Level ${d.level??1}`:'Fog of war'}`,10,0x9fc5d3,'800');meta.position.set(18,45);p.addChild(meta)
  const status=text(burning?'BURNING':owned?'YOUR TERRITORY':rally?'RALLY FORMING':scouted?(d.faction?`${FACTIONS[d.faction]?.name??d.faction} INFLUENCE`:'SCOUTED'):'UNEXPLORED',10,burning?0xff9b74:owned?0x8be5ae:rally?0xffd477:d.faction?0xe6b0aa:0xa8c9d5,'900');status.position.set(18,67);p.addChild(status)
  let info='Send scouts to reveal terrain, resource quality and enemy positions.'
  if(d.kind==='resource'&&scouted)info=`${d.resource.toUpperCase()} node · level ${d.level} · base haul ${fmt(d.yield)}`
  if(d.kind==='camp'&&scouted)info=`Raider camp L${d.level} · power ${fmt(d.strength)} · free army ${fmt(this.game.freeArmyPower())}`
  if(d.kind==='settlement'&&scouted)info=`Rival city L${d.tier} · power ${fmt(d.strength)} · raid for resources and commander XP.`
  if(d.kind==='wild'&&scouted)info=`${d.terrain??'Open land'} · claim it to extend your border and reach deeper targets.`
  if(d.kind==='base')info='Your capital. All marches leave from here and return here.'
  const desc=text(info,11,0xd8e9ee,'700');desc.position.set(18,93);p.addChild(desc)
  const commander=text(`${this.game.commanderName()} · ${this.game.formationName()} · Commander ${fmt(this.game.commanderPower())}`,10,0xffdc86,'800');commander.position.set(18,128);p.addChild(commander)
  const slots=text(`Marches ${w.marches.length}/${this.game.marchCapacity()} · Total army ${fmt(this.game.armyPower())} · Free ${fmt(this.game.freeArmyPower())}`,10,0x9fd8ea,'800');slots.position.set(18,149);p.addChild(slots)
  if(march){const left=march.phase==='gathering'?Math.max(0,march.gatherDoneAt-Date.now()):Math.max(0,march.arriveAt-Date.now()),m=text(`${march.type.toUpperCase()} · ${march.phase.toUpperCase()} · ${fmtTime(left)}`,10,0x9fe2ff,'900');m.position.set(18,171);p.addChild(m)}
  else if(rally){const left=Math.max(0,w.rally.launchAt-Date.now()),m=text(`ALLIANCE RALLY · ${w.rally.participants} armies · ${fmtTime(left)}`,10,0xffd477,'900');m.position.set(18,171);p.addChild(m)}
  else if(burning){const left=Math.max(0,(w.settlementCooldown[id]??0)-Date.now()),m=text(`Raid protection · ${fmtTime(left)}`,10,0xffa783,'900');m.position.set(18,171);p.addChild(m)}
  let label='',color=0x53666f,fn=null
  if(march)label='MARCH IN PROGRESS'
  else if(rally)label='RALLY FORMING'
  else if(canScout){label='SCOUT TERRITORY';color=0x3a7fa2;fn=()=>this.game.scoutTile(id)}
  else if(canClaim){label='CLAIM TERRITORY';color=0x4d8767;fn=()=>this.game.claimTile(id)}
  else if(canAttack){label=d.kind==='settlement'?'RAID RIVAL CITY':'ATTACK RAIDERS';color=0x9a4f4f;fn=()=>this.game.attackTile(id)}
  else if(canGather){label=this.game.worldNodeReady(id)?`GATHER ${d.resource.toUpperCase()}`:'RESOURCE NODE RECOVERING';color=this.game.worldNodeReady(id)?0xa67636:0x53666f;if(this.game.worldNodeReady(id))fn=()=>this.game.gatherTile(id)}
  else if(!scouted)label='MOVE SCOUT FRONTIER CLOSER'
  else if(burning)label='CITY UNDER RAID PROTECTION'
  else label=owned?'TERRITORY SECURED':hostile?'EXPAND BORDER TO ATTACK':'CLAIM ADJACENT LAND FIRST'
  const action=button(label,width-36,44,color);action.position.set(18,212);if(fn)action.on('pointertap',fn);p.addChild(action)
  if(canRally){const rb=button('FORM ALLIANCE RALLY',width-36,40,0xa87a36);rb.position.set(18,264);rb.on('pointertap',()=>this.game.startRally(id));p.addChild(rb)}
  const close=button('CLOSE',110,38,0x526b76);close.position.set(width-128,320);close.on('pointertap',()=>this.visible=false);p.addChild(close)
 }
 refresh(){if(this.visible&&this.tileId)this.render()}
}
