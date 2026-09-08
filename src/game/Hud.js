import { Container,Graphics } from 'pixi.js'
import { RESOURCES,resourceProduction,BUILDINGS } from '../data/buildings.js'
import { findResearch } from '../data/research.js'
import { researchBonus } from '../systems/research.js'
import { panel,text,roundButton,fmt,fmtShort,fmtTime } from './ui/primitives.js'
import { QuestHud } from './ui/QuestHud.js'
import { BuildingSheet } from './ui/BuildingSheet.js'
import { ResearchSheet } from './ui/ResearchSheet.js'
import { WorldSheet } from './ui/WorldSheet.js'
import { ArmySheet } from './ui/ArmySheet.js'

export class Hud extends Container{
 constructor(game){super();this.game=game;this.resourceTexts={};this.rateTexts={};this.makeStatic();this.quest=new QuestHud(game);this.detail=new BuildingSheet(game);this.researchPanel=new ResearchSheet(game);this.worldPanel=new WorldSheet(game);this.armyPanel=new ArmySheet(game);this.addChild(this.quest,this.detail,this.researchPanel,this.worldPanel,this.armyPanel);window.addEventListener('resize',()=>this.layout());this.layout()}
 makeStatic(){
  this.profile=panel(136,50,.9,0x0b2834,16);this.addChild(this.profile);const crest=new Graphics().circle(24,25,17).fill(0x2d708b).stroke({color:0xffffff,alpha:.5,width:2});const r=text('R',15,0xffffff,'900');r.anchor.set(.5);r.position.set(24,25);this.power=text('',10,0xffdf83,'900');this.power.position.set(48,10);const name=text('OUTPOST',9,0xffffff,'900');name.position.set(48,27);this.profile.addChild(crest,r,this.power,name)
  this.top=panel(368,50,.88,0x0b2834,15);this.addChild(this.top);let x=8;for(const [k,res] of Object.entries(RESOURCES)){this.top.addChild(new Graphics().circle(x+8,15,7).fill(res.color).stroke({color:0xffffff,alpha:.4,width:1}));const value=text('',10,0xffffff,'900');value.position.set(x+18,7);const rate=text('',7,0xa6e6b5,'800');rate.position.set(x+18,26);this.top.addChild(value,rate);this.resourceTexts[k]=value;this.rateTexts[k]=rate;x+=90}
  this.queueBox=panel(258,48,.86,0x0b2834,14);this.addChild(this.queueBox);this.queue=text('',9,0xffffff,'800');this.queue.position.set(11,7);this.queueBox.addChild(this.queue)
  this.cityBtn=roundButton('⌂','CITY',0x315d70);this.cityBtn.on('pointertap',()=>this.game.showCity());this.worldBtn=roundButton('◎','WORLD',0x6b7040);this.worldBtn.on('pointertap',()=>this.game.showWorld());this.researchBtn=roundButton('⌬','RESEARCH',0x347fa5);this.researchBtn.on('pointertap',()=>this.openResearch());this.helpBtn=roundButton('⚑','ALLIANCE',0x4f8467);this.helpBtn.on('pointertap',()=>this.game.helpConstruction());this.armyBtn=roundButton('⚔','ARMY',0x8a5d58);this.armyBtn.on('pointertap',()=>this.openArmy());this.addChild(this.cityBtn,this.worldBtn,this.researchBtn,this.helpBtn,this.armyBtn)
 }
 layout(){const w=window.innerWidth,h=window.innerHeight;this.profile.position.set(10,10);const scale=Math.min(1,(w-20)/368);this.top.scale.set(scale);this.top.position.set(Math.max(10,w-368*scale-10),10);const qs=Math.min(1,(w-20)/350);this.quest.scale.set(qs);this.quest.position.set(10,68);this.queueBox.position.set(10,h-105);const nav=[this.cityBtn,this.worldBtn,this.researchBtn,this.helpBtn,this.armyBtn],gap=Math.min(74,(w-24)/5),start=w/2-gap*2;nav.forEach((b,i)=>b.position.set(start+i*gap,h-43));for(const sheet of [this.detail,this.researchPanel,this.worldPanel,this.armyPanel])if(sheet.visible)sheet.position.set(Math.max(10,(w-sheet.sheetW)/2),h-sheet.sheetH-74)}
 refresh(){const prod=resourceProduction(this.game.state),all=1+researchBonus(this.game.state,'allOutput');for(const k of Object.keys(this.resourceTexts)){const bonus=1+researchBonus(this.game.state,`${k}Output`);this.resourceTexts[k].text=fmtShort(this.game.state.resources[k]??0);this.rateTexts[k].text=`+${(prod[k]*all*bonus).toFixed(1)}/s`}this.power.text=this.game.mode==='world'?`⚔ ${fmt(this.game.armyPower())}`:`⚡ ${fmt(this.game.state.power)}`;const c=this.game.state.construction,r=this.game.state.researchJob,w=this.game.state.world,rally=w.rally;this.queue.text=this.game.mode==='world'?`◎ Territory ${w.owned.length} · March ${w.marches.length}/${this.game.marchCapacity()}\n${rally?`⚑ Rally ${fmtTime(Math.max(0,rally.launchAt-Date.now()))} · ${rally.participants} armies`:`⚔ ${w.defeated.length} camps · ${this.game.commanderName()}`}`:`🔨 ${c?`${BUILDINGS[c.id].name} ${c.target} · ${fmtTime(c.finishAt-Date.now())}`:'Builder idle'}\n⌬ ${r?`${findResearch(r.id)?.name??r.id} ${r.target} · ${fmtTime(r.finishAt-Date.now())}`:'Research idle'}`;this.quest.refresh();this.armyPanel.refresh()}
 hideSheets(){this.detail.visible=false;this.researchPanel.visible=false;this.worldPanel.visible=false;this.armyPanel.visible=false}
 showBuilding(id){this.hideSheets();this.detail.open(id);this.layout()}
 showWorldTile(id){this.hideSheets();this.worldPanel.open(id);this.layout()}
 openResearch(){this.hideSheets();this.researchPanel.open();this.layout()}
 openArmy(){this.hideSheets();this.armyPanel.open();this.layout()}
}
