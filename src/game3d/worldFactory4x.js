import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,WORLD_CENTER,FACTIONS } from '../data/world.js'

const SIZE=21
const BLOCK=6
const LOT_STEP=1.35
const ROAD_UNIT=2
const ROAD_LINES=[-21,-15,-9,-3,3,9,15,21]
const ROAD_MIN=-21,ROAD_MAX=21
const key=(x,y)=>`${x},${y}`
const hash=(x,y,s=0)=>Math.abs(Math.sin(x*91.17+y*47.31+s*17.71)*43758.5453)%1
const material=(color,rough=.78,metal=.03)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})
const transparent=(color,opacity)=>new THREE.MeshStandardMaterial({color,roughness:.9,transparent:true,opacity,depthWrite:false})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=true;o.receiveShadow=true;return o}
const cellKey=(x,z)=>`${x},${z}`
const DIRS={N:[0,ROAD_UNIT],E:[ROAD_UNIT,0],S:[0,-ROAD_UNIT],W:[-ROAD_UNIT,0]}

function logicalCoord(i){const group=Math.floor(i/3),slot=i%3;return(group-3)*BLOCK+(slot-1)*LOT_STEP}
export function worldVisualPosition(x,y){return new THREE.Vector3(logicalCoord(x),0,logicalCoord(y))}
function disk(parent,r,color,opacity=.14,y=.015){const m=new THREE.Mesh(new THREE.CircleGeometry(r,48),transparent(color,opacity));m.rotation.x=-Math.PI/2;m.position.y=y;parent.add(m);return m}
function ring(parent,r,color,opacity=.5){const m=new THREE.Mesh(new THREE.RingGeometry(r*.78,r,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.055;parent.add(m);return m}
function labelSprite(text,color=0xffffff,small=false){
 const c=document.createElement('canvas');c.width=small?512:768;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(12,25,23,.82)';x.roundRect(10,16,c.width-20,96,24);x.fill();x.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;x.lineWidth=3;x.stroke();x.fillStyle='#fff';x.font=`800 ${small?27:31}px Inter,Arial`;x.textAlign='center';x.textBaseline='middle';x.fillText(text.toUpperCase(),c.width/2,64,c.width-54);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(small?3.7:5.2,small?.92:1.05,1);return s
}
function glow(color){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),h=`#${color.toString(16).padStart(6,'0')}`,g=x.createRadialGradient(64,64,4,64,64,60);g.addColorStop(0,'white');g.addColorStop(.16,h);g.addColorStop(.5,`${h}99`);g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));s.userData.pulse=Math.random()*6;return s}
function fitModel(view,{w=2,h=3,d=2}){view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),scale=Math.min(w/Math.max(.001,s.x),h/Math.max(.001,s.y),d/Math.max(.001,s.z));view.scale.multiplyScalar(scale);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function building(parent,bank,keyName,x,z,{w=1.05,h=1.5,d=1.0,rot=0}={}){const v=fitModel(bank?.clone?.(keyName)??new THREE.Group(),{w,h,d});v.position.set(x,0,z);v.rotation.y=rot;parent.add(v);return v}
function tree(parent,bank,x,z,s=1,i=0){const v=bank?.cloneTree?.(i,1.15*s);if(v){v.position.set(x,0,z);v.rotation.y=hash(i,3)*Math.PI*2;parent.add(v);return v}return null}
function fitCar(view,target=1.15){
 view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),longX=s.x>s.z*1.08
 const sc=target/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y
 view.userData.forwardOffset=longX?-Math.PI/2:0;return view
}
function car(parent,bank,index=0,target=1.15){const v=fitCar(bank?.cloneCar?.(index)??bank?.clone?.('carSedan')??new THREE.Group(),target);parent.add(v);return v}
function fitRoad(view,size=ROAD_UNIT){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),sc=size/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function roadTile(parent,bank,keyName,x,z,rot=0){const src=bank?.models?.[keyName]?bank.clone(keyName):bank?.clone?.('roadStraight')??new THREE.Group(),v=fitRoad(src);v.position.set(x,.02,z);v.rotation.y=rot;parent.add(v);return v}

