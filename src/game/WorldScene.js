import {Container,Sprite,Graphics,Text,Rectangle} from 'pixi.js'
import {allWorldTiles,BASE_TILE} from '../data/world.js'
import {visualAssets} from './AssetLibrary.js'

const TW=118,TH=60,C=5
const iso=(x,y)=>({x:(x-y)*TW/2,y:(x+y-C*2)*TH/2})
const txt=(value,size=10,color=0xffffff)=>new Text({text:value,style:{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:'900',stroke:{color:0x0a1c23,width:3}}})
const fit=(texture,w)=>{const s=new Sprite(texture);s.anchor.set(.5,1);s.scale.set(w/Math.max(1,texture.width));return s}

export class WorldScene extends Container{
 constructor(game){super();this.game=game;this.sortableChildren=true;this.tiles=new Map();this.makeMap();this.refresh()}
 makeMap(){for(const def of allWorldTiles()){const p=iso(def.x,def.y),c=new Container();c.position.set(p.x,p.y);c.zIndex=Math.round(p.y);c.eventMode='static';c.cursor='pointer';c.hitArea=new Rectangle(-TW/2,-TH/2,TW,TH);c.on('pointertap',e=>{e.stopPropagation();this.game.selectWorldTile(def.id)});this.addChild(c);this.tiles.set(def.id,{def,view:c})}}
 renderTile(def,c){c.removeChildren();const w=this.game.state.world,scouted=w.scouted.includes(def.id),owned=w.owned.includes(def.id),defeated=w.defeated.includes(def.id);const tex=scouted?visualAssets.snow[(def.x*5+def.y*7)%visualAssets.snow.length]:visualAssets.snow[0];const ground=new Sprite(tex);ground.anchor.set(.5);ground.width=TW;ground.height=TH;ground.tint=scouted?(owned?0xeaf6ef:0xd8e7ea):0x243944;ground.alpha=scouted?1:.72;c.addChild(ground)
  if(owned){const ring=new Graphics().poly([-TW/2,0,0,-TH/2,TW/2,0,0,TH/2]).stroke({color:0x65d69a,width:3,alpha:.9});c.addChild(ring)}
  if(!scouted){const q=txt('?',18,0x9eb5bd);q.anchor.set(.5);q.position.set(0,-2);c.addChild(q);return}
  if(def.id===BASE_TILE){const s=fit(visualAssets.buildings.furnace,68);s.position.set(0,12);c.addChild(s);const t=txt('HOME',8,0xffdd7a);t.anchor.set(.5);t.position.set(0,24);c.addChild(t);return}
  if(def.kind==='resource'){const map={meat:'huntersHut',wood:'sawmill',coal:'coalMine',iron:'ironMine'},s=fit(visualAssets.buildings[map[def.resource]],52);s.position.set(0,13);c.addChild(s);const t=txt(def.resource.toUpperCase(),7,0xd9f3ff);t.anchor.set(.5);t.position.set(0,23);c.addChild(t)}
  if(def.kind==='camp'&&!defeated){const s=fit(visualAssets.buildings.infantryCamp,58);s.tint=0xca6a64;s.position.set(0,12);c.addChild(s);const t=txt(`${def.strength}`,7,0xffa8a0);t.anchor.set(.5);t.position.set(0,23);c.addChild(t)}
  if(def.kind==='camp'&&defeated){const t=txt('CLEARED',7,0x9be3b5);t.anchor.set(.5);t.position.set(0,2);c.addChild(t)}
  if(def.kind==='wild'&&((def.x+def.y)%3===0)){const tree=fit(visualAssets.trees[(def.x+def.y)%visualAssets.trees.length],42);tree.position.set(0,12);c.addChild(tree)}
 }
 refresh(){for(const {def,view} of this.tiles.values())this.renderTile(def,view)}
 focus(id){const item=this.tiles.get(id);if(!item)return;const g=new Graphics().circle(0,0,31).stroke({color:0xffd36a,width:4,alpha:.9});g.position.set(0,0);item.view.addChild(g);setTimeout(()=>this.refresh(),650)}
 animate(){}
}
