import { Container,Sprite,Text,Rectangle,Graphics } from 'pixi.js'
import { BUILDINGS,RESOURCES,buildingRequirements,nextBuildingLevel } from '../data/buildings.js'
import { furnaceVisualIndex,furnaceTier } from '../data/furnace.js'
import { buildingUnlocked,buildingTeased,cityHeatRadius,unlockLevelForBuilding } from '../data/cityProgression.js'
import { visualAssets } from './AssetLibrary.js'

const TW=128,TH=64,CENTER=12
const LAYOUT={
 furnace:[12,12],shelter:[9,14],sawmill:[15,14],huntersHut:[17,11],coalMine:[16,8],ironMine:[19,13],
 storehouse:[12,17],infirmary:[8,9],embassy:[9,6],infantryCamp:[13,6],lancerCamp:[16,5],marksmanCamp:[18,8],researchCenter:[7,12],
}
const iso=(gx,gy)=>({x:(gx-gy)*TW/2,y:(gx+gy-CENTER*2)*TH/2})
const txt=(value,size=12,color=0xffffff,weight='800')=>new Text({text:value,style:{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:weight,stroke:{color:0x0b2029,width:4}}})
const rng=(n)=>{const x=Math.sin(n*999.31)*43758.5453;return x-Math.floor(x)}
function sprite(texture,width){const s=new Sprite(texture);s.anchor.set(.5,1);const scale=width/Math.max(1,texture.width);s.scale.set(scale);return s}
function marker(label,color=0x1d5265){const c=new Container();const g=new Graphics().circle(0,0,20).fill({color,alpha:.96}).stroke({color:0xffffff,alpha:.85,width:2});const t=txt(label,13,0xffffff,'900');t.anchor.set(.5);t.position.set(0,-1);c.addChild(g,t);return c}
function badge(label,color=0x102c37){const c=new Container();const g=new Graphics().roundRect(-34,-10,68,20,10).fill({color,alpha:.94}).stroke({color:0xffffff,alpha:.35,width:1});const t=txt(label,9,0xffffff,'900');t.anchor.set(.5);c.addChild(g,t);return c}

