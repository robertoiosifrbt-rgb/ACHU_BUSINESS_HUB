import {BUILDINGS,buildingRequirements,nextBuildingLevel} from '../../data/buildings.js'
import {FURNACE_MAX_LEVEL,FURNACE_LEVELS,furnaceTier,nextFurnaceUnlock} from '../../data/furnace.js'
import {DEMO_SPEED} from '../../systems/state.js'
import {panel,text,button,fmt,fmtTime} from './primitives.js'

function locateRequirement(state,target){for(const [id,lvl] of(BUILDINGS.furnace.requires?.[target]??[]))if((state.buildings[id]??0)<lvl)return id;return null}

export function renderFurnacePanel(sheet,game){
 sheet.removeChildren();sheet.visible=true
 const lvl=game.state.buildings.furnace??0,target=nextBuildingLevel(game.state,'furnace'),spec=FURNACE_LEVELS[target],req=spec?buildingRequirements(game.state,'furnace',target):[],locateId=spec?locateRequirement(game.state,target):null,nextUnlock=nextFurnaceUnlock(lvl),busy=game.state.construction
 const w=Math.min(420,window.innerWidth-20),h=spec?356:280;sheet.sheetW=w;sheet.sheetH=h
 const p=panel(w,h,.985,0x0b2530,24);sheet.addChild(p)
 const title=text('FURNACE',22,0xffe09a,'900');title.position.set(18,14);p.addChild(title)
 const tier=text(`${furnaceTier(lvl).toUpperCase()}  •  LEVEL ${lvl}/${FURNACE_MAX_LEVEL}`,10,0xb9dce8,'900');tier.position.set(18,45);p.addChild(tier)
 const desc=text('Settlement core. Every normal building is capped by the Furnace level.',10,0xd9ebef,'700');desc.position.set(18,69);p.addChild(desc)
 const core=text(`CORE POWER  ${fmt(FURNACE_LEVELS[Math.max(1,lvl)]?.power??0)}`,11,0xffd777,'900');core.position.set(18,96);p.addChild(core)
 if(nextUnlock){const unlock=text(`NEXT MAJOR UNLOCK · FURNACE ${nextUnlock.level}\n${nextUnlock.items.join('  •  ')}`,10,0x9fe2ff,'900');unlock.position.set(18,120);p.addChild(unlock)}
 if(spec){
  const time=fmtTime(spec.seconds*1000/DEMO_SPEED),cost=spec.cost
  const up=text(`UPGRADE TO FURNACE ${target}  •  +${fmt(spec.power)} POWER  •  ${time}\nMEAT ${fmt(cost.meat)}     WOOD ${fmt(cost.wood)}\nCOAL ${fmt(cost.coal)}     IRON ${fmt(cost.iron)}`,11,0xffffff,'800');up.position.set(18,166);p.addChild(up)
  const rq=text(req.length?`REQUIRES  ${req.join('  •  ')}`:'ALL REQUIREMENTS MET',10,req.length?0xffa89b:0xa8e7b8,'900');rq.position.set(18,226);p.addChild(rq)
  let y=252
  if(locateId){const go=button(`LOCATE ${BUILDINGS[locateId].name.toUpperCase()}`,w-36,34,0xa76434);go.position.set(18,y);go.on('pointertap',()=>game.focusBuilding(locateId));p.addChild(go);y+=42}
  const upgrade=button(busy?.id==='furnace'?`UPGRADING TO ${busy.target}`:busy?'BUILDER BUSY':`UPGRADE FURNACE`,Math.floor((w-54)*.62),42,busy?0x53666f:0xc17a31);upgrade.position.set(18,h-56);if(!busy)upgrade.on('pointertap',()=>game.upgradeBuilding('furnace'));p.addChild(upgrade)
  const close=button('CLOSE',Math.floor((w-54)*.34),42,0x526b76);close.position.set(30+Math.floor((w-54)*.62),h-56);close.on('pointertap',()=>sheet.visible=false);p.addChild(close)
 }else{
  const max=text('MAXIMUM FURNACE LEVEL REACHED\nCapital core fully developed.',12,0xa8e7b8,'900');max.position.set(18,176);p.addChild(max)
  const close=button('CLOSE',120,42,0x526b76);close.position.set(18,h-56);close.on('pointertap',()=>sheet.visible=false);p.addChild(close)
 }
}
