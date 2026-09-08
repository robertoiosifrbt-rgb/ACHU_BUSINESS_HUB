import { Container,Graphics,Text } from 'pixi.js'
import { BUILDINGS,RESOURCES,buildingRequirements,nextBuildingLevel,resourceProduction } from '../data/buildings.js'
import { RESEARCH,findResearch } from '../data/research.js'
import { researchBonus } from '../systems/research.js'

const text=(s,size=15,color=0xffffff,weight='700')=>new Text({text:s,style:{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:weight}})
const panel=(w,h,a=.90,color=0x17303d)=>new Graphics().roundRect(0,0,w,h,18).fill({color,alpha:a}).stroke({color:0xffffff,alpha:.20,width:1})
function button(label,w=120,h=42,color=0x2f86c9){const c=new Container();const g=new Graphics().roundRect(0,0,w,h,13).fill(color).stroke({color:0xffffff,alpha:.32,width:2});const t=text(label,12);t.anchor.set(.5);t.position.set(w/2,h/2);c.addChild(g,t);c.eventMode='static';c.cursor='pointer';return c}
const fmt=n=>Math.floor(n).toLocaleString()
const fmtTime=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return s<60?`${s}s`:`${Math.floor(s/60)}m ${s%60}s`}
function locateRequirement(state,id,target){const d=BUILDINGS[id];if(d.unlockFurnace&&(state.buildings.furnace??0)<d.unlockFurnace)return'furnace';if(d.gate&&id!=='furnace'&&target>(state.buildings.furnace??0))return'furnace';for(const [other,lvl] of(d.requires?.[target]??[]))if((state.buildings[other]??0)<lvl)return other;return null}