function roadCells(){
 const cells=new Set(),add=(x,z)=>cells.add(cellKey(x,z))
 for(const line of ROAD_LINES)for(let p=ROAD_MIN;p<=ROAD_MAX+.001;p+=ROAD_UNIT){add(line,p);add(p,line)}
 return cells
}
function connections(cells,x,z){return Object.entries(DIRS).filter(([,d])=>cells.has(cellKey(x+d[0],z+d[1]))).map(([n])=>n)}
function roadSpec(c){
 const has=n=>c.includes(n),n=c.length
 if(n>=4)return['roadCrossroad',0]
 if(n===3){if(!has('S'))return['roadIntersection',0];if(!has('W'))return['roadIntersection',Math.PI/2];if(!has('N'))return['roadIntersection',Math.PI];return['roadIntersection',-Math.PI/2]}
 if(n===2){
  if(has('E')&&has('W'))return['roadStraight',0]
  if(has('N')&&has('S'))return['roadStraight',Math.PI/2]
  if(has('N')&&has('W'))return['roadBend',0]
  if(has('N')&&has('E'))return['roadBend',Math.PI/2]
  if(has('S')&&has('E'))return['roadBend',Math.PI]
  return['roadBend',-Math.PI/2]
 }
 if(n===1){if(has('E'))return['roadEnd',0];if(has('S'))return['roadEnd',Math.PI/2];if(has('W'))return['roadEnd',Math.PI];return['roadEnd',-Math.PI/2]}
 return['roadStraight',0]
}
function buildCityRoads(parent,bank){
 const cells=roadCells()
 for(const k of cells){
  const [x,z]=k.split(',').map(Number),c=connections(cells,x,z);let [asset,rot]=roadSpec(c)
  // Put real crossing pieces around the HQ block instead of painting lines on top.
  const nearHq=(Math.abs(x)===3&&Math.abs(z)<=1.01)||(Math.abs(z)===3&&Math.abs(x)<=1.01)
  if(nearHq&&c.length===2){asset='roadCrossing';rot=c.includes('N')?Math.PI/2:0}
  roadTile(parent,bank,asset,x,z,rot)
 }
}
function sidewalkTrees(parent,bank){
 let i=0
 for(let gy=-3;gy<=3;gy++)for(let gx=-3;gx<=3;gx++){
  const cx=gx*BLOCK,cz=gy*BLOCK
  const spots=[[-2.05,-2.05],[2.05,-2.05],[-2.05,2.05],[2.05,2.05]]
  for(const [ox,oz] of spots){if(hash(gx,gy,i++)<.46)tree(parent,bank,cx+ox,cz+oz,.62+hash(i,2)*.16,i)}
 }
}
function roundedLoop(min,max,r=.42){
 const p=new THREE.CurvePath(),v=(x,z)=>new THREE.Vector3(x,0,z)
 p.add(new THREE.LineCurve3(v(min+r,min),v(max-r,min)));p.add(new THREE.QuadraticBezierCurve3(v(max-r,min),v(max,min),v(max,min+r)))
 p.add(new THREE.LineCurve3(v(max,min+r),v(max,max-r)));p.add(new THREE.QuadraticBezierCurve3(v(max,max-r),v(max,max),v(max-r,max)))
 p.add(new THREE.LineCurve3(v(max-r,max),v(min+r,max)));p.add(new THREE.QuadraticBezierCurve3(v(min+r,max),v(min,max),v(min,max-r)))
 p.add(new THREE.LineCurve3(v(min,max-r),v(min,min+r)));p.add(new THREE.QuadraticBezierCurve3(v(min,min+r),v(min,min),v(min+r,min)));return p
}
function trafficNetwork(parent,bank){
 const loops=[roundedLoop(-8.72,8.72),roundedLoop(-9.28,9.28),roundedLoop(-14.72,14.72),roundedLoop(-15.28,15.28)]
 const traffic=[]
 for(let i=0;i<12;i++){const v=car(parent,bank,i,1.02+(i%3)*.08);traffic.push({view:v,curve:loops[i%loops.length],offset:i*.083,speed:.0000068+(i%4)*.00000075})}
 return traffic
}
function moveTraffic(traffic,now){for(const t of traffic??[]){const p=(t.offset+now*t.speed)%1,pos=t.curve.getPointAt(p),tan=t.curve.getTangentAt(p).normalize();t.view.position.set(pos.x,.075,pos.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)+(t.view.userData.forwardOffset??0)}}
function opportunity(parent,bank,resource,x,y,featured){
 const colors={meat:0x4bd39e,wood:0x62aee8,coal:0xf2b956,iron:0xb98be5},c=colors[resource]??0x8bcfc0
 if(!featured){if(hash(x,y)<.12)tree(parent,bank,0,0,.48,x+y);return}
 ring(parent,.56,c,.55);const pin=glow(c);pin.position.set(.22,.78,.03);pin.scale.setScalar(.78);parent.add(pin)
 if(resource==='meat'){
  building(parent,bank,'achuClient',0,0,{w:.95,h:1.05,d:.9,rot:.2});const v=car(parent,bank,x+y,.54);v.position.set(.38,.04,.34);v.rotation.y=-.35+(v.userData.forwardOffset??0)
 }else if(resource==='wood')building(parent,bank,'achuDepot',0,0,{w:1.0,h:.78,d:.9})
 else if(resource==='coal'){const board=box(.9,.58,.07,material(0x263b37,.48,.1));board.position.set(0,.52,0);parent.add(board)}
 else building(parent,bank,'achuOffice',0,0,{w:.9,h:1.15,d:.88})
}
function contract(parent,bank,level=1){const c=level>=5?0xef7767:0xf0a64d;ring(parent,.6,c,.62);building(parent,bank,'achuSmallOffice',0,0,{w:1.0,h:1.18,d:.94,rot:.2});const l=labelSprite(level>=5?'PREMIUM TENDER':'CONTRACT',c,true);l.scale.multiplyScalar(.42);l.position.set(0,1.42,0);parent.add(l)}
function rival(parent,bank,tier,color,name){building(parent,bank,'achuOffice',0,0,{w:1.05,h:1.25+Math.min(5,tier)*.14,d:.96,rot:.25});ring(parent,.64,color,.52);const l=labelSprite(name??'RIVAL',color,true);l.scale.multiplyScalar(.4);l.position.set(0,1.8,0);parent.add(l)}
function hitPlane(parent,id){const h=new THREE.Mesh(new THREE.PlaneGeometry(LOT_STEP*1.02,LOT_STEP*1.02),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));h.rotation.x=-Math.PI/2;h.position.y=.07;h.userData.tileId=id;parent.add(h)}

