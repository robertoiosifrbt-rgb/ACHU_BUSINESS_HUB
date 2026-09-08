import { Container,Sprite,Text,Rectangle,Graphics } from 'pixi.js'
import { BUILDINGS,RESOURCES,buildingRequirements,nextBuildingLevel } from '../data/buildings.js'
import { furnaceTier } from '../data/furnace.js'
import { buildingUnlocked,buildingTeased,cityHeatRadius,unlockLevelForBuilding } from '../data/cityProgression.js'
import { visualAssets } from './AssetLibrary.js'

const TW=128,TH=64,CENTER=12
const LAYOUT={
 furnace:[12,12],shelter:[10,14],sawmill:[14,14],huntersHut:[16,12],coalMine:[16,9],ironMine:[18,13],
 storehouse:[12,17],infirmary:[9,10],embassy:[9,7],infantryCamp:[13,7],lancerCamp:[16,6],marksmanCamp:[18,9],researchCenter:[7,12],
}
const DECOR=[
 [11,11,'shelter',1],[13,11,'shelter',1],[11,14,'huntersHut',2],[13,15,'shelter',2],
 [9,13,'shelter',3],[15,13,'storehouse',3],[10,9,'huntersHut',4],[14,9,'shelter',4],
 [8,12,'shelter',5],[16,15,'storehouse',5],[8,15,'huntersHut',6],[15,8,'shelter',6],
 [7,10,'shelter',7],[17,11,'storehouse',7],[10,17,'shelter',8],[14,17,'huntersHut',8],
 [7,14,'storehouse',9],[17,14,'shelter',10],[8,8,'huntersHut',11],[16,17,'storehouse',12],
]
const iso=(gx,gy)=>({x:(gx-gy)*TW/2,y:(gx+gy-CENTER*2)*TH/2})
const txt=(value,size=12,color=0xffffff,weight='800')=>new Text({text:value,style:{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:weight,stroke:{color:0x0b2029,width:4}}})
const rng=n=>{const x=Math.sin(n*999.31)*43758.5453;return x-Math.floor(x)}
function sprite(texture,width){const s=new Sprite(texture);s.anchor.set(.5,1);const scale=width/Math.max(1,texture.width);s.scale.set(scale);return s}
function marker(label,color=0x1d5265,r=18){const c=new Container(),g=new Graphics().circle(0,0,r).fill({color,alpha:.96}).stroke({color:0xffffff,alpha:.82,width:2}),t=txt(label,12,0xffffff,'900');t.anchor.set(.5);t.position.set(0,-1);c.addChild(g,t);return c}
function badge(label,color=0x102c37,w=58){const c=new Container(),g=new Graphics().roundRect(-w/2,-9,w,18,9).fill({color,alpha:.94}).stroke({color:0xffffff,alpha:.28,width:1}),t=txt(label,8,0xffffff,'900');t.anchor.set(.5);c.addChild(g,t);return c}

