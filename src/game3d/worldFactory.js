import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,WORLD_CENTER,FACTIONS } from '../data/world.js'

const SIZE=21,TILE=1.62
const key=(x,y)=>`${x},${y}`
const hash=(x,y)=>Math.abs(Math.sin(x*91.17+y*47.31)*43758.5453)%1
const toWorld=(x,y)=>new THREE.Vector3((x-WORLD_CENTER)*TILE,0,(y-WORLD_CENTER)*TILE)
const mat=(color,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness:.95,transparent:opacity<1,opacity,depthWrite:opacity>.1})
function asset(bank,parent,name,x=0,y=0,z=0,rot=0,s=1){const o=bank.clone(name);o.position.set(x,y,z);o.rotation.y=rot;o.scale.setScalar(s);parent.add(o);return o}
function disk(parent,r,color,opacity=.2,y=.02){const m=new THREE.Mesh(new THREE.CircleGeometry(r,32),mat(color,opacity));m.rotation.x=-Math.PI/2;m.position.y=y;parent.add(m);return m}
function ring(parent,r,color,opacity=.28){const m=new THREE.Mesh(new THREE.RingGeometry(r*.78,r,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.032;parent.add(m);return m}
function tint(root,color){root.traverse(o=>{if(!o.isMesh||!o.material)return;const a=Array.isArray(o.material)?o.material:[o.material];o.material=Array.isArray(o.material)?a.map(m=>m?.clone?.()??m):(o.material.clone?.()??o.material);for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m?.color)m.color.multiply(new THREE.Color(color))})}

function glowPin(color){const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d'),h=`#${color.toString(16).padStart(6,'0')}`,g=x.createRadialGradient(48,48,5,48,48,43);g.addColorStop(0,'white');g.addColorStop(.18,h);g.addColorStop(.52,`${h}99`);g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,96,96);const t=new THREE.CanvasTexture(c),s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})),p=Math.random()*6;s.onBeforeRender=()=>s.scale.setScalar(.62+Math.sin(performance.now()*.004+p)*.09);return s}
function premium(bank,parent,size='small',tier=1,color=null,rot=0){const n=size==='large'?'downtownLarge':size==='medium'?'downtownMedium':'downtownSmall',b=asset(bank,parent,n,0,0,0,rot,.145+Math.min(8,tier)*.006);b.traverse(o=>{if(o.isMesh)o.castShadow=false});if(color)tint(b,color);return b}
function smallOffice(bank,parent,x,y){const g=new THREE.Group(),b=(x+y)%2?'B':'A',door=`wall${b}Door`,win=`wall${b}Window`,roof=`wall${b}Roof`;asset(bank,g,door,-.38,0,.4,0,.5);asset(bank,g,win,.38,0,.4,0,.5);asset(bank,g,win,-.38,0,-.4,Math.PI,.5);asset(bank,g,win,.38,0,-.4,Math.PI,.5);asset(bank,g,roof,-.38,.51,0,0,.5);asset(bank,g,roof,.38,.51,0,0,.5);g.scale.setScalar(.74);parent.add(g);return g}

function ribbon(parent,pts,width,color,opacity=1,y=.012){const curve=new THREE.CatmullRomCurve3(pts.map(([x,z])=>new THREE.Vector3(x,y,z))),seg=56,v=[],idx=[];for(let i=0;i<=seg;i++){const t=i/seg,p=curve.getPoint(t),tan=curve.getTangent(t),n=new THREE.Vector3(-tan.z,0,tan.x).normalize().multiplyScalar(width/2);v.push(p.x+n.x,p.y,p.z+n.z,p.x-n.x,p.y,p.z-n.z);if(i<seg){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();const material=mat(color,opacity);material.side=THREE.DoubleSide;const m=new THREE.Mesh(geo,material);m.receiveShadow=true;parent.add(m);return curve}
function roadNetwork(parent){
 ribbon(parent,[[-19,-13],[-12,-8],[-7,-3],[-1,-1],[7,1],[15,6],[20,12]],1.55,0x444a49)
 ribbon(parent,[[-20,8],[-12,6],[-5,4],[0,-1],[3,-8],[7,-15],[10,-20]],1.45,0x454b4a)
 ribbon(parent,[[-17,17],[-10,12],[-3,9],[5,8],[12,10],[19,15]],1.35,0x454b4a)
 ribbon(parent,[[-17,-18],[-11,-12],[-6,-7],[-1,-1],[-2,6],[-5,13],[-8,19]],1.3,0x454b4a)
 ribbon(parent,[[-3,-20],[0,-12],[4,-6],[8,1],[12,7],[14,15]],1.2,0x454b4a)
}
function park(bank,parent,x,z,r=2.3){const g=new THREE.Group();g.position.set(x,0,z);disk(g,r,0x73977b,1,.006);for(let i=0;i<7;i++){const a=i*2.399,rr=r*.3+(i%3)*.48;asset(bank,g,i%3===0?'downtownTreeA':'pineSmall',Math.cos(a)*rr,0,Math.sin(a)*rr,a,i%3===0?.16:.25)}parent.add(g)}
function neighbourhood(bank,parent,x,z,variant=0){const g=new THREE.Group();g.position.set(x,0,z);const count=variant%2?3:2;for(let i=0;i<count;i++){const ox=(i-(count-1)/2)*1.15,oz=(i%2)*.8-.35;smallOffice(bank,g,variant+i,variant-i).position.set(ox,0,oz)}if(variant%3===0)asset(bank,g,'pineSmall',1.25,0,-.65,.2,.24);parent.add(g)}
function cityBackdrop(bank,parent){
 const blocks=[[-15,-9,1],[-13,11,2],[-8,16,3],[-1,15,4],[7,15,5],[15,12,6],[17,3,7],[15,-8,8],[9,-15,9],[-1,-16,10],[-10,-14,11],[-17,1,12],[-8,7,13],[8,-8,14],[10,5,15],[-5,-7,16]]
 blocks.forEach(([x,z,v])=>neighbourhood(bank,parent,x,z,v));park(bank,parent,-13,-2,2.4);park(bank,parent,12,-2,2.2);park(bank,parent,1,12,2.0)
 for(const [x,z,r,n] of[[-10,-7,.5,'truckGreen'],[-3,-1,2.2,'truckGrey'],[6,.5,-1.2,'truckGreen'],[12,9,-2.1,'truckGrey'],[4,-12,.3,'truckGreen']])asset(bank,parent,n,x,.04,z,r,.18)
}
function importantOpportunity(bank,parent,resource,x,y,featured){
 const colors={meat:0x55dfa7,wood:0x65b9ff,coal:0xffc65d,iron:0xce9eff},c=colors[resource]??0x8bcfc0
 if(!featured){if(hash(x,y)<.14)asset(bank,parent,'pineSmall',0,0,0,hash(x,y)*6,.2);return}
 smallOffice(bank,parent,x,y);ring(parent,.68,c,.34);const m=glowPin(c);m.position.set(.34,1.02,.1);parent.add(m);if(hash(x,y)>.58)asset(bank,parent,hash(x,y)>.78?'truckGreen':'truckGrey',-.3,.02,.35,.25,.14)
}
function contract(bank,parent,level=1){const c=level>=5?0xff7f6f:0xffb85d;ring(parent,.72,c,.42);asset(bank,parent,'scaffold',0,0,0,.2,.22);asset(bank,parent,'truckGrey',-.32,.02,.3,.45,.15);const m=glowPin(c);m.position.set(.32,.9,.1);parent.add(m)}
function invisibleHit(parent,id){const h=new THREE.Mesh(new THREE.PlaneGeometry(TILE*.94,TILE*.94),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,depthWrite:false}));h.rotation.x=-Math.PI/2;h.position.y=.05;h.userData.tileId=id;parent.add(h)}

export class World3D extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.build()}
 build(){
  this.clear();this.tiles.clear();this.marchObjects.clear();const span=SIZE*TILE+12,ground=new THREE.Mesh(new THREE.PlaneGeometry(span,span),mat(0x9ba999));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;this.add(ground);roadNetwork(this);cityBackdrop(this.bank,this)
  const ownedSet=new Set(this.state.world.owned),scoutedSet=new Set(this.state.world.scouted)
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const def=worldTile(x,y),id=key(x,y),scouted=scoutedSet.has(id),owned=ownedSet.has(id),p=toWorld(x,y),c=new THREE.Group();c.position.copy(p);c.userData.tileId=id;invisibleHit(c,id)
   const adjacentOwned=[`${x+1},${y}`,`${x-1},${y}`,`${x},${y+1}`,`${x},${y-1}`].some(n=>ownedSet.has(n))
   if(owned){disk(c,.74,0x55c794,.10,.022);ring(c,.73,0x57d7a4,.18)}
   if(scouted){
    if(id===BASE_TILE){premium(this.bank,c,'large',5,0x9dffe1,Math.PI/2);ring(c,1.05,0x55dfa7,.4);const m=glowPin(0x55dfa7);m.position.set(.42,1.75,.1);c.add(m)}
    else if(def.kind==='settlement'){premium(this.bank,c,(def.tier??1)>4?'medium':'small',def.tier??1,FACTIONS[def.tag]?.color??0xcaa9d2,(x+y)%4*Math.PI/2);ring(c,.78,FACTIONS[def.tag]?.color??0xd0a2df,.33);const m=glowPin(FACTIONS[def.tag]?.color??0xd0a2df);m.position.set(.32,1.28,.1);c.add(m)}
    else if(def.kind==='camp'&&!this.state.world.defeated.includes(id))contract(this.bank,c,def.level)
    else if(def.kind==='resource')importantOpportunity(this.bank,c,def.resource,x,y,owned||adjacentOwned)
    else if(hash(x,y)>.76)smallOffice(this.bank,c,x,y)
    else if(hash(x,y)<.18)asset(this.bank,c,'pineSmall',0,0,0,hash(x,y)*6,.22)
   }else if(adjacentOwned){const m=glowPin(0x9bd9c3);m.material.opacity=.42;m.position.set(0,.34,0);m.scale.setScalar(.28);c.add(m)}
   c.traverse(o=>{if(o.userData)o.userData.tileId=id});this.add(c);this.tiles.set(id,c)
  }
  this.refreshMarches()
 }
 refresh(){this.build()}
 refreshMarches(){for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear();for(const m of this.state.world.marches??[]){const o=this.bank.clone((m.type==='attack'||m.type==='compete')?'truckGrey':'truckGreen');o.scale.setScalar(.19);o.position.y=.05;this.add(o);this.marchObjects.set(m.id,o)}this.updateMarches(Date.now())}
 updateMarches(now){const base=toWorld(WORLD_CENTER,WORLD_CENTER);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;const [x,y]=parseTile(m.target),target=toWorld(x,y);let p=1;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning')p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));const bend=Math.sin(p*Math.PI)*.45;o.position.x=base.x+(target.x-base.x)*p+bend;o.position.z=base.z+(target.z-base.z)*p-bend;o.position.y=.05;o.rotation.y=Math.atan2(target.x-base.x,target.z-base.z)}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
