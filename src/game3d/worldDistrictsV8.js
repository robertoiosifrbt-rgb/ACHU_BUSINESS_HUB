import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,FACTIONS } from '../data/world.js'

const SIZE=21
const BLOCK=6
const LOT_STEP=1.35
const ROAD_UNIT=2
const key=(x,y)=>`${x},${y}`
const cellKey=(x,z)=>`${x},${z}`
const hash=(x,y,s=0)=>Math.abs(Math.sin(x*91.17+y*47.31+s*17.71)*43758.5453)%1
const mat=(color,rough=.82,metal=.03)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})
const transparent=(color,opacity)=>new THREE.MeshStandardMaterial({color,roughness:.88,transparent:true,opacity,depthWrite:false})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=true;o.receiveShadow=true;return o}
const DIRS={N:[0,ROAD_UNIT],E:[ROAD_UNIT,0],S:[0,-ROAD_UNIT],W:[-ROAD_UNIT,0]}

function logicalCoord(i){const group=Math.floor(i/3),slot=i%3;return(group-3)*BLOCK+(slot-1)*LOT_STEP}
export function worldVisualPositionV8(x,y){return new THREE.Vector3(logicalCoord(x),0,logicalCoord(y))}
function fitModel(view,{w=2,h=3,d=2}){view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),scale=Math.min(w/Math.max(.001,s.x),h/Math.max(.001,s.y),d/Math.max(.001,s.z));view.scale.multiplyScalar(scale);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function building(parent,bank,name,x,z,{w=1.05,h=1.4,d=1,rot=0}={}){const v=fitModel(bank?.clone?.(name)??new THREE.Group(),{w,h,d});v.position.set(x,0,z);v.rotation.y=rot;parent.add(v);return v}
function tree(parent,bank,x,z,s=1,i=0){const v=bank?.cloneTree?.(i,1.25*s);if(!v)return;v.position.set(x,0,z);v.rotation.y=hash(i,7)*Math.PI*2;parent.add(v)}
function fitCar(view,target=1.08){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),longX=s.x>s.z*1.08,sc=target/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;view.userData.forwardOffset=longX?Math.PI/2:Math.PI;return view}
function car(parent,bank,index=0,target=1.08){const v=fitCar(bank?.cloneCar?.(index)??bank?.clone?.('carSedan')??new THREE.Group(),target);parent.add(v);return v}
function fitRoad(view,size=ROAD_UNIT){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),sc=size/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function roadTile(parent,bank,name,x,z,rot=0,size=ROAD_UNIT,y=.02){const src=bank?.models?.[name]?bank.clone(name):bank?.clone?.('roadStraight')??new THREE.Group(),v=fitRoad(src,size);v.position.set(x,y,z);v.rotation.y=rot;parent.add(v);return v}