function blockCenter(i){return(Math.floor(i/3)-3)*BLOCK}
function approachRoad(i){const c=blockCenter(i),coord=logicalCoord(i),a=c-3,b=c+3;if(Math.abs(a)<Math.abs(b))return a;if(Math.abs(b)<Math.abs(a))return b;return coord>=c?b:a}
function marchRoute(targetId){
 const [tx,ty]=parseTile(targetId),target=worldVisualPosition(tx,ty),xRoad=approachRoad(tx),zRoad=approachRoad(ty)
 const sx=target.x>=0?3:-3,points=[new THREE.Vector3(0,0,0),new THREE.Vector3(sx,0,0),new THREE.Vector3(sx,0,zRoad),new THREE.Vector3(xRoad,0,zRoad),target]
 return points.filter((p,i,a)=>i===0||p.distanceToSquared(a[i-1])>.0001)
}
function pointOnPolyline(points,u){
 if(points.length<2)return{pos:points[0]?.clone()??new THREE.Vector3(),tan:new THREE.Vector3(0,0,1)}
 const lens=[],total=points.slice(1).reduce((sum,p,i)=>{const l=p.distanceTo(points[i]);lens.push(l);return sum+l},0),want=Math.max(0,Math.min(1,u))*Math.max(.001,total)
 let acc=0
 for(let i=0;i<lens.length;i++){if(want<=acc+lens[i]||i===lens.length-1){const t=(want-acc)/Math.max(.001,lens[i]),pos=points[i].clone().lerp(points[i+1],Math.max(0,Math.min(1,t))),tan=points[i+1].clone().sub(points[i]).normalize();return{pos,tan}}acc+=lens[i]}
 return{pos:points.at(-1).clone(),tan:new THREE.Vector3(0,0,1)}
}

