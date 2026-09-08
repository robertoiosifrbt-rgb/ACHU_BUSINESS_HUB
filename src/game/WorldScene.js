import {Container,Sprite,Graphics,Text,Rectangle} from 'pixi.js'
import {allWorldTiles,BASE_TILE,parseTile} from '../data/world.js'
import {visualAssets} from './AssetLibrary.js'

const TW=118,TH=60,C=5
const iso=(x,y)=>({x:(x-y)*TW/2,y:(x+y-C*2)*TH/2})
const txt=(value,size=10,color=0xffffff)=>new Text({text:value,style:{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:'900',stroke:{color:0x0a1c23,width:3}}})
const fit=(texture,w)=>{const s=new Sprite(texture);s.anchor.set(.5,1);s.scale.set(w/Math.max(1,texture.width));return s}
const clamp=n=>Math.max(0,Math.min(1,n))

export class WorldScene extends Container{
 constructor(game){super();this.game=game;this.sortableChildren=true;this.tiles=new Map();this.marchViews=new Map();this.makeMap();this.marchLayer=new Container();this.marchLayer.zIndex=8000;this.addChild(this.marchLayer);this.refresh()}
 makeMap(){for(const def of allWorldTiles()){const p=iso(def.x,def.y),c=new Container();c.position.set(p.x,p.y);c.zIndex=Math.round(p.y);c.eventMode='static';c.cursor='pointer';c.hitArea=new Rectangle(-TW/2,-TH/2,TW,TH);c.on('pointertap',e=>{e.stopPropagation();this.game.selectWorldTile(def.id)});this.addChild(c);this.tiles.set(def.id,{def,view:c})}}
 renderTile(def,c){c.removeChildren();const w=this.game.state.world,scouted=w.scouted.includes(def.id),owned=w.owned.includes(def.id),defeated=w.defeated.includes(def.id);const tex=scouted?visualAssets.snow[(def.x*5+def.y*7)%visualAssets.snow.length]:visualAssets.snow[0];const ground=new Sprite(tex);ground.anchor.set(.5);ground.width=TW;ground.height=TH;ground.tint=scouted?(owned?0xeaf6ef:0xd8e7ea):0x243944;ground.alpha=scouted?1:.72;c.addChild(ground)
  if(owned)c.addChild(new Graphics().poly([-TW/2,0,0,-TH/2,TW/2,0,0,TH/2]).stroke({color:0x65d69a,width:3,alpha:.9}))
  if(!scouted){const q=txt('?',18,0x9eb5bd);q.anchor.set(.5);q.position.set(0,-2);c.addChild(q);return}
  if(def.id===BASE_TILE){const s=fit(visualAssets.buildings.furnace,68);s.position.set(0,12);c.addChild(s);const t=txt('HOME',8,0xffdd7a);t.anchor.set(.5);t.position.set(0,24);c.addChild(t);return}
  if(def.kind==='resource'){const map={meat:'huntersHut',wood:'sawmill',coal:'coalMine',iron:'ironMine'},s=fit(visualAssets.buildings[map[def.resource]],52);s.position.set(0,13);c.addChild(s);const t=txt(def.resource.toUpperCase(),7,0xd9f3ff);t.anchor.set(.5);t.position.set(0,23);c.addChild(t)}
  if(def.kind==='camp'&&!defeated){const s=fit(visualAssets.buildings.infantryCamp,58);s.tint=0xca6a64;s.position.set(0,12);c.addChild(s);const t=txt(`${def.strength}`,7,0xffa8a0);t.anchor.set(.5);t.position.set(0,23);c.addChild(t)}
  if(def.kind==='camp'&&defeated){const t=txt('CLEARED',7,0x9be3b5);t.anchor.set(.5);t.position.set(0,2);c.addChild(t)}
  if(def.kind==='wild'&&((def.x+def.y)%3===0)){const tree=fit(visualAssets.trees[(def.x+def.y)%visualAssets.trees.length],42);tree.position.set(0,12);c.addChild(tree)}
 }
 refreshMarches(){this.marchLayer.removeChildren();this.marchViews.clear();for(const m of this.game.state.world.marches??[]){const c=new Container(),color=m.type==='attack'?0xc95d5d:m.type==='gather'?0xc79a4c:m.type==='claim'?0x62b987:0x4f9fc4;const ring=new Graphics().circle(0,0,15).fill({color,alpha:.98}).stroke({color:0xffffff,width:2,alpha:.85});const icon=txt(m.type==='attack'?'⚔':m.type==='gather'?'◆':m.type==='claim'?'⚑':'◎',10,0xffffff);icon.anchor.set(.5);c.addChild(ring,icon);this.marchLayer.addChild(c);this.marchViews.set(m.id,c)}this.updateMarchPositions()}
 updateMarchPositions(){const now=Date.now(),base=iso(5,5);for(const m of this.game.state.world.marches??[]){const v=this.marchViews.get(m.id);if(!v)continue;const [x,y]=parseTile(m.target),target=iso(x,y);let p=1;if(m.phase==='outbound')p=clamp((now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt));else if(m.phase==='returning')p=1-clamp((now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt));v.position.set(base.x+(target.x-base.x)*p,base.y+(target.y-base.y)*p-18);v.zIndex=9000+Math.round(v.y)}}
 refresh(){for(const {def,view} of this.tiles.values())this.renderTile(def,view);this.refreshMarches()}
 focus(id){const item=this.tiles.get(id);if(!item)return;const g=new Graphics().circle(0,0,31).stroke({color:0xffd36a,width:4,alpha:.9});g.position.set(0,0);item.view.addChild(g);setTimeout(()=>this.refresh(),650)}
 animate(){this.updateMarchPositions()}
}
