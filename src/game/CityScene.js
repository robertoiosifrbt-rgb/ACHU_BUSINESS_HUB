import { Container,Sprite,Text,Rectangle } from 'pixi.js'
import { BUILDINGS,RESOURCES } from '../data/buildings.js'
import { visualAssets } from './AssetLibrary.js'

const txt=(text,size=14,color=0x203943,weight='700')=>new Text({text,style:{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:weight,stroke:{color:0xffffff,width:3}}})

function fitSprite(texture,width){
 const s=new Sprite(texture);s.anchor.set(.5,1);const scale=width/Math.max(1,texture.width);s.scale.set(scale);return s
}
function levelLabel(level){const t=txt(level?`Lv. ${level}`:'LOCKED',11,level?0xffffff:0xdbe5e9);t.anchor.set(.5);t.position.set(0,13);return t}
function nameLabel(name){const t=txt(name,13);t.anchor.set(.5);t.position.set(0,31);return t}
function resourceLabel(resource){const r=RESOURCES[resource];const t=txt(r.short,10,r.color,'800');t.anchor.set(.5);t.position.set(0,-118);return t}
function buildingView(id,level){
 const texture=visualAssets.buildings[id];const c=new Container();const width=id==='furnace'?168:128;const s=fitSprite(texture,width);s.label='asset';
 if(!level){s.tint=0x71818a;s.alpha=.45}else if(level>=8){s.tint=0xfff3d0}else if(level>=5){s.tint=0xe7f3ff}
 c.addChild(s);return c
}

export class CityScene extends Container{
 constructor(game){super();this.game=game;this.sortableChildren=true;this.buildingViews=new Map();this.people=[];this.makeTerrain();this.makeEnvironment();this.makeBuildings();this.makePeople()}
 makeTerrain(){
  const textures=visualAssets.tiles;let index=0
  for(let r=-8;r<=8;r++)for(let c=-10;c<=10;c++){
   const texture=textures[(Math.abs(r*3+c*5)+index++)%textures.length];const s=new Sprite(texture);s.anchor.set(.5);s.width=108;s.height=76;s.position.set((c-r)*51,(c+r)*25);s.tint=((r+c)&1)?0xddeef2:0xe8f5f7;s.alpha=.98;s.zIndex=-3000+Math.round(s.y);this.addChild(s)
  }
 }
 makeEnvironment(){
  const edge=[];for(let i=0;i<54;i++){const side=i%4;let x,y;if(side===0){x=-720+(i*83)%1440;y=-410+(i%5)*34}else if(side===1){x=-720+(i*97)%1440;y=410-(i%5)*30}else if(side===2){x=-720+(i%5)*35;y=-360+(i*89)%720}else{x=720-(i%5)*35;y=-360+(i*79)%720}edge.push({x,y})}
  edge.forEach((p,i)=>{const texture=visualAssets.environment[i%visualAssets.environment.length];const s=fitSprite(texture,70+(i%4)*9);s.position.set(p.x,p.y);s.tint=0xd9eef0;s.alpha=.88;s.zIndex=Math.round(p.y)-200;this.addChild(s)})
 }
 makeBuildings(){
  for(const [id,d] of Object.entries(BUILDINGS)){
   const c=new Container();c.position.set(d.x,d.y);c.zIndex=Math.round(d.y)+100;c.eventMode='static';c.cursor='pointer';c.hitArea=new Rectangle(-78,-150,156,190);c.on('pointertap',e=>{e.stopPropagation();this.game.selectBuilding(id)});this.addChild(c);this.buildingViews.set(id,c)
  }
  this.refresh()
 }
 refresh(){
  for(const [id,c] of this.buildingViews){
   c.removeChildren();const lvl=this.game.state.buildings[id]??0;const def=BUILDINGS[id];c.addChild(buildingView(id,lvl));if(lvl&&def.production)c.addChild(resourceLabel(def.production.resource));c.addChild(levelLabel(lvl),nameLabel(def.name))
  }
 }
 makePeople(){
  for(let i=0;i<10;i++){
   const texture=visualAssets.units[i%visualAssets.units.length];const s=fitSprite(texture,34);s.zIndex=1600+i;this.addChild(s);this.people.push({view:s,a:i/10*Math.PI*2,r:120+(i%4)*56,s:.00015+(i%3)*.000025})
  }
 }
 focus(id){
  const c=this.buildingViews.get(id);if(!c)return;const s=c.getChildByLabel?.('asset')??c.children[0]?.children?.[0];if(s){s.alpha=1;s.scale.set(s.scale.x*1.12);setTimeout(()=>this.refresh(),650)}
 }
 animate(){for(const p of this.people){p.a+=p.s*16;p.view.position.set(Math.cos(p.a)*p.r,Math.sin(p.a)*p.r*.56+42);p.view.zIndex=Math.round(p.view.y)+1500}this.sortChildren()}
}