export class Hud extends Container{
 constructor(game){super();this.game=game;this.resourceTexts={};this.rateTexts={};this.detail=new Container();this.researchPanel=new Container();this.addChild(this.detail,this.researchPanel);this.makeStatic();window.addEventListener('resize',()=>this.layout());this.layout()}
 makeStatic(){
  this.profile=panel(180,64,.92);this.addChild(this.profile);const name=text('BUILD',18,0xffffff,'800');name.position.set(14,9);this.profile.addChild(name);this.power=text('',12,0xffd777);this.power.position.set(14,36);this.profile.addChild(this.power)
  this.top=panel(560,64,.86);this.addChild(this.top);let x=12;for(const [k,r] of Object.entries(RESOURCES)){const dot=new Graphics().circle(x+12,20,9).fill(r.color).stroke({color:0xffffff,alpha:.45,width:1});this.top.addChild(dot);const t=text('',12);t.position.set(x+26,8);this.top.addChild(t);this.resourceTexts[k]=t;const rate=text('',9,0xa7e5b6);rate.position.set(x+26,31);this.top.addChild(rate);this.rateTexts[k]=rate;x+=136}
  this.queueBox=panel(292,58,.86);this.addChild(this.queueBox);this.queue=text('',11,0xffffff);this.queue.position.set(12,10);this.queueBox.addChild(this.queue)
  this.buildBtn=button('CITY',104,44,0x486b7a);this.buildBtn.on('pointertap',()=>this.game.clearSelection());this.addChild(this.buildBtn)
  this.researchBtn=button('RESEARCH',118,44);this.researchBtn.on('pointertap',()=>this.openResearch());this.addChild(this.researchBtn)
  this.helpBtn=button('ALLIANCE HELP',132,44,0x558a68);this.helpBtn.on('pointertap',()=>this.game.helpConstruction());this.addChild(this.helpBtn)
  this.resetBtn=button('RESET',82,40,0x81545d);this.resetBtn.on('pointertap',()=>this.game.reset());this.addChild(this.resetBtn)
 }
 layout(){const w=window.innerWidth,h=window.innerHeight;this.profile.position.set(12,12);this.top.position.set(Math.max(202,(w-560)/2),12);this.queueBox.position.set(12,h-130);const total=104+10+118+10+132;let start=Math.max(12,(w-total)/2);this.buildBtn.position.set(start,h-58);this.researchBtn.position.set(start+114,h-58);this.helpBtn.position.set(start+242,h-58);this.resetBtn.position.set(w-94,h-54);if(this.detail.visible)this.detail.position.set(Math.max(12,w-370),96);if(this.researchPanel.visible)this.researchPanel.position.set(Math.max(12,w-420),84);if(w<760){this.top.scale.set(Math.max(.62,(w-24)/560));this.top.position.set(12,82);this.profile.position.set(12,12);this.queueBox.scale.set(.86);this.queueBox.position.set(12,h-122)}else this.top.scale.set(1)}
 refresh(){
  const prod=resourceProduction(this.game.state);const all=1+researchBonus(this.game.state,'allOutput');for(const k of Object.keys(this.resourceTexts)){const bonus=1+researchBonus(this.game.state,`${k}Output`);this.resourceTexts[k].text=`${RESOURCES[k].short}  ${fmt(this.game.state.resources[k]??0)}`;this.rateTexts[k].text=`+${(prod[k]*all*bonus).toFixed(1)}/s`}
  this.power.text=`POWER  ${fmt(this.game.state.power)}`;const c=this.game.state.construction,r=this.game.state.researchJob;this.queue.text=`BUILD  ${c?`${BUILDINGS[c.id].name} ${c.target} · ${fmtTime(c.finishAt-Date.now())}`:'Idle'}\nRESEARCH  ${r?`${findResearch(r.id)?.name??r.id} ${r.target} · ${fmtTime(r.finishAt-Date.now())}`:'Idle'}`
 }
 showBuilding(id){
  this.researchPanel.visible=false;this.detail.removeChildren();this.detail.visible=true;const d=BUILDINGS[id],lvl=this.game.state.buildings[id]??0,target=nextBuildingLevel(this.game.state,id);const req=d.levels[target]?buildingRequirements(this.game.state,id,target):[];const locateId=d.levels[target]?locateRequirement(this.game.state,id,target):null;const h=260+(d.production&&lvl>0?28:0)+(locateId?48:0);const p=panel(350,h,.96);this.detail.addChild(p);const title=text(`${d.name} · Lv. ${lvl}`,20);title.position.set(18,16);p.addChild(title)
  const info=text(d.levels[target]?`Upgrade to Lv. ${target}`:'Maximum level reached',13,0xcfe8f4);info.position.set(18,50);p.addChild(info)
  let y=80;if(d.production&&lvl>0){const prod=d.production.base*lvl*Math.pow(1.10,Math.max(0,lvl-1));const q=text(`Produces ${RESOURCES[d.production.resource].label}: ${prod.toFixed(1)} / sec`,12,0xa8e7b8);q.position.set(18,y);p.addChild(q);y+=28}
  if(d.levels[target]){const cost=d.levels[target].cost;const c=text(`MEAT ${fmt(cost.meat)}   WOOD ${fmt(cost.wood)}\nCOAL ${fmt(cost.coal)}   IRON ${fmt(cost.iron)}`,12,0xffffff);c.position.set(18,y);p.addChild(c);y+=48;const rq=text(req.length?`Requires: ${req.join(' · ')}`:'All requirements met',11,req.length?0xffb0a0:0xa8e7b8);rq.position.set(18,y);p.addChild(rq);y+=34;if(locateId){const go=button(`LOCATE ${BUILDINGS[locateId].name.toUpperCase()}`,282,36,0xb36c37);go.position.set(18,y);go.on('pointertap',()=>this.game.focusBuilding(locateId));p.addChild(go);y+=46}const up=button(lvl===0?'CONSTRUCT':'UPGRADE',142,44);up.position.set(18,y);up.on('pointertap',()=>this.game.upgradeBuilding(id));p.addChild(up);const close=button('CLOSE',120,44,0x536b76);close.position.set(180,y);close.on('pointertap',()=>this.detail.visible=false);p.addChild(close)}else{const close=button('CLOSE',120,44,0x536b76);close.position.set(18,y+20);close.on('pointertap',()=>this.detail.visible=false);p.addChild(close)}this.layout()
 }
 openResearch(){
  this.detail.visible=false;this.researchPanel.removeChildren();this.researchPanel.visible=true;const hh=Math.min(690,window.innerHeight-120);const p=panel(400,hh,.97);this.researchPanel.addChild(p);const title=text('RESEARCH CENTER',20);title.position.set(18,14);p.addChild(title);const rc=this.game.state.buildings.researchCenter??0;const status=text(rc?`Center Lv. ${rc}`:'Locked · Furnace 9 required',11,rc?0xa8e7b8:0xffb0a0);status.position.set(18,40);p.addChild(status);let y=70
  for(const [,b] of Object.entries(RESEARCH)){const h=text(b.label.toUpperCase(),12,0xffd777);h.position.set(18,y);p.addChild(h);y+=22;for(const [id,d] of Object.entries(b.items)){if(y>hh-72)break;const lvl=this.game.state.research[id]??0;const row=button(`${d.name}   ${lvl}/${d.max}`,350,34,0x315668);row.position.set(18,y);row.on('pointertap',()=>this.game.research(id));p.addChild(row);y+=38}y+=6}
  const close=button('CLOSE',92,38,0x536b76);close.position.set(290,14);close.on('pointertap',()=>this.researchPanel.visible=false);p.addChild(close);this.layout()
 }
}
