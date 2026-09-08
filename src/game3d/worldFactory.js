import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,WORLD_CENTER,FACTIONS } from '../data/world.js'

const SIZE=21,TILE=1.62
const key=(x,y)=>`${x},${y}`
const hash=(x,y)=>Math.abs(Math.sin(x*91.17+y*47.31)*43758.5453)%1
const toWorld=(x,y)=>new THREE.Vector3((x-WORLD_CENTER)*TILE,0,(y-WORLD_CENTER)*TILE)
const mat=(color,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness:.94,transparent:opacity<1,opacity,depthWrite:opacity>.12})
function asset(bank,parent,name,x=0,y=0,z=0,rot=0,s=1){const o=bank.clone(name);o.position.set(x,y,z);o.rotation.y=rot;o.scale.setScalar(s);parent.add(o);return o}
function disk(parent,r,color,opacity=.24,y=.018){const m=new THREE.Mesh(new THREE.CircleGeometry(r,32),mat(color,opacity));m.rotation.x=-Math.PI/2;m.position.y=y;parent.add(m);return m}
function tint(root,color){root.traverse(o=>{if(!o.isMesh||!o.material)return;const a=Array.isArray(o.material)?o.material:[o.material];o.material=Array.isArray(o.material)?a.map(m=>m?.clone?.()??m):(o.material.clone?.()??o.material);for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m?.color)m.color.multiply(new THREE.Color(color))})}

function marker(color){
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,5,64,64,60),hex=`#${color.toString(16).padStart(6,'0')}`
 g.addColorStop(0,'white');g.addColorStop(.18,hex);g.addColorStop(.5,`${hex}aa`);g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,128,128)
 const t=new THREE.CanvasTexture(c),s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})),phase=Math.random()*6;s.scale.setScalar(.8);s.onBeforeRender=()=>s.scale.setScalar(.78+Math.sin(performance.now()*.004+phase)*.13);return s
}

function cityBuilding(bank,parent,{size='small',tier=1,color=null,rot=0}={}){
 const n=size==='large'?'downtownLarge':size==='medium'?'downtownMedium':'downtownSmall',b=asset(bank,parent,n,0,0,0,rot,.23+Math.min(8,tier)*.012)
 if(color)tint(b,color);return b
}

function clientOpportunity(bank,parent,resource,x,y){
 const colors={meat:0x56e5a9,wood:0x68bfff,coal:0xffcf66,iron:0xd6a1ff},c=colors[resource]??0x9dd7cf,g=new THREE.Group(),r=hash(x,y)
 cityBuilding(bank,g,{size:r>.66?'medium':'small',tier:1+Math.floor(r*4),rot:Math.floor(r*4)*Math.PI/2});disk(g,.6,c,.18)
 const m=marker(c);m.position.set(.42,1.35,.2);g.add(m);if(r>.5)asset(bank,g,r>.72?'truckGreen':'truckGrey',-.38,.02,.42,.3,.16);parent.add(g);return g
}

function contractSite(bank,parent,level=1){
 const g=new THREE.Group(),c=level>=5?0xff876e:0xffbd63;disk(g,.67,c,.17);asset(bank,g,'scaffold',0,0,0,.2,.25);asset(bank,g,'truckGrey',-.38,.01,.3,.5,.18)
 for(const [x,z,r] of [[.42,.36,.15],[-.4,.4,-.25],[.45,-.32,.7]])asset(bank,g,'barrier',x,.01,z,r,.17)
 const m=marker(c);m.position.set(.32,1.05,.1);g.add(m);parent.add(g);return g
}

function road(parent,x,z,w,d){const curb=new THREE.Mesh(new THREE.BoxGeometry(w+.14,.045,d+.14),mat(0xb3afa2));curb.position.set(x,-.015,z);parent.add(curb);const r=new THREE.Mesh(new THREE.BoxGeometry(w,.055,d),mat(0x3c4243));r.position.set(x,.01,z);r.receiveShadow=true;parent.add(r)}
function cityRoads(parent,span){for(const i of[-9,-3,3,9]){road(parent,i*TILE,0,1.02,span);road(parent,0,i*TILE,span,1.02)}}