function addSegment(cells,a,b){let [x,z]=a,[tx,tz]=b;cells.add(cellKey(x,z));while(x!==tx||z!==tz){if(x!==tx)x+=Math.sign(tx-x)*ROAD_UNIT;else z+=Math.sign(tz-z)*ROAD_UNIT;cells.add(cellKey(x,z))}}
function addRoute(cells,points){for(let i=0;i<points.length-1;i++)addSegment(cells,points[i],points[i+1])}
function cityRoadCells(){
 const c=new Set()
 // Three primary boulevards and three avenues: readable city structure first.
 addRoute(c,[[-21,3],[21,3]])
 addRoute(c,[[-21,15],[21,15]])
 addRoute(c,[[-21,-15],[21,-15]])
 addRoute(c,[[-15,-21],[-15,21]])
 addRoute(c,[[-3,-21],[-3,21]])
 addRoute(c,[[9,-21],[9,21]])
 // Local streets serve four distinct districts without turning the map into a maze.
 addRoute(c,[[-21,9],[-15,9],[-15,15]])
 addRoute(c,[[-9,21],[-9,15],[-3,15]])
 addRoute(c,[[9,9],[15,9],[15,15],[21,15]])
 addRoute(c,[[15,3],[15,-3],[21,-3]])
 addRoute(c,[[-21,-9],[-15,-9],[-15,-15]])
 addRoute(c,[[-9,-15],[-9,-21],[-3,-21]])
 addRoute(c,[[9,-9],[15,-9],[15,-15],[21,-15]])
 addRoute(c,[[3,-15],[3,-21],[9,-21]])
 return c
}
const ROAD_CELLS=cityRoadCells()
function connections(cells,x,z){return Object.entries(DIRS).filter(([,d])=>cells.has(cellKey(x+d[0],z+d[1]))).map(([n])=>n)}
function roadSpec(c){const has=n=>c.includes(n),n=c.length;if(n>=4)return['roadCrossroad',0];if(n===3){if(!has('S'))return['roadIntersectionPath',0];if(!has('W'))return['roadIntersectionPath',Math.PI/2];if(!has('N'))return['roadIntersectionPath',Math.PI];return['roadIntersectionPath',-Math.PI/2]}if(n===2){if(has('E')&&has('W'))return['roadStraight',0];if(has('N')&&has('S'))return['roadStraight',Math.PI/2];if(has('N')&&has('W'))return['roadBendSidewalk',0];if(has('N')&&has('E'))return['roadBendSidewalk',Math.PI/2];if(has('S')&&has('E'))return['roadBendSidewalk',Math.PI];return['roadBendSidewalk',-Math.PI/2]}if(n===1){if(has('E'))return['roadEndRound',0];if(has('S'))return['roadEndRound',Math.PI/2];if(has('W'))return['roadEndRound',Math.PI];return['roadEndRound',-Math.PI/2]}return['roadStraight',0]}

