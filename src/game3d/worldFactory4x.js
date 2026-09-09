import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,WORLD_CENTER,FACTIONS } from '../data/world.js'

const SIZE=21,TILE=1.72
const key=(x,y)=>`${x},${y}`
const hash=(x,y,s=0)=>Math.abs(Math.sin(x*91.17+y*47.31+s*17.71)*43758.5453)%1
const toWorld=(x,y)=>new THREE.Vector3((x-WORLD_CENTER)*TILE,0,(y-WORLD_CENTER)*TILE)
const material=(color,rough=.78,metal=.03)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})
const transparent=(color,opacity)=>new THREE.MeshStandardMaterial({color,roughness:.9,transparent:true,opacity,depthWrite:false})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=true;o.receiveShadow=true;return o}
function disk(parent,r,color,opacity=.14,y=.015){const m=new THREE.Mesh(new THREE.CircleGeometry(r,48),transparent(color,opacity));m.rotation.x=-Math.PI/2;m.position.y=y;parent.add(m);return m}
function ring(parent,r,color,opacity=.5){const m=new THREE.Mesh(new THREE.RingGeometry(r*.78,r,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.055;parent.add(m);return m}
function labelSprite(text,color=0xffffff,small=false){
 const c=document.createElement('canvas');c.width=small?512:768;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(12,25,23,.82)';x.roundRect(10,16,c.width-20,96,24);x.fill();x.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;x.lineWidth=3;x.stroke();x.fillStyle='#fff';x.font=`800 ${small?27:31}px Inter,Arial`;x.textAlign='center';x.textBaseline='middle';x.fillText(text.toUpperCase(),c.width/2,64,c.width-54);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(small?3.7:5.2,small?.92:1.05,1);return s
}
function glow(color){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),h=`#${color.toString(16).padStart(6,'0')}`,g=x.createRadialGradient(64,64,4,64,64,60);g.addColorStop(0,'white');g.addColorStop(.16,h);g.addColorStop(.5,`${h}99`);g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));s.userData.pulse=Math.random()*6;return s}
function fitModel(view,{w=2,h=3,d=2}){view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),scale=Math.min(w/Math.max(.001,s.x),h/Math.max(.001,s.y),d/Math.max(.001,s.z));view.scale.multiplyScalar(scale);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function building(parent,bank,keyName,x,z,{w=2,h=3,d=2,rot=0}={}){const v=fitModel(bank?.clone?.(keyName)??new THREE.Group(),{w,h,d});v.position.set(x,0,z);v.rotation.y=rot;parent.add(v);return v}
function tree(parent,bank,x,z,s=1,i=0){const v=bank?.cloneTree?.(i,1.35*s);if(v){v.position.set(x,0,z);v.rotation.y=hash(i,3)*Math.PI*2;parent.add(v);return v}return null}
function fitCar(view,target=1.35){view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3());if(s.x>s.z*1.08){view.rotation.y=Math.PI/2;view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);s=b.getSize(new THREE.Vector3())}const sc=target/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function car(parent,bank,index=0,target=1.35){const v=fitCar(bank?.cloneCar?.(index)??bank?.clone?.('carSedan')??new THREE.Group(),target);parent.add(v);return v}
function roadStrip(parent,x,z,w,d,minor=false){const curb=box(w+(w<d?.28:0),.035,d+(d<w?.28:0),material(0x8b9790,.98));curb.position.set(x,.006,z);curb.castShadow=false;parent.add(curb);const r=box(w,.045,d,material(minor?0x3e4848:0x333d3e,.98));r.position.set(x,.035,z);r.castShadow=false;parent.add(r)}
function dash(parent,x,z,w,d){const m=box(w,.01,d,material(0xdfdfd4,.7));m.position.set(x,.064,z);m.castShadow=false;parent.add(m)}
function cityRoads(parent){
 const major=[-8.6,0,8.6],minor=[-12.9,-4.3,4.3,12.9],span=39
 for(const x of major)roadStrip(parent,x,0,1.42,span,false)
 for(const z of major)roadStrip(parent,0,z,span,1.42,false)
 for(const x of minor)roadStrip(parent,x,0,.86,span,true)
 for(const z of minor)roadStrip(parent,0,z,span,.86,true)
 for(const x of major)for(let z=-18;z<=18;z+=1.6)if(!major.some(v=>Math.abs(z-v)<1.1))dash(parent,x,z,.055,.7)
 for(const z of major)for(let x=-18;x<=18;x+=1.6)if(!major.some(v=>Math.abs(x-v)<1.1))dash(parent,x,z,.7,.055)
}
function districtLabel(parent,x,z,name,color){const l=labelSprite(name,color,true);l.scale.multiplyScalar(.72);l.position.set(x,.55,z);parent.add(l)}
function cityBackdrop(parent,bank){
 districtLabel(parent,-12,-12,'Riverside',0x5fb08a);districtLabel(parent,11,-12,'Business Park',0x78a7d4);districtLabel(parent,-12,11,'West End',0xc49a6c);districtLabel(parent,11,11,'Central',0x9d84c7)
 const clusters=[
  [-15,-15,'achuClient',1.8,2.2],[-11.2,-15,'achuOffice',1.8,3.2],[-15,-10.8,'achuSmallOffice',1.7,2],[-10.8,-10.6,'achuClient',1.7,2.4],
  [10.7,-15,'achuWarehouse',2.3,2.0],[15,-15,'achuDepot',2.2,1.9],[10.8,-10.7,'achuOffice',1.9,3.3],[15,-10.7,'achuSmallOffice',1.7,2.1],
  [-15,10.8,'achuSmallOffice',1.7,2.1],[-10.8,10.8,'achuOffice',1.8,3.5],[-15,15,'achuClient',1.8,2.4],[-10.8,15,'achuOffice',1.9,3.0],
  [10.8,10.8,'achuOffice',2.0,4.1],[15,10.8,'achuClient',1.8,2.5],[10.8,15,'achuOffice',1.9,3.4],[15,15,'achuSmallOffice',1.7,2.2]
 ]
 clusters.forEach(([x,z,k,w,h],i)=>building(parent,bank,k,x,z,{w,h,d:w*.86,rot:(i%4)*Math.PI/2}))
 for(let i=0;i<42;i++){const quadrant=i%4,qx=quadrant%2?1:-1,qz=quadrant>1?1:-1,x=qx*(4.9+hash(i,1)*12.1),z=qz*(4.9+hash(i,2)*12.1);if(Math.min(...[-12.9,-8.6,-4.3,0,4.3,8.6,12.9].map(v=>Math.abs(x-v)))<.75||Math.min(...[-12.9,-8.6,-4.3,0,4.3,8.6,12.9].map(v=>Math.abs(z-v)))<.75)continue;tree(parent,bank,x,z,.75+hash(i,4)*.35,i)}
}
function linePath(points,closed=true){const pts=points.map(([x,z])=>new THREE.Vector3(x,0,z)),p=new THREE.CurvePath();for(let i=0;i<pts.length-1;i++)p.add(new THREE.LineCurve3(pts[i],pts[i+1]));if(closed)p.add(new THREE.LineCurve3(pts[pts.length-1],pts[0]));return p}
function trafficNetwork(parent,bank){
 const loops=[
  linePath([[-8.25,-8.95],[8.25,-8.95],[8.95,-8.25],[8.95,8.25],[8.25,8.95],[-8.25,8.95],[-8.95,8.25],[-8.95,-8.25]]),
  linePath([[-12.55,-4.65],[12.55,-4.65],[13.25,-3.95],[13.25,12.55],[12.55,13.25],[-12.55,13.25],[-13.25,12.55],[-13.25,-3.95]])
 ]
 const traffic=[];for(let i=0;i<10;i++){const v=car(parent,bank,i,1.28+(i%3)*.08);traffic.push({view:v,curve:loops[i%loops.length],offset:i*.101,speed:.0000075+(i%4)*.0000009})}return traffic
}
function moveTraffic(traffic,now){for(const t of traffic??[]){const p=(t.offset+now*t.speed)%1,pos=t.curve.getPointAt(p),tan=t.curve.getTangentAt(p);t.view.position.set(pos.x,.075,pos.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)}}
function opportunity(parent,bank,resource,x,y,featured){const colors={meat:0x4bd39e,wood:0x62aee8,coal:0xf2b956,iron:0xb98be5},c=colors[resource]??0x8bcfc0;if(!featured){if(hash(x,y)<.1)tree(parent,bank,0,0,.5,x+y);return}ring(parent,.72,c,.5);const pin=glow(c);pin.position.set(.28,.95,.05);parent.add(pin);if(resource==='meat'){building(parent,bank,'achuClient',0,0,{w:1.15,h:1.2,d:1.05,rot:.2});const v=car(parent,bank,x+y,.62);v.position.set(.48,.04,.38);v.rotation.y=-.4}else if(resource==='wood')building(parent,bank,'achuDepot',0,0,{w:1.2,h:.9,d:1.0});else if(resource==='coal'){const board=box(1.15,.72,.08,material(0x263b37,.48,.1));board.position.set(0,.65,0);parent.add(board)}else building(parent,bank,'achuOffice',0,0,{w:1.05,h:1.35,d:1.0})}
function contract(parent,bank,level=1){const c=level>=5?0xef7767:0xf0a64d;ring(parent,.78,c,.58);building(parent,bank,'achuSmallOffice',0,0,{w:1.2,h:1.35,d:1.1,rot:.2});const l=labelSprite(level>=5?'PREMIUM TENDER':'CONTRACT',c,true);l.scale.multiplyScalar(.55);l.position.set(0,1.65,0);parent.add(l)}
function rival(parent,bank,tier,color,name){building(parent,bank,'achuOffice',0,0,{w:1.25,h:1.45+Math.min(5,tier)*.25,d:1.15,rot:.25});ring(parent,.84,color,.48);const l=labelSprite(name??'RIVAL',color,true);l.scale.multiplyScalar(.55);l.position.set(0,2.2,0);parent.add(l)}
function hitPlane(parent,id){const h=new THREE.Mesh(new THREE.PlaneGeometry(TILE*.94,TILE*.94),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));h.rotation.x=-Math.PI/2;h.position.y=.07;h.userData.tileId=id;parent.add(h)}