function streetDecor(bank,parent,span){
 for(let i=0;i<60;i++){const a=i*2.399,r=span*.25+(i%8)*1.18,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<1.2||Math.abs(z)<1.2)continue;asset(bank,parent,i%3?'downtownTreeA':'downtownTreeB',x,0,z,a,.18+(i%4)*.025)}
 const cars=[[-12,-.55,Math.PI/2,'truckGreen'],[-6,.5,-Math.PI/2,'truckGrey'],[1,-4.3,0,'truckGreen'],[8,5.1,Math.PI,'truckGrey'],[12,-9.2,Math.PI/2,'truckGreen'],[-10,10.2,0,'truckGrey']]
 cars.forEach(([x,z,r,n])=>asset(bank,parent,n,x,.04,z,r,.2))
}

function backgroundBlock(bank,parent,x,y){
 const r=hash(x,y);if(r<.28){asset(bank,parent,r<.14?'downtownTreeA':'downtownTreeB',0,0,0,r*6,.16+r*.05);return}
 const b=cityBuilding(bank,parent,{size:r>.82?'medium':'small',tier:1+Math.floor(r*4),rot:Math.floor(r*4)*Math.PI/2});b.scale.multiplyScalar(.72);b.traverse(o=>{if(o.isMesh){const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms)if(m){m.transparent=true;m.opacity=.74}}})
}

export class World3D extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.build()}
 build(){
  this.clear();this.tiles.clear();this.marchObjects.clear();const span=SIZE*TILE+8
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(span,span),mat(0x889687));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;this.add(ground)
  cityRoads(this,span);streetDecor(this.bank,this,span)
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const def=worldTile(x,y),id=key(x,y),scouted=this.state.world.scouted.includes(id),owned=this.state.world.owned.includes(id),p=toWorld(x,y),c=new THREE.Group();c.position.copy(p);c.userData.tileId=id
   const hit=new THREE.Mesh(new THREE.BoxGeometry(TILE*.88,.035,TILE*.88),mat(scouted?(owned?0x65b68d:0xa4a693):0x4e5b57,scouted?.12:.18));hit.position.y=.015;hit.userData.tileId=id;c.add(hit)
   if(owned)disk(c,.63,0x63e0ad,.13,.04)
   if(!scouted)backgroundBlock(this.bank,c,x,y)
   else if(id===BASE_TILE){const b=cityBuilding(this.bank,c,{size:'large',tier:5,rot:Math.PI/2});tint(b,0x9effdf);const m=marker(0x55e0b5);m.position.set(.45,2.05,.1);c.add(m)}
   else if(def.kind==='settlement'){const b=cityBuilding(this.bank,c,{size:(def.tier??1)>4?'large':'medium',tier:def.tier??1,rot:(x+y)%4*Math.PI/2});tint(b,FACTIONS[def.tag]?.color??0xcaa9d2);const m=marker(FACTIONS[def.tag]?.color??0xd8a8e4);m.position.set(.35,1.65,.1);c.add(m)}
   else if(def.kind==='camp'&&!this.state.world.defeated.includes(id))contractSite(this.bank,c,def.level)
   else if(def.kind==='resource')clientOpportunity(this.bank,c,def.resource,x,y)
   else backgroundBlock(this.bank,c,x,y)
   c.traverse(o=>o.userData.tileId=id);this.add(c);this.tiles.set(id,c)
  }
  this.refreshMarches()
 }
 refresh(){this.build()}
 refreshMarches(){for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear();for(const m of this.state.world.marches??[]){const obj=this.bank.clone((m.type==='attack'||m.type==='compete')?'truckGrey':'truckGreen');obj.scale.setScalar(.2);obj.position.y=.05;this.add(obj);this.marchObjects.set(m.id,obj)}this.updateMarches(Date.now())}
 updateMarches(now){
  const base=toWorld(WORLD_CENTER,WORLD_CENTER)
  for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;const [x,y]=parseTile(m.target),target=toWorld(x,y);let p=1;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning')p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));const curve=Math.sin(p*Math.PI)*.55;o.position.x=base.x+(target.x-base.x)*p+curve;o.position.z=base.z+(target.z-base.z)*p-curve;o.position.y=.05;o.rotation.y=Math.atan2(target.x-base.x,target.z-base.z)}
 }
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