export class World3D4X extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.traffic=[];this.build()}
 build(){
  this.clear();this.tiles.clear();this.marchObjects.clear();const span=47
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(span,span),material(0xa9b7ae,1));ground.rotation.x=-Math.PI/2;ground.position.y=-.09;ground.receiveShadow=true;this.add(ground)
  buildCityRoads(this,this.bank);sidewalkTrees(this,this.bank);this.traffic=trafficNetwork(this,this.bank)
  const owned=new Set(this.state.world.owned??[]),scouted=new Set(this.state.world.scouted??[])
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const def=worldTile(x,y),id=key(x,y),known=scouted.has(id),ours=owned.has(id),p=worldVisualPosition(x,y),g=new THREE.Group();g.position.copy(p);g.userData.tileId=id;hitPlane(g,id)
   const adjacentOwned=[`${x+1},${y}`,`${x-1},${y}`,`${x},${y+1}`,`${x},${y-1}`].some(n=>owned.has(n))
   if(ours){disk(g,.59,0x45c996,.12,.026);ring(g,.57,0x4ed6a0,.24)}
   if(known){
    if(id===BASE_TILE){building(g,this.bank,'achuHq',0,0,{w:1.12,h:1.8,d:1.05,rot:.15});ring(g,.72,0x52d9a6,.7);const l=labelSprite('ACHU HQ',0x52d9a6,true);l.scale.multiplyScalar(.46);l.position.set(0,2.08,0);g.add(l)}
    else if(def.kind==='settlement')rival(g,this.bank,def.tier??1,FACTIONS[def.tag]?.color??0xc397d3,FACTIONS[def.tag]?.name??'Competitor')
    else if(def.kind==='camp'&&!this.state.world.defeated.includes(id))contract(g,this.bank,def.level)
    else if(def.kind==='resource')opportunity(g,this.bank,def.resource,x,y,ours||adjacentOwned)
    else if(hash(x,y)<.28)tree(g,this.bank,0,0,.42,x*31+y)
   }else if(adjacentOwned){const q=glow(0xa5e4cd);q.material.opacity=.42;q.position.set(0,.30,0);q.scale.setScalar(.28);g.add(q)}
   g.traverse(o=>{o.userData.tileId=id});this.add(g);this.tiles.set(id,g)
  }
  this.refreshMarches();moveTraffic(this.traffic,Date.now())
 }
 refresh(){this.build()}
 refreshMarches(){
  for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear()
  for(const m of this.state.world.marches??[]){const o=car(this,this.bank,m.type==='attack'?4:1,.82);o.userData.route=marchRoute(m.target);this.marchObjects.set(m.id,o)}
  this.updateMarches(Date.now())
 }
 updateMarches(now){
  moveTraffic(this.traffic,now)
  for(const m of this.state.world.marches??[]){
   const o=this.marchObjects.get(m.id);if(!o)continue
   let p=1,returning=false
   if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)))
   else if(m.phase==='returning'){returning=true;p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)))}
   const route=o.userData.route??marchRoute(m.target),sample=pointOnPolyline(route,p),tan=returning?sample.tan.multiplyScalar(-1):sample.tan
   o.position.set(sample.pos.x,.075,sample.pos.z);o.rotation.y=Math.atan2(tan.x,tan.z)+(o.userData.forwardOffset??0)
  }
 }
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
