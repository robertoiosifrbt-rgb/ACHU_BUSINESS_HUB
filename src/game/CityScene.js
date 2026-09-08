import { Container,Graphics,Text,Rectangle } from 'pixi.js'
import { BUILDINGS } from '../data/buildings.js'

const C={snow:0xe8f5fb,snow2:0xd6ecf7,road:0x9eb8c6,wood:0x8b5a3c,roof:0x4d7082,gold:0xf0bd54,fire:0xff9c2f,locked:0x7f929b}
function txt(text,size=14,color=0x16324a){return new Text({text,style:{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:'700',stroke:{color:0xffffff,width:3}}})}
function buildingArt(id,level){
 const c=new Container();const shadow=new Graphics().ellipse(0,28,62,22).fill({color:0x58717c,alpha:.22});c.addChild(shadow)
 const locked=level===0;const body=new Graphics();const base=locked?C.locked:(id==='furnace'?0x6e5447:0x9d7457);body.roundRect(-42,-28,84,58,10).fill(base).stroke({color:0x40535d,width:3});c.addChild(body)
 const roof=new Graphics().poly([-48,-28,0,-62,48,-28,0,-8]).fill(locked?0x8b9ba3:(id==='furnace'?0x394c59:C.roof)).stroke({color:0x394e59,width:3});c.addChild(roof)
 if(id==='furnace'&&!locked){const tower=new Graphics().roundRect(-14,-90,28,54,8).fill(0x4b5a61).stroke({color:0x2f4149,width:3});const flame=new Graphics().circle(0,-100,13).fill(C.fire);flame.label='flame';c.addChild(tower,flame)}
 if(id==='sawmill'&&!locked){for(let i=0;i<3;i++)c.addChild(new Graphics().roundRect(-52+i*22,5,16,34,7).fill(C.wood))}
 if(id==='coalMine'&&!locked)c.addChild(new Graphics().circle(0,10,23).fill(0x35454c))
 if(id.includes('Camp')&&!locked)c.addChild(new Graphics().poly([-22,5,0,-30,22,5]).fill(0x6f8c61))
 if(id==='researchCenter'&&!locked)c.addChild(new Graphics().circle(0,-8,20).stroke({color:C.gold,width:5}))
 const badge=new Graphics().roundRect(-28,35,56,24,12).fill({color:locked?0x5e6d74:0x253d49,alpha:.92});c.addChild(badge);const l=txt(locked?'LOCKED':`Lv. ${level}`,11,0xffffff);l.anchor.set(.5);l.position.set(0,47);c.addChild(l)
 return c
}
export class CityScene extends Container{
 constructor(game){super();this.game=game;this.scale.set(1);this.position.set(0,0);this.eventMode='static';this.sortableChildren=true;this.buildingViews=new Map();this.makeGround();this.makeBuildings()}
 makeGround(){const g=new Graphics();g.roundRect(-760,-470,1520,940,90).fill(C.snow).stroke({color:0xc8e3ee,width:12});for(let i=-650;i<=650;i+=130)g.moveTo(i,-390).lineTo(i+500,390).stroke({color:C.snow2,width:3,alpha:.5});g.moveTo(-520,0).lineTo(520,0).stroke({color:C.road,width:44,alpha:.55});g.moveTo(0,-330).lineTo(0,330).stroke({color:C.road,width:44,alpha:.55});this.addChild(g);for(let i=0;i<22;i++){const x=-680+(i*137)%1360,y=-400+(i*83)%800;const t=new Graphics().poly([x,y-28,x-22,y+18,x+22,y+18]).fill(0x5d8c73).rect(x-4,y+17,8,18).fill(0x775a46);this.addChild(t)}}
 makeBuildings(){for(const [id,d] of Object.entries(BUILDINGS)){const c=new Container();c.position.set(d.x,d.y);c.zIndex=Math.round(d.y);c.eventMode='static';c.cursor='pointer';c.hitArea=new Rectangle(-58,-105,116,170);c.on('pointertap',e=>{e.stopPropagation();this.game.selectBuilding(id)});this.addChild(c);this.buildingViews.set(id,c)}this.refresh()}
 refresh(){for(const [id,c] of this.buildingViews){c.removeChildren();const lvl=this.game.state.buildings[id]??0;c.addChild(buildingArt(id,lvl));const n=txt(BUILDINGS[id].name,13);n.anchor.set(.5);n.position.set(0,70);c.addChild(n)}}
 animate(t){const furnace=this.buildingViews.get('furnace');const flame=furnace?.children[0]?.getChildByLabel?.('flame');if(flame)flame.scale.set(1+Math.sin(t/130)*.12)}
}