export class CityScene extends Container{
 constructor(game){
  super();this.game=game;this.sortableChildren=true;this.buildingViews=new Map();this.decorViews=[];this.snow=[];this.smoke=[];this.lastStatusKey=''
  this.makeTerrain();this.makeCoreZone();this.makeForest();this.makeTownDecor();this.makeBuildings();this.makeAtmosphere()
 }
 makeTerrain(){
  const road=new Set(),addPath=(x,y)=>{let cx=12,cy=12;while(cx!==x){road.add(`${cx},${cy}`);cx+=Math.sign(x-cx)}while(cy!==y){road.add(`${cx},${cy}`);cy+=Math.sign(y-cy)}road.add(`${x},${y}`)}
  for(const [id,[x,y]] of Object.entries(LAYOUT))if(id!=='furnace')addPath(x,y)
  for(let x=9;x<=15;x++){road.add(`${x},10`);road.add(`${x},15`)}
  for(let y=10;y<=15;y++){road.add(`9,${y}`);road.add(`15,${y}`)}
  for(let gy=0;gy<24;gy++)for(let gx=0;gx<24;gx++){
   const p=iso(gx,gy),river=gx+gy>39,bridge=river&&(gx===12||gy===12),isRoad=road.has(`${gx},${gy}`)&&!river
   const pool=bridge?visualAssets.bridges:river?visualAssets.water:isRoad?visualAssets.paths:visualAssets.snow
   const tex=pool[Math.abs(gx*7+gy*11)%pool.length],s=new Sprite(tex);s.anchor.set(.5);s.width=TW;s.height=bridge?TH*2:TH;s.position.set(p.x,p.y);s.zIndex=-5000+Math.round(p.y)
   if(!river&&!isRoad)s.tint=((gx+gy)&1)?0xf0f7f6:0xe3efef
   this.addChild(s)
  }
 }
 makeCoreZone(){this.coreGlow=new Graphics();this.coreGlow.zIndex=-2450;this.addChild(this.coreGlow);this.refreshCoreZone()}
 refreshCoreZone(){
  if(!this.coreGlow)return
  const level=this.game.state.buildings.furnace??1,r=cityHeatRadius(level),inner=r*.55
  this.coreGlow.clear().poly([-r,0,0,-r*.46,r,0,0,r*.46]).fill({color:0xffb54f,alpha:.045}).stroke({color:0xffd889,width:3,alpha:.16})
  this.coreGlow.poly([-inner,0,0,-inner*.46,inner,0,0,inner*.46]).fill({color:0xffa33c,alpha:.025}).stroke({color:0xffc45d,width:2,alpha:.12})
 }
 makeForest(){
  const blocked=new Set([...Object.values(LAYOUT),...DECOR.map(d=>[d[0],d[1]])].map(([x,y])=>`${x},${y}`))
  for(let i=0;i<92;i++){
   const gx=Math.floor(rng(i+2)*24),gy=Math.floor(rng(i+99)*24),central=gx>5&&gx<19&&gy>5&&gy<19
   if(central&&rng(i+31)>.18)continue
   if(blocked.has(`${gx},${gy}`)||gx+gy>39)continue
   const p=iso(gx,gy),tex=visualAssets.trees[i%visualAssets.trees.length],s=sprite(tex,72+(i%5)*8);s.position.set(p.x+(rng(i+50)-.5)*40,p.y+24);s.zIndex=Math.round(s.y)-130;s.alpha=.93;this.addChild(s)
  }
  for(let i=0;i<34;i++){
   const gx=5+Math.floor(rng(i+310)*14),gy=5+Math.floor(rng(i+510)*14);if(blocked.has(`${gx},${gy}`))continue
   const p=iso(gx,gy),s=sprite(visualAssets.props[i%visualAssets.props.length],32+(i%3)*7);s.position.set(p.x+(rng(i+700)-.5)*36,p.y+18);s.zIndex=Math.round(s.y)-40;s.alpha=.82;this.addChild(s)
  }
 }
 makeTownDecor(){
  for(const [gx,gy,id,minF] of DECOR){const p=iso(gx,gy),s=sprite(visualAssets.buildings[id],72+(minF%3)*5);s.position.set(p.x,p.y+25);s.zIndex=Math.round(s.y)+160;s.alpha=.78;this.addChild(s);this.decorViews.push({view:s,minF})}
  this.refreshTownDecor()
 }
 refreshTownDecor(){const f=this.game.state.buildings.furnace??1;for(const d of this.decorViews)d.view.visible=f>=d.minF}
 makeBuildings(){
  for(const id of Object.keys(BUILDINGS)){
   const [gx,gy]=LAYOUT[id]??[12,12],p=iso(gx,gy),c=new Container();c.position.set(p.x,p.y+26);c.zIndex=Math.round(c.y)+320;c.eventMode='static';c.cursor='pointer'
   c.hitArea=id==='furnace'?new Rectangle(-120,-300,240,330):new Rectangle(-82,-230,164,260)
   c.on('pointertap',e=>{e.stopPropagation();this.game.selectBuilding(id)});this.addChild(c);this.buildingViews.set(id,c)
  }
  this.refresh()
 }
 renderLockedPlot(id,c){const level=unlockLevelForBuilding(id),foundation=sprite(visualAssets.foundation,78);foundation.alpha=.3;foundation.tint=0x7b8d95;foundation.label='asset';c.addChild(foundation);const lock=badge(`F${level}`,0x34464e,42);lock.position.set(0,-38);c.addChild(lock)}
 renderEmptyPlot(id,c){const def=BUILDINGS[id],foundation=sprite(visualAssets.foundation,92);foundation.alpha=.8;foundation.tint=0xdce8e7;foundation.label='asset';c.addChild(foundation);const name=txt(def.name.toUpperCase(),8,0xd9edf2,'900');name.anchor.set(.5);name.position.set(0,-61);c.addChild(name);const build=marker('+',0x2b7ca0,16);build.position.set(30,-34);c.addChild(build)}
 renderBuilding(id,c){
  c.removeChildren();const level=this.game.state.buildings[id]??0,def=BUILDINGS[id],unlocked=buildingUnlocked(this.game.state,id),teased=buildingTeased(this.game.state,id)
  if(id!=='furnace'&&!teased){c.visible=false;return}c.visible=true
  if(id!=='furnace'&&!unlocked&&!level){this.renderLockedPlot(id,c);return}
  if(id!=='furnace'&&!level){this.renderEmptyPlot(id,c);return}

  let texture=visualAssets.buildings[id]
  if(id==='furnace')texture=visualAssets.furnaceLevels[Math.max(0,Math.min(11,level-1))]??texture
  const mine=id==='coalMine'||id==='ironMine',military=def.category==='military',width=id==='furnace'?132+Math.min(36,level*3):mine?116:military?106:118
  const art=sprite(texture,width);art.label='asset'
  if(id==='coalMine')art.tint=0xd9d9d2
  if(id==='ironMine')art.tint=0xd9e8ef
  if(military)art.tint=0xf2ddd1
  c.addChild(art)

  if(id==='furnace'){
   const aura=new Graphics().ellipse(0,12,86+level*3,25+level).fill({color:0xff9e3d,alpha:.08});aura.zIndex=-1;c.addChildAt(aura,0)
   const title=txt('FURNACE',13,0xffdf8a,'900');title.anchor.set(.5);title.position.set(0,-274);c.addChild(title)
   const tier=txt(furnaceTier(level).toUpperCase(),8,0xcde8ee,'900');tier.anchor.set(.5);tier.position.set(0,-255);c.addChild(tier)
  }

  const levelMark=badge(`Lv.${level}`,id==='furnace'?0x804b2d:0x102c37,46);levelMark.position.set(0,13);c.addChild(levelMark)
  if(def.production&&this.game.isCollectReady(id)){const b=marker('+',RESOURCES[def.production.resource].color,16);b.position.set(42,-118);b.eventMode='static';b.cursor='pointer';b.on('pointertap',e=>{e.stopPropagation();this.game.collectResource(id)});c.addChild(b)}
  const target=nextBuildingLevel(this.game.state,id),req=def.levels[target]?buildingRequirements(this.game.state,id,target):[]
  if(def.levels[target]&&!req.length&&!this.game.state.construction){const up=marker('↑',0xc78a38,16);up.position.set(id==='furnace'?-70:-44,id==='furnace'?-175:-132);c.addChild(up)}
  if(this.game.state.construction?.id===id)c.addChild(this.constructionOverlay(id))
 }
 refresh(){this.refreshCoreZone();this.refreshTownDecor();for(const [id,c] of this.buildingViews)this.renderBuilding(id,c);this.lastStatusKey=this.statusKey();this.sortChildren()}
 constructionOverlay(id){const root=new Container();root.position.set(0,id==='furnace'?-220:-175);const bg=new Graphics().roundRect(-66,0,132,34,12).fill({color:0x0c2631,alpha:.96}).stroke({color:0xffd36a,width:2}),rail=new Graphics().roundRect(-52,22,104,6,3).fill({color:0x3a5059}),fill=new Graphics(),label=txt('BUILDING',8,0xffd36a,'900');label.anchor.set(.5);label.position.set(0,9);root.addChild(bg,rail,fill,label);root.label='construction';return root}
 makeAtmosphere(){
  for(let i=0;i<74;i++){const s=new Graphics().circle(0,0,1+(i%3)*.65).fill({color:0xffffff,alpha:.58});s.position.set(-900+rng(i+800)*1800,-650+rng(i+900)*1300);s.zIndex=5000;this.addChild(s);this.snow.push({view:s,speed:.28+(i%5)*.07,drift:(rng(i+1200)-.5)*.16})}
  for(let i=0;i<7;i++){const s=new Graphics().circle(0,0,9+i*1.7).fill({color:0xd9e6e7,alpha:.16});s.zIndex=1000+i;this.addChild(s);this.smoke.push({view:s,phase:i/7})}
 }
 getBuildingPosition(id){const c=this.buildingViews.get(id);return c&&c.visible?{x:c.x,y:c.y}:null}
 focus(id){const c=this.buildingViews.get(id);if(!c?.visible)return;const art=c.getChildByLabel?.('asset');if(!art)return;const sx=art.scale.x,sy=art.scale.y;art.scale.set(sx*1.1,sy*1.1);setTimeout(()=>this.refresh(),480)}
 statusKey(){const ready=Object.entries(BUILDINGS).filter(([id,d])=>d.production&&(this.game.state.buildings[id]??0)>0&&this.game.isCollectReady(id)).map(([id])=>id).join(','),c=this.game.state.construction;return`${ready}|${c?.id??''}:${c?.target??''}|${Object.values(this.game.state.buildings).join('.')}`}
 animate(){
  for(const s of this.snow){s.view.y+=s.speed*2;s.view.x+=s.drift;if(s.view.y>690){s.view.y=-660;s.view.x=-900+Math.random()*1800}}
  const furnace=this.buildingViews.get('furnace');if(furnace)for(let i=0;i<this.smoke.length;i++){const s=this.smoke[i],phase=(performance.now()*.00022+s.phase)%1;s.view.position.set(furnace.x+24+Math.sin(phase*8+i)*6,furnace.y-190-phase*150);s.view.alpha=(1-phase)*.18;s.view.scale.set(.65+phase*1.25)}
  if(this.game.state.construction){const c=this.buildingViews.get(this.game.state.construction.id),o=c?.getChildByLabel?.('construction');if(o){const j=this.game.state.construction,total=Math.max(1,j.finishAt-j.startedAt),p=Math.max(0,Math.min(1,1-(j.finishAt-Date.now())/total)),fill=o.children[2];fill.clear().roundRect(-52,22,104*p,6,3).fill(0xffcc55);o.children[3].text=`BUILDING ${Math.round(p*100)}%`}}
  const key=this.statusKey();if(key!==this.lastStatusKey)this.refresh();this.sortChildren()
 }
}