export class CityScene extends Container{
 constructor(game){super();this.game=game;this.sortableChildren=true;this.buildingViews=new Map();this.snow=[];this.smoke=[];this.lastStatusKey='';this.makeTerrain();this.makeCoreZone();this.makeForest();this.makeBuildings();this.makeAtmosphere()}
 makeTerrain(){
  const road=new Set();for(let x=6;x<=19;x++)road.add(`${x},12`);for(let y=5;y<=18;y++)road.add(`12,${y}`);for(let x=9;x<=17;x++)road.add(`${x},8`);for(let x=8;x<=16;x++)road.add(`${x},15`)
  for(let gy=0;gy<24;gy++)for(let gx=0;gx<24;gx++){
   const p=iso(gx,gy),river=gx+gy>38,bridge=river&&(gx===12||gy===12),isRoad=road.has(`${gx},${gy}`)&&!river
   const pool=bridge?visualAssets.bridges:river?visualAssets.water:isRoad?visualAssets.paths:visualAssets.snow
   const tex=pool[Math.abs((gx*7+gy*11))%pool.length],s=new Sprite(tex);s.anchor.set(.5);s.width=TW;s.height=bridge?TH*2:TH;s.position.set(p.x,p.y);s.zIndex=-5000+Math.round(p.y);if(!river&&!isRoad)s.tint=((gx+gy)&1)?0xf2f7f6:0xe8f2f2;this.addChild(s)
  }
 }
 makeCoreZone(){this.coreGlow=new Graphics();this.coreGlow.zIndex=-2400;this.addChild(this.coreGlow);this.refreshCoreZone()}
 refreshCoreZone(){if(!this.coreGlow)return;const level=this.game.state.buildings.furnace??1,r=cityHeatRadius(level);this.coreGlow.clear().poly([-r,0,0,-r*.46,r,0,0,r*.46]).fill({color:0xffb54f,alpha:.055}).stroke({color:0xffd889,width:3,alpha:.20});const inner=r*.58;this.coreGlow.poly([-inner,0,0,-inner*.46,inner,0,0,inner*.46]).stroke({color:0xffc45d,width:2,alpha:.16})}
 makeForest(){
  const blocked=new Set(Object.values(LAYOUT).map(([x,y])=>`${x},${y}`));for(let i=0;i<74;i++){
   let gx=Math.floor(rng(i+2)*24),gy=Math.floor(rng(i+99)*24);if(gx>4&&gx<20&&gy>4&&gy<20&&rng(i+31)>.34)continue;if(blocked.has(`${gx},${gy}`)||gx+gy>38)continue
   const p=iso(gx,gy),tex=visualAssets.trees[i%visualAssets.trees.length],s=sprite(tex,78+(i%5)*9);s.position.set(p.x+(rng(i+50)-.5)*48,p.y+24);s.zIndex=Math.round(s.y)-120;s.alpha=.94;this.addChild(s)
  }
  for(let i=0;i<26;i++){const gx=5+Math.floor(rng(i+310)*14),gy=5+Math.floor(rng(i+510)*14);if(blocked.has(`${gx},${gy}`))continue;const p=iso(gx,gy),s=sprite(visualAssets.props[i%visualAssets.props.length],36+(i%3)*8);s.position.set(p.x+(rng(i+700)-.5)*42,p.y+18);s.zIndex=Math.round(s.y)-30;s.alpha=.86;this.addChild(s)}
 }
 makeBuildings(){
  for(const id of Object.keys(BUILDINGS)){const [gx,gy]=LAYOUT[id]??[12,12],p=iso(gx,gy),c=new Container();c.position.set(p.x,p.y+26);c.zIndex=Math.round(c.y)+300;c.eventMode='static';c.cursor='pointer';c.hitArea=id==='furnace'?new Rectangle(-138,-320,276,355):new Rectangle(-96,-220,192,260);c.on('pointertap',e=>{e.stopPropagation();this.game.selectBuilding(id)});this.addChild(c);this.buildingViews.set(id,c)}this.refresh()
 }
 renderLockedPlot(id,c){const level=unlockLevelForBuilding(id),foundation=sprite(visualAssets.foundation,92);foundation.alpha=.34;foundation.tint=0x8297a2;foundation.label='asset';c.addChild(foundation);const lock=badge(`LOCKED · F${level}`,0x33434b);lock.position.set(0,-48);c.addChild(lock)}
 renderEmptyPlot(id,c){const def=BUILDINGS[id],foundation=sprite(visualAssets.foundation,112);foundation.alpha=.92;foundation.tint=0xdde8e8;foundation.label='asset';c.addChild(foundation);const name=txt(def.name.toUpperCase(),9,0xd9edf2,'900');name.anchor.set(.5);name.position.set(0,-76);c.addChild(name);const build=marker('+',0x2b7ca0);build.position.set(34,-42);c.addChild(build)}
 renderBuilding(id,c){
  c.removeChildren();const level=this.game.state.buildings[id]??0,def=BUILDINGS[id],unlocked=buildingUnlocked(this.game.state,id),teased=buildingTeased(this.game.state,id)
  if(id!=='furnace'&&!teased){c.visible=false;return}c.visible=true
  if(id!=='furnace'&&!unlocked&&!level){this.renderLockedPlot(id,c);return}
  if(id!=='furnace'&&!level){this.renderEmptyPlot(id,c);return}
  let texture=visualAssets.buildings[id];if(id==='furnace')texture=visualAssets.furnaceLevels[furnaceVisualIndex(level)]??visualAssets.buildings.furnace
  const width=id==='furnace'?282:(id.includes('Mine')?158:(def.category==='military'?145:152)),art=sprite(texture,width);art.label='asset';if(id!=='furnace'&&level>=8)art.tint=0xffeed0;c.addChild(art)
  const levelMark=badge(id==='furnace'?`Lv.${level} · CORE`:`Lv.${level}`);levelMark.position.set(0,id==='furnace'?30:18);c.addChild(levelMark)
  if(id==='furnace'){
   const title=txt('FURNACE',15,0xffdf8a,'900');title.anchor.set(.5);title.position.set(0,-300);c.addChild(title)
   const tier=txt(furnaceTier(level).toUpperCase(),9,0xcde8ee,'900');tier.anchor.set(.5);tier.position.set(0,-278);c.addChild(tier)
  }
  if(def.production&&this.game.isCollectReady(id)){const b=marker('+',RESOURCES[def.production.resource].color);b.position.set(46,-145);b.eventMode='static';b.cursor='pointer';b.on('pointertap',e=>{e.stopPropagation();this.game.collectResource(id)});c.addChild(b)}
  const target=nextBuildingLevel(this.game.state,id),req=def.levels[target]?buildingRequirements(this.game.state,id,target):[]
  if(def.levels[target]&&!req.length&&!this.game.state.construction){const up=marker('↑',0xc78a38);up.position.set(id==='furnace'?-88:-48,id==='furnace'?-198:-150);c.addChild(up)}
  if(this.game.state.construction?.id===id)c.addChild(this.constructionOverlay(id))
 }
 refresh(){this.refreshCoreZone();for(const [id,c] of this.buildingViews)this.renderBuilding(id,c);this.lastStatusKey=this.statusKey();this.sortChildren()}
 constructionOverlay(id){const root=new Container();root.position.set(0,id==='furnace'?-250:-205);const bg=new Graphics().roundRect(-74,0,148,38,13).fill({color:0x0c2631,alpha:.96}).stroke({color:0xffd36a,width:2});const rail=new Graphics().roundRect(-58,25,116,6,3).fill({color:0x3a5059});const fill=new Graphics();const label=txt('CONSTRUCTING',9,0xffd36a,'900');label.anchor.set(.5);label.position.set(0,10);root.addChild(bg,rail,fill,label);root.label='construction';return root}
 makeAtmosphere(){for(let i=0;i<80;i++){const s=new Graphics().circle(0,0,1+(i%3)*.7).fill({color:0xffffff,alpha:.65});s.position.set(-900+rng(i+800)*1800,-650+rng(i+900)*1300);s.zIndex=5000;this.addChild(s);this.snow.push({view:s,speed:.3+(i%5)*.08,drift:(rng(i+1200)-.5)*.18})}for(let i=0;i<8;i++){const s=new Graphics().circle(0,0,10+i*1.8).fill({color:0xd9e6e7,alpha:.18});s.zIndex=1000+i;this.addChild(s);this.smoke.push({view:s,phase:i/8})}}
 getBuildingPosition(id){const c=this.buildingViews.get(id);return c&&c.visible?{x:c.x,y:c.y}:null}
 focus(id){const c=this.buildingViews.get(id);if(!c?.visible)return;const art=c.getChildByLabel?.('asset');if(!art)return;const sx=art.scale.x,sy=art.scale.y;art.scale.set(sx*1.12,sy*1.12);setTimeout(()=>this.refresh(),520)}
 statusKey(){const ready=Object.entries(BUILDINGS).filter(([id,d])=>d.production&&(this.game.state.buildings[id]??0)>0&&this.game.isCollectReady(id)).map(([id])=>id).join(',');const c=this.game.state.construction;return`${ready}|${c?.id??''}:${c?.target??''}|${Object.values(this.game.state.buildings).join('.')}`}
 animate(){
  for(const s of this.snow){s.view.y+=s.speed*2;s.view.x+=s.drift;if(s.view.y>690){s.view.y=-660;s.view.x=-900+Math.random()*1800}}
  const furnace=this.buildingViews.get('furnace');if(furnace){for(let i=0;i<this.smoke.length;i++){const s=this.smoke[i],phase=(performance.now()*.00022+s.phase)%1;s.view.position.set(furnace.x+35+Math.sin(phase*8+i)*7,furnace.y-230-phase*165);s.view.alpha=(1-phase)*.22;s.view.scale.set(.7+phase*1.4)}}
  if(this.game.state.construction){const c=this.buildingViews.get(this.game.state.construction.id),o=c?.getChildByLabel?.('construction');if(o){const j=this.game.state.construction,total=Math.max(1,j.finishAt-j.startedAt),p=Math.max(0,Math.min(1,1-(j.finishAt-Date.now())/total)),fill=o.children[2];fill.clear().roundRect(-58,25,116*p,6,3).fill(0xffcc55);o.children[3].text=`CONSTRUCTING ${Math.round(p*100)}%`}}
  const key=this.statusKey();if(key!==this.lastStatusKey)this.refresh();this.sortChildren()
 }
}