function ribbonGeometry(points,width,y=0){const verts=[],idx=[];for(let i=0;i<points.length;i++){const p=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1,nx=-dz/l,nz=dx/l;verts.push(p.x+nx*width/2,y,p.z+nz*width/2,p.x-nx*width/2,y,p.z-nz*width/2)}for(let i=0;i<points.length-1;i++){const q=i*2;idx.push(q,q+1,q+2,q+1,q+3,q+2)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();return g}
function riverPoints(){const pts=[];for(let x=-25;x<=25;x+=1){const z=-7.2+1.25*Math.sin((x+4)*.15)+.45*Math.sin(x*.34);pts.push(new THREE.Vector3(x,0,z))}return pts}
function buildRiver(parent,bank){
 const pts=riverPoints(),banks=new THREE.Mesh(ribbonGeometry(pts,5.1,-.075),mat(0x6d8374,.98));banks.receiveShadow=true;parent.add(banks)
 const water=new THREE.Mesh(ribbonGeometry(pts,4.15,-.055),new THREE.MeshStandardMaterial({color:0x4a949a,roughness:.34,metalness:.06,transparent:true,opacity:.9}));water.receiveShadow=true;parent.add(water)
 // Riverside promenade follows the water instead of being another road.
 const north=pts.filter((_,i)=>i%2===0).map(p=>new THREE.Vector3(p.x,0,p.z+3.05));const walk=new THREE.Mesh(ribbonGeometry(north,.52,.006),mat(0xc9c8bb,.98));walk.receiveShadow=true;parent.add(walk)
 for(let i=2;i<north.length-2;i+=4){const p=north[i];tree(parent,bank,p.x,p.z+.65,.55+(i%3)*.08,500+i)}
 // A pedestrian bridge gives the river a third crossing without pretending it is a road.
 const px=18,pz=-7.2+1.25*Math.sin((px+4)*.15)+.45*Math.sin(px*.34),deck=box(.72,.12,5.3,mat(0xb8b6a7,.86));deck.position.set(px,.42,pz);parent.add(deck)
 for(const z of[pz-1.7,pz+1.7]){const pillar=box(.24,.8,.24,mat(0x69736e,.9));pillar.position.set(px,.02,z);parent.add(pillar)}
}
function bridgeSpec(x,z){
 if(![-15,-3,9].includes(x))return null
 if([-9,-7,-5].includes(z))return['roadBridge',Math.PI/2]
 if(z===-11)return['roadSlantHigh',Math.PI/2]
 if(z===-3)return['roadSlantHigh',-Math.PI/2]
 return null
}
function buildRoads(parent,bank){
 for(const k of ROAD_CELLS){const [x,z]=k.split(',').map(Number),special=bridgeSpec(x,z);if(special){roadTile(parent,bank,special[0],x,z,special[1]);continue}const c=connections(ROAD_CELLS,x,z);if(x===-3&&z===3){roadTile(parent,bank,'roadRoundabout',x,z,0,3.35);continue}const [asset,rot]=roadSpec(c);roadTile(parent,bank,asset,x,z,rot)}
 // Bridge piers make the elevated pieces read as actual structures.
 for(const x of[-15,-3,9])for(const z of[-8,-6]){const p=bank?.models?.bridgePillarWide?fitModel(bank.clone('bridgePillarWide'),{w:.7,h:1.05,d:.7}):null;if(p){p.position.set(x,-.02,z);parent.add(p)}}
 // Driveways, lights and signs make roads serve places instead of existing by themselves.
 ;[[-11,3,0],[5,3,Math.PI],[-15,11,Math.PI/2],[9,11,-Math.PI/2],[13,-15,0],[-19,-15,Math.PI]].forEach(([x,z,r],i)=>{roadTile(parent,bank,i%2?'roadDrivewaySingle':'roadDrivewayDouble',x,z,r);const l=bank?.models?.roadLightCurved?fitModel(bank.clone('roadLightCurved'),{w:.22,h:1.5,d:.22}):null;if(l){l.position.set(x+.55,.02,z+.55);l.rotation.y=r;parent.add(l)}})
}
function districtPad(parent,x,z,w,d,color){const p=box(w,.035,d,mat(color,.99));p.position.set(x,-.035,z);p.castShadow=false;parent.add(p)}
function districtBackdrop(parent,bank){
 // Downtown: dense, taller and close to the central roundabout.
 districtPad(parent,3,9,10.6,10.4,0xb7c0b8)
 ;[[-.4,6.3,'achuOffice',1.1,1.8],[2.2,6.4,'achuStudio',1.05,1.65],[5.8,6.4,'achuOffice',1.1,2.0],[.1,11.6,'achuSmallOffice',1.0,1.45],[3.3,11.7,'achuOffice',1.15,2.05],[6.2,11.5,'achuStudio',1.05,1.6]].forEach(([x,z,n,w,h],i)=>building(parent,bank,n,x,z,{w,h,d:1,rot:(i%2)*Math.PI/2}))
 // West End residential: smaller homes, trees and calmer streets.
 districtPad(parent,-15,12,10.5,16.6,0xb9c9bb)
 ;[[-19,5.9],[-11.2,6.1],[-19,12],[-11.2,12],[-19,18.1],[-11.2,18.2]].forEach(([x,z],i)=>{building(parent,bank,'achuClient',x,z,{w:.92,h:1.05,d:.9,rot:(i%3)*Math.PI/2});tree(parent,bank,x+(i%2?.9:-.9),z+.9,.55,620+i)})
 // East business park: offices with dedicated parking courts.
 districtPad(parent,15,9,10.4,10.4,0xb4c0bd)
 ;[[12.2,6.2],[17.8,6.2],[12.2,11.8],[17.8,11.8]].forEach(([x,z],i)=>building(parent,bank,i%2?'achuOffice':'achuSmallOffice',x,z,{w:1.1,h:1.55+i*.08,d:1,rot:Math.PI/2}))
 for(const [x,z] of[[13.7,7.8],[16.3,10.2]]){const lot=box(2.05,.035,1.7,mat(0x59625f,.98));lot.position.set(x,.005,z);parent.add(lot);for(let i=-1;i<=1;i++){const c=car(parent,bank,i+2,.68);c.position.set(x+i*.58,.05,z);c.rotation.y=Math.PI/2+(c.userData.forwardOffset??0)}}
 // South industrial/logistics district: warehouses, depot and wider service yards.
 districtPad(parent,4,-18,32,5.2,0xaeb9b2)
 ;[[-9.5,-18,'achuWarehouse',1.6,1.15],[-4.5,-18,'achuDepot',1.45,1.05],[4,-18,'achuWarehouse',1.75,1.2],[14,-18,'achuDepot',1.5,1.05]].forEach(([x,z,n,w,h],i)=>building(parent,bank,n,x,z,{w,h,d:1.35,rot:i%2?Math.PI/2:0}))
 // Riverside park occupies real land instead of another empty rectangle.
 districtPad(parent,-2,-1.4,24,6.3,0xa9c1aa)
 for(let i=0;i<18;i++){const x=-13+i*1.45,z=-1.5+(i%3-1)*1.05;if(Math.abs(x+3)<2.2)continue;tree(parent,bank,x,z,.55+(i%4)*.07,700+i)}
}
function ring(parent,r,color,opacity=.5){const m=new THREE.Mesh(new THREE.RingGeometry(r*.78,r,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.06;parent.add(m);return m}
function disk(parent,r,color,opacity=.13){const m=new THREE.Mesh(new THREE.CircleGeometry(r,40),transparent(color,opacity));m.rotation.x=-Math.PI/2;m.position.y=.025;parent.add(m)}
function labelSprite(text,color=0xffffff){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(12,25,23,.84)';x.roundRect(10,17,492,94,22);x.fill();x.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;x.lineWidth=3;x.stroke();x.fillStyle='#fff';x.font='800 26px Inter,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text.toUpperCase(),256,64,460);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(3.4,.85,1);return s}
function hitPlane(parent,id){const h=new THREE.Mesh(new THREE.PlaneGeometry(LOT_STEP*1.02,LOT_STEP*1.02),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));h.rotation.x=-Math.PI/2;h.position.y=.075;h.userData.tileId=id;parent.add(h)}
function tileVisual(parent,bank,d,id,known,owned){
 if(owned){disk(parent,.58,0x45c996,.12);ring(parent,.56,0x4ed6a0,.28)}
 if(!known)return
 if(id===BASE_TILE){building(parent,bank,'achuHq',0,0,{w:1.15,h:1.75,d:1.05,rot:.15});ring(parent,.7,0x52d9a6,.7);const l=labelSprite('ACHU HQ',0x52d9a6);l.scale.multiplyScalar(.52);l.position.set(0,2.02,0);parent.add(l);return}
 if(d.businessType==='framework'){building(parent,bank,'achuOffice',0,0,{w:1.05,h:1.5,d:.96,rot:.25});ring(parent,.64,FACTIONS[d.tag]?.color??0xc397d3,.52);return}
 if(d.businessType==='tender'){building(parent,bank,'achuSmallOffice',0,0,{w:1,h:1.15,d:.94,rot:.2});ring(parent,.6,0xf0a64d,.6);return}
 if(d.businessType==='lead'){building(parent,bank,'achuClient',0,0,{w:.9,h:1,d:.86,rot:.2});ring(parent,.54,0x4bd39e,.42);return}
 if(hash(d.x,d.y)<.28)tree(parent,bank,0,0,.42,d.x*31+d.y)
}

function routeCurve(points,closed=true){return new THREE.CatmullRomCurve3(points.map(([x,y,z])=>new THREE.Vector3(x,y,z)),closed,'centripetal',.18)}
function trafficNetwork(parent,bank){
 const north=routeCurve([[-21,.05,15],[-15,.05,15],[-3,.05,15],[9,.05,15],[21,.05,15],[9,.05,15],[-3,.05,15],[-15,.05,15]],true)
 const central=routeCurve([[-21,.05,3],[-15,.05,3],[-3,.05,3],[9,.05,3],[21,.05,3],[9,.05,3],[-3,.05,3],[-15,.05,3]],true)
 const avenue=routeCurve([[-3,.05,-21],[-3,.05,-11],[-3,1.05,-8],[-3,1.05,-6],[-3,.05,-3],[-3,.05,3],[-3,.05,15],[-3,.05,21],[-3,.05,15],[-3,.05,3],[-3,.05,-3],[-3,1.05,-6],[-3,1.05,-8],[-3,.05,-11]],true)
 const east=routeCurve([[9,.05,-21],[9,.05,-11],[9,1.05,-8],[9,1.05,-6],[9,.05,-3],[9,.05,3],[9,.05,15],[9,.05,21],[9,.05,15],[9,.05,3],[9,.05,-3],[9,1.05,-6],[9,1.05,-8],[9,.05,-11]],true)
 const routes=[north,central,avenue,east],out=[];for(let i=0;i<14;i++){const v=car(parent,bank,i,1+(i%3)*.07);out.push({view:v,curve:routes[i%routes.length],offset:i*.071,speed:.0000063+(i%5)*.00000065})}return out
}
function moveTraffic(traffic,now){for(const t of traffic??[]){const u=(t.offset+now*t.speed)%1,p=t.curve.getPointAt(u),tan=t.curve.getTangentAt(u).normalize();t.view.position.set(p.x,p.y+.08,p.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)+(t.view.userData.forwardOffset??0)}}
function approachRoad(i){const c=(Math.floor(i/3)-3)*BLOCK,coord=logicalCoord(i),a=c-3,b=c+3;if(Math.abs(a)<Math.abs(b))return a;if(Math.abs(b)<Math.abs(a))return b;return coord>=c?b:a}
function marchRoute(targetId){const [tx,ty]=parseTile(targetId),target=worldVisualPositionV8(tx,ty),xRoad=approachRoad(tx),zRoad=approachRoad(ty),sx=target.x>=0?3:-3;return[new THREE.Vector3(0,0,0),new THREE.Vector3(sx,0,3),new THREE.Vector3(xRoad,0,3),new THREE.Vector3(xRoad,0,zRoad),target]}
function pointOnPolyline(points,u){const lens=[],total=points.slice(1).reduce((sum,p,i)=>{const l=p.distanceTo(points[i]);lens.push(l);return sum+l},0),want=Math.max(0,Math.min(1,u))*Math.max(.001,total);let acc=0;for(let i=0;i<lens.length;i++){if(want<=acc+lens[i]||i===lens.length-1){const q=Math.max(0,Math.min(1,(want-acc)/Math.max(.001,lens[i]))),pos=points[i].clone().lerp(points[i+1],q),tan=points[i+1].clone().sub(points[i]).normalize();return{pos,tan}}acc+=lens[i]}return{pos:points.at(-1).clone(),tan:new THREE.Vector3(0,0,1)}}

export class World3DDistrictsV8 extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.traffic=[];this.build()}
 build(){
  this.clear();this.tiles.clear();this.marchObjects.clear();const ground=new THREE.Mesh(new THREE.PlaneGeometry(49,49),mat(0xb7c6bd,1));ground.rotation.x=-Math.PI/2;ground.position.y=-.1;ground.receiveShadow=true;this.add(ground)
  buildRiver(this,this.bank);buildRoads(this,this.bank);districtBackdrop(this,this.bank);this.traffic=trafficNetwork(this,this.bank)
  const owned=new Set(this.state.world.owned??[]),scouted=new Set(this.state.world.scouted??[])
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const d=worldTile(x,y),id=key(x,y),p=worldVisualPositionV8(x,y),g=new THREE.Group();g.position.copy(p);g.userData.tileId=id;hitPlane(g,id);tileVisual(g,this.bank,d,id,scouted.has(id),owned.has(id));g.traverse(o=>o.userData.tileId=id);this.add(g);this.tiles.set(id,g)}
  this.refreshMarches();moveTraffic(this.traffic,Date.now())
 }
 refresh(){this.build()}
 refreshMarches(){for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear();for(const m of this.state.world.marches??[]){const o=car(this,this.bank,m.type==='attack'?4:1,.82);o.userData.route=marchRoute(m.target);this.marchObjects.set(m.id,o)}this.updateMarches(Date.now())}
 updateMarches(now){moveTraffic(this.traffic,now);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;let p=1,returning=false;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning'){returning=true;p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)))}const sample=pointOnPolyline(o.userData.route??marchRoute(m.target),p),tan=returning?sample.tan.multiplyScalar(-1):sample.tan;o.position.set(sample.pos.x,.08,sample.pos.z);o.rotation.y=Math.atan2(tan.x,tan.z)+(o.userData.forwardOffset??0)}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