export class World3D4X extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.traffic=[];this.build()}
 build(){
  this.clear();this.tiles.clear();this.marchObjects.clear();const span=SIZE*TILE+15
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(span,span),material(0xa9b7ae,1));ground.rotation.x=-Math.PI/2;ground.position.y=-.09;ground.receiveShadow=true;this.add(ground)
  cityRoads(this);cityBackdrop(this,this.bank);this.traffic=trafficNetwork(this,this.bank)
  const owned=new Set(this.state.world.owned??[]),scouted=new Set(this.state.world.scouted??[])
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const def=worldTile(x,y),id=key(x,y),known=scouted.has(id),ours=owned.has(id),p=toWorld(x,y),g=new THREE.Group();g.position.copy(p);g.userData.tileId=id;hitPlane(g,id)
   const adjacentOwned=[`${x+1},${y}`,`${x-1},${y}`,`${x},${y+1}`,`${x},${y-1}`].some(n=>owned.has(n))
   if(ours){disk(g,.76,0x45c996,.12,.026);ring(g,.74,0x4ed6a0,.22)}
   if(known){
    if(id===BASE_TILE){building(g,this.bank,'achuHq',0,0,{w:1.55,h:2.6,d:1.45,rot:.15});ring(g,1.05,0x52d9a6,.66);const l=labelSprite('ACHU HQ',0x52d9a6,true);l.scale.multiplyScalar(.65);l.position.set(0,3.0,0);g.add(l)}
    else if(def.kind==='settlement')rival(g,this.bank,def.tier??1,FACTIONS[def.tag]?.color??0xc397d3,FACTIONS[def.tag]?.name??'Competitor')
    else if(def.kind==='camp'&&!this.state.world.defeated.includes(id))contract(g,this.bank,def.level)
    else if(def.kind==='resource')opportunity(g,this.bank,def.resource,x,y,ours||adjacentOwned)
    else if(hash(x,y)<.11)tree(g,this.bank,0,0,.48,x*31+y)
   }else if(adjacentOwned){const p=glow(0xa5e4cd);p.material.opacity=.42;p.position.set(0,.35,0);p.scale.setScalar(.32);g.add(p)}
   g.traverse(o=>{o.userData.tileId=id});this.add(g);this.tiles.set(id,g)
  }
  this.refreshMarches();moveTraffic(this.traffic,Date.now())
 }
 refresh(){this.build()}
 refreshMarches(){for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear();for(const m of this.state.world.marches??[]){const o=car(this,this.bank,m.type==='attack'?4:1,.9);this.marchObjects.set(m.id,o)}this.updateMarches(Date.now())}
 updateMarches(now){moveTraffic(this.traffic,now);const base=toWorld(WORLD_CENTER,WORLD_CENTER);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;const [x,y]=parseTile(m.target),target=toWorld(x,y);let p=1;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning')p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));const bend=Math.sin(p*Math.PI)*.55,dx=target.x-base.x,dz=target.z-base.z;o.position.set(base.x+dx*p+bend,.075,base.z+dz*p-bend);o.rotation.y=Math.atan2(dx,dz)}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
