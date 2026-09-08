import {Container,Sprite,Graphics,Text,Rectangle} from 'pixi.js'
import {allWorldTiles,BASE_TILE,parseTile,WORLD_CENTER,FACTIONS} from '../data/world.js'
import {REGIONS} from '../data/regions.js'
import {visualAssets} from './AssetLibrary.js'

const TW=82,TH=42,C=WORLD_CENTER
const iso=(x,y)=>({x:(x-y)*TW/2,y:(x+y-C*2)*TH/2})
const txt=(value,size=10,color=0xffffff,weight='900')=>new Text({text:value,style:{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:weight,stroke:{color:0x07171d,width:3}}})
const fit=(texture,w)=>{const s=new Sprite(texture);s.anchor.set(.5,1);s.scale.set(w/Math.max(1,texture.width));return s}
const clamp=n=>Math.max(0,Math.min(1,n))
const TERRAIN_TINT={
 'Frozen Plain':0xe8f2f2,'Pine Ridge':0xd7e5e2,'Ice Valley':0xdbeef2,'Snow Pass':0xe8e3d6,'Glacier Shelf':0xcfe6ec,
}
const REGION_LABELS=[['north',10,1],['west',2,10],['east',18,10],['south',10,19],['crown',10,6]]

export class WorldScene extends Container{
 constructor(game){super();this.game=game;this.sortableChildren=true;this.tiles=new Map();this.marchViews=new Map();this.makeMap();this.makeRegionLabels();this.marchLayer=new Container();this.marchLayer.zIndex=9000;this.addChild(this.marchLayer);this.refresh()}
 makeMap(){for(const def of allWorldTiles()){const p=iso(def.x,def.y),c=new Container();c.position.set(p.x,p.y);c.zIndex=Math.round(p.y);c.eventMode='static';c.cursor='pointer';c.hitArea=new Rectangle(-TW/2,-TH/2,TW,TH);c.on('pointertap',e=>{e.stopPropagation();this.game.selectWorldTile(def.id)});this.addChild(c);this.tiles.set(def.id,{def,view:c})}}
 makeRegionLabels(){for(const [id,x,y] of REGION_LABELS){const p=iso(x,y),root=new Container();root.position.set(p.x,p.y-35);root.zIndex=7000;const title=txt(REGIONS[id].name.toUpperCase(),11,0xdceff3,'900');title.anchor.set(.5);title.alpha=.55;root.addChild(title);this.addChild(root)}}
 tileTint(def,scouted,owned){if(!scouted)return 0x20353e;if(owned)return 0xe9f5ef;if(def.faction)return 0xe7dddd;return TERRAIN_TINT[def.terrain]??0xe1ecec}
 renderTile(def,c){
  c.removeChildren();const w=this.game.state.world,scouted=w.scouted.includes(def.id),owned=w.owned.includes(def.id),defeated=w.defeated.includes(def.id),burning=(w.settlementCooldown?.[def.id]??0)>Date.now(),rally=w.rally?.target===def.id
  const tex=visualAssets.snow[(def.x*7+def.y*11)%visualAssets.snow.length],ground=new Sprite(tex);ground.anchor.set(.5);ground.width=TW+1;ground.height=TH+1;ground.tint=this.tileTint(def,scouted,owned);ground.alpha=scouted?1:.9;c.addChild(ground)
  if(scouted&&def.faction&&!owned){const color=FACTIONS[def.faction]?.color??0x8c6666;c.addChild(new Graphics().poly([-TW/2,0,0,-TH/2,TW/2,0,0,TH/2]).stroke({color,width:2,alpha:.46}))}
  if(owned)c.addChild(new Graphics().poly([-TW/2,0,0,-TH/2,TW/2,0,0,TH/2]).stroke({color:0x58c58a,width:3,alpha:.92}))
  if(rally)c.addChild(new Graphics().circle(0,-7,28).stroke({color:0xffd36a,width:4,alpha:.95}))
  if(!scouted)return
  if(def.id===BASE_TILE){const s=fit(visualAssets.furnaceLevels[Math.min(visualAssets.furnaceLevels.length-1,Math.max(0,(this.game.state.buildings.furnace??1)-1))]??visualAssets.buildings.furnace,74);s.position.set(0,13);c.addChild(s);const t=txt('YOUR CITY',8,0xffdf83);t.anchor.set(.5);t.position.set(0,-57);c.addChild(t);return}
  if(def.kind==='resource'){const map={meat:'huntersHut',wood:'sawmill',coal:'coalMine',iron:'ironMine'},s=fit(visualAssets.buildings[map[def.resource]],42);s.position.set(0,11);c.addChild(s);const t=txt(`${def.resource.toUpperCase()} · L${def.level}`,6,0xe8f8ff);t.anchor.set(.5);t.position.set(0,17);c.addChild(t)}
  if(def.kind==='camp'&&!defeated){const s=fit(visualAssets.buildings.infantryCamp,46);s.tint=0xc76e65;s.position.set(0,12);c.addChild(s);const t=txt(`RAIDERS L${def.level}`,6,0xffaaa1);t.anchor.set(.5);t.position.set(0,19);c.addChild(t)}
  if(def.kind==='camp'&&defeated){const s=fit(visualAssets.props[(def.x+def.y)%visualAssets.props.length],26);s.alpha=.55;s.position.set(0,10);c.addChild(s)}
  if(def.kind==='settlement'){const s=fit(visualAssets.furnaceLevels[Math.min(visualAssets.furnaceLevels.length-1,Math.max(0,(def.tier??1)+2))]??visualAssets.buildings.furnace,74);s.tint=burning?0xe17a54:(FACTIONS[def.tag]?.color??0xb98578);s.position.set(0,14);c.addChild(s);const name=txt(`[${def.tag}] ${def.name}`,7,burning?0xffb080:0xffddd7);name.anchor.set(.5);name.position.set(0,-58);c.addChild(name);const power=txt(burning?'BURNING':`CITY L${def.tier}`,6,burning?0xff8b61:0xffb0a5);power.anchor.set(.5);power.position.set(0,20);c.addChild(power)}
  if(def.kind==='wild'&&((def.x*3+def.y)%4===0)){const tree=fit(visualAssets.trees[(def.x+def.y)%visualAssets.trees.length],30+((def.x+def.y)%3)*6);tree.position.set(0,10);tree.alpha=.85;c.addChild(tree)}
 }
 refreshMarches(){this.marchLayer.removeChildren();this.marchViews.clear();for(const m of this.game.state.world.marches??[]){const c=new Container(),color=m.type==='attack'?0xc95d5d:m.type==='rally'?0xd59b3f:m.type==='gather'?0xc79a4c:m.type==='claim'?0x62b987:0x4f9fc4;const bg=new Graphics().roundRect(-17,-10,34,20,9).fill({color,alpha:.96}).stroke({color:0xffffff,width:1.5,alpha:.75});const icon=txt(m.type==='attack'?'⚔':m.type==='rally'?'⚑':m.type==='gather'?'◆':m.type==='claim'?'⚑':'◎',9,0xffffff);icon.anchor.set(.5);c.addChild(bg,icon);this.marchLayer.addChild(c);this.marchViews.set(m.id,c)}this.updateMarchPositions()}
 updateMarchPositions(){const now=Date.now(),base=iso(WORLD_CENTER,WORLD_CENTER);for(const m of this.game.state.world.marches??[]){const v=this.marchViews.get(m.id);if(!v)continue;const [x,y]=parseTile(m.target),target=iso(x,y);let p=1;if(m.phase==='outbound')p=clamp((now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt));else if(m.phase==='returning')p=1-clamp((now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt));v.position.set(base.x+(target.x-base.x)*p,base.y+(target.y-base.y)*p-18);v.zIndex=9200+Math.round(v.y)}}
 refresh(){for(const {def,view} of this.tiles.values())this.renderTile(def,view);this.refreshMarches()}
 focus(id){const item=this.tiles.get(id);if(!item)return;const g=new Graphics().circle(0,-3,26).stroke({color:0xffd36a,width:4,alpha:.9});item.view.addChild(g);setTimeout(()=>this.refresh(),650)}
 animate(){this.updateMarchPositions()}
}
