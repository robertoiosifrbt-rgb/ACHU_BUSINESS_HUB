import { Container,Graphics } from 'pixi.js'
import { RESOURCES,resourceProduction,BUILDINGS } from '../data/buildings.js'
import { furnaceTier } from '../data/furnace.js'
import { SYSTEM_UNLOCKS } from '../data/cityProgression.js'
import { findResearch } from '../data/research.js'
import { researchBonus } from '../systems/research.js'
import { panel,text,roundButton,fmt,fmtShort,fmtTime } from './ui/primitives.js'
import { QuestHud } from './ui/QuestHud.js'
import { BuildingSheet } from './ui/BuildingSheet.js'
import { ResearchSheet } from './ui/ResearchSheet.js'
import { WorldSheet } from './ui/WorldSheet.js'
import { ArmySheet } from './ui/ArmySheet.js'

export class Hud extends Container{
 constructor(game){
  super();this.game=game;this.resourceTexts={};this.rateTexts={};this.makeStatic()
  this.quest=new QuestHud(game);this.detail=new BuildingSheet(game);this.researchPanel=new ResearchSheet(game);this.worldPanel=new WorldSheet(game);this.armyPanel=new ArmySheet(game)
  this.addChild(this.quest,this.detail,this.researchPanel,this.worldPanel,this.armyPanel);window.addEventListener('resize',()=>this.layout());this.layout()
 }
 makeStatic(){
  this.headerShade=new Graphics();this.addChild(this.headerShade)
  this.profile=panel(144,48,.94,0x081f29,14);this.addChild(this.profile)
  const crest=new Graphics().circle(23,24,16).fill(0x2d708b).stroke({color:0xffffff,alpha:.45,width:1.5}),r=text('R',14,0xffffff,'900');r.anchor.set(.5);r.position.set(23,24)
  this.power=text('',10,0xffdf83,'900');this.power.position.set(46,9);this.cityName=text('',8,0xbfdde6,'900');this.cityName.position.set(46,27);this.profile.addChild(crest,r,this.power,this.cityName)
  this.top=panel(360,46,.92,0x081f29,14);this.addChild(this.top)
  let x=8;for(const [k,res] of Object.entries(RESOURCES)){
   this.top.addChild(new Graphics().circle(x+7,15,6).fill(res.color).stroke({color:0xffffff,alpha:.32,width:1}))
   const value=text('',10,0xffffff,'900');value.position.set(x+17,7);const rate=text('',7,0x9edeb0,'800');rate.position.set(x+17,25)
   this.top.addChild(value,rate);this.resourceTexts[k]=value;this.rateTexts[k]=rate;x+=88
  }
  this.queueBox=panel(270,44,.93,0x081f29,13);this.addChild(this.queueBox);this.queue=text('',9,0xffffff,'850');this.queue.position.set(11,7);this.queueBox.addChild(this.queue)
  this.navDock=new Graphics();this.addChild(this.navDock)
  this.cityBtn=roundButton('⌂','CITY',0x315d70);this.cityBtn.on('pointertap',()=>this.game.showCity())
  this.worldBtn=roundButton('◎','WORLD',0x69723d);this.worldBtn.on('pointertap',()=>this.openWorld())
  this.armyBtn=roundButton('⚔','ARMY',0x8a5d58);this.armyBtn.on('pointertap',()=>this.openArmy())
  this.researchBtn=roundButton('⌬','TECH',0x347fa5);this.researchBtn.on('pointertap',()=>this.openResearch())
  this.helpBtn=roundButton('⚑','ALLIANCE',0x4f8467);this.helpBtn.on('pointertap',()=>this.useAlliance())
  this.addChild(this.cityBtn,this.worldBtn,this.armyBtn,this.researchBtn,this.helpBtn)
 }
 furnaceLevel(){return this.game.state.buildings.furnace??1}
 unlocked(system){const f=this.furnaceLevel();if(system==='world')return f>=SYSTEM_UNLOCKS.world;if(system==='army')return f>=SYSTEM_UNLOCKS.army&&(this.game.state.buildings.infantryCamp??0)>0;if(system==='alliance')return f>=SYSTEM_UNLOCKS.alliance&&(this.game.state.buildings.embassy??0)>0;if(system==='research')return f>=SYSTEM_UNLOCKS.research&&(this.game.state.buildings.researchCenter??0)>0;return true}
 openWorld(){if(!this.unlocked('world')){this.game.toast(`World unlocks at Furnace ${SYSTEM_UNLOCKS.world}`);return}this.game.showWorld()}
 openResearch(){if(!this.unlocked('research')){this.game.toast(`Research unlocks with Research Center at Furnace ${SYSTEM_UNLOCKS.research}`);return}this.hideSheets();this.researchPanel.open();this.layout()}
 openArmy(){if(!this.unlocked('army')){this.game.toast(`Army command unlocks after Infantry Camp at Furnace ${SYSTEM_UNLOCKS.army}`);return}this.hideSheets();this.armyPanel.open();this.layout()}
 useAlliance(){if(!this.unlocked('alliance')){this.game.toast(`Alliance help unlocks with Embassy at Furnace ${SYSTEM_UNLOCKS.alliance}`);return}this.game.helpConstruction()}
 layout(){
  const w=window.innerWidth,h=window.innerHeight,compact=w<680
  this.headerShade.clear().rect(0,0,w,compact?116:64).fill({color:0x071a22,alpha:.22})
  this.profile.scale.set(1);this.top.scale.set(1);this.quest.scale.set(1)
  if(compact){
   this.profile.position.set(10,8)
   const ts=Math.min(1,(w-20)/360);this.top.scale.set(ts);this.top.position.set((w-360*ts)/2,60)
   const qs=Math.min(1,(w-20)/330);this.quest.scale.set(qs);this.quest.position.set(10,112)
  }else{
   this.profile.position.set(12,10);this.top.position.set(168,10);this.quest.position.set(12,66)
  }
  this.queueBox.position.set(10,h-136)
  this.navDock.clear().roundRect(8,h-78,w-16,70,22).fill({color:0x071d26,alpha:.93}).stroke({color:0xdaf4ff,alpha:.18,width:1})
  const nav=[this.cityBtn,this.worldBtn,this.armyBtn,this.researchBtn,this.helpBtn],gap=Math.min(72,(w-28)/5),start=w/2-gap*2
  nav.forEach((b,i)=>b.position.set(start+i*gap,h-48))
  for(const sheet of [this.detail,this.researchPanel,this.worldPanel,this.armyPanel])if(sheet.visible)sheet.position.set(Math.max(10,(w-sheet.sheetW)/2),Math.max(86,h-sheet.sheetH-86))
 }
 queueText(){
  const c=this.game.state.construction,r=this.game.state.researchJob,w=this.game.state.world,j=w.trainingJob,rally=w.rally
  if(this.game.mode==='world'){
   if(rally)return`RALLY · ${fmtTime(Math.max(0,rally.launchAt-Date.now()))} · ${rally.participants} armies`
   if(w.marches.length)return`MARCHES ${w.marches.length}/${this.game.marchCapacity()} · Territory ${w.owned.length}`
   return`Territory ${w.owned.length} · Army ${fmt(this.game.armyPower())}`
  }
  if(c)return`BUILD · ${BUILDINGS[c.id].name} ${c.target} · ${fmtTime(c.finishAt-Date.now())}`
  if(j)return`TRAIN · ${j.type.toUpperCase()} · ${fmtTime(j.finishAt-Date.now())}`
  if(r)return`TECH · ${findResearch(r.id)?.name??r.id} ${r.target} · ${fmtTime(r.finishAt-Date.now())}`
  return this.unlocked('research')?'Builder idle · Research idle':`Furnace ${this.furnaceLevel()} · grow the settlement`
 }
 refresh(){
  const prod=resourceProduction(this.game.state),all=1+researchBonus(this.game.state,'allOutput')
  for(const k of Object.keys(this.resourceTexts)){const bonus=1+researchBonus(this.game.state,`${k}Output`);this.resourceTexts[k].text=fmtShort(this.game.state.resources[k]??0);this.rateTexts[k].text=`+${(prod[k]*all*bonus).toFixed(1)}/s`}
  const f=this.furnaceLevel();this.cityName.text=furnaceTier(f).toUpperCase();this.power.text=this.game.mode==='world'?`ARMY ${fmt(this.game.armyPower())}`:`F${f} · POWER ${fmt(this.game.state.power)}`
  this.worldBtn.alpha=this.unlocked('world')?(this.game.mode==='world'?1:.72):.28
  this.cityBtn.alpha=this.game.mode==='city'?1:.72
  this.armyBtn.alpha=this.unlocked('army')?0.78:0.28
  this.helpBtn.alpha=this.unlocked('alliance')?0.78:0.28
  this.researchBtn.alpha=this.unlocked('research')?0.78:0.28
  this.queue.text=this.queueText();this.quest.refresh();this.armyPanel.refresh()
 }
 hideSheets(){this.detail.visible=false;this.researchPanel.visible=false;this.worldPanel.visible=false;this.armyPanel.visible=false}
 showBuilding(id){this.hideSheets();this.detail.open(id);this.layout()}
 showWorldTile(id){this.hideSheets();this.worldPanel.open(id);this.layout()}
}
