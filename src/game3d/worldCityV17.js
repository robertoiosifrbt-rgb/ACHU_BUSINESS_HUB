import * as THREE from 'three'
import { BASE_TILE,parseTile } from '../data/world.js'

const SIZE=21,key=(x,y)=>`${x},${y}`
const mat=(color,rough=.9,metal=.02)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})
const basic=color=>new THREE.MeshBasicMaterial({color})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=true;o.receiveShadow=true;return o}

function fit(view,{w=1,h=1,d=1}){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),sc=Math.min(w/Math.max(.001,s.x),h/Math.max(.001,s.y),d/Math.max(.001,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function building(root,bank,k,x,z,{w=.9,h=1.5,d=.8,rot=0}={}){const v=fit(bank?.clone?.(k)??new THREE.Group(),{w,h,d});v.position.set(x,.045,z);v.rotation.y=rot;root.add(v);return v}
function simpleTree(root,x,z,h=1){const g=new THREE.Group(),trunk=new THREE.Mesh(new THREE.CylinderGeometry(.055,.08,.46,7),mat(0x6a4936,1)),crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.31,1),mat(0x4b7c5e,1));trunk.position.y=.23;crown.scale.set(1,1.28,1);crown.position.y=.7;g.add(trunk,crown);g.scale.setScalar(h);g.position.set(x,0,z);root.add(g)}
function bench(root,x,z,r=0){const g=new THREE.Group(),seat=box(.56,.065,.2,mat(0x6f5944,.94)),leg=mat(0x303937,.9,.08);seat.position.y=.23;g.add(seat);for(const xx of[-.2,.2]){const l=box(.04,.21,.04,leg);l.position.set(xx,.105,0);g.add(l)}g.position.set(x,0,z);g.rotation.y=r;root.add(g)}
function pad(root,x,z,w,d,color=0x7e9388){const p=box(w,.026,d,mat(color,.99));p.position.set(x,-.045,z);p.castShadow=false;root.add(p)}
function park(root,x,z,w=2.1,d=1.5){pad(root,x,z,w,d,0x6f8f79);for(const [dx,dz,h] of[[-.65,-.3,.92],[.62,-.28,1.03],[0,.38,.95]])simpleTree(root,x+dx,z+dz,h);bench(root,x-.52,z+.34,.08);bench(root,x+.5,z-.34,Math.PI+.08)}
function parking(root,bank,x,z,rot=0,count=4,logistics=false){const g=new THREE.Group();g.position.set(x,.05,z);g.rotation.y=rot;const p=box(2.0,.036,1.16,basic(0x303a39));p.castShadow=false;g.add(p);for(let i=-2;i<=2;i++){const l=box(.022,.01,.96,basic(0xe9e8e1));l.position.set(i*.36,.03,0);l.castShadow=false;g.add(l)}for(let i=0;i<count;i++){const k=logistics?['carVan','carDelivery','carTruck'][i%3]:i%2?'carSuv':'carSedan',v=fit(bank?.clone?.(k)??new THREE.Group(),{w:.43,h:.34,d:.61});v.position.set(-.54+i*.36,.055,0);g.add(v)}root.add(g)}

function streetSegment(root,a,b,width=1.0,marked=true,elev=.03){const ax=a[0],az=a[1],bx=b[0],bz=b[1],dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz),ang=Math.atan2(dx,dz),mx=(ax+bx)/2,mz=(az+bz)/2;const curb=box(width+.22,.035,len+.06,basic(0xc8cfca));curb.position.set(mx,elev-.022,mz);curb.rotation.y=ang;curb.castShadow=false;root.add(curb);const asphalt=box(width,.04,len,basic(0x202a29));asphalt.position.set(mx,elev,mz);asphalt.rotation.y=ang;asphalt.castShadow=false;root.add(asphalt);if(marked){const steps=Math.max(2,Math.floor(len/.72));for(let i=1;i<steps;i+=2){const t=i/steps,d=box(.032,.012,.26,basic(0xf0efe8));d.position.set(ax+dx*t,elev+.027,az+dz*t);d.rotation.y=ang;d.castShadow=false;root.add(d)}}return{a,b,width}}
function streetPolyline(root,pts,width=1.0,marked=true,elev=.03){const out=[];for(let i=0;i<pts.length-1;i++)out.push(streetSegment(root,pts[i],pts[i+1],width,marked,elev));return out}

const ROAD_POLYLINES=[
 {pts:[[-11.0,1.45],[-6.1,1.45],[-.15,1.45],[6.2,1.45],[11.0,1.45]],w:1.08},
 {pts:[[-10.7,-2.75],[-6.1,-2.75],[-.15,-2.75],[6.2,-2.75],[10.6,-2.75]],w:1.0},
 {pts:[[-6.1,6.2],[-6.1,1.45],[-6.1,-2.75],[-6.1,-6.1]],w:.94},
 {pts:[[-.15,6.25],[-.15,1.45],[-.15,-2.75],[-.15,-6.05]],w:1.02},
 {pts:[[6.2,6.05],[6.2,1.45],[6.2,-2.75],[6.2,-5.95]],w:.94},
 {pts:[[6.2,-2.75],[7.5,-3.35],[8.7,-4.15],[10.8,-4.55]],w:.9}
]
const TRAFFIC_CURVES=ROAD_POLYLINES.map(r=>new THREE.CatmullRomCurve3(r.pts.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal',.08))

function buildGround(root){const outer=box(23.6,.15,15.8,mat(0x40584e,1));outer.position.y=-.19;outer.castShadow=false;root.add(outer);const inner=box(22.8,.05,15.0,mat(0x748b80,1));inner.position.y=-.09;inner.castShadow=false;root.add(inner)}
function buildRoads(root){for(const r of ROAD_POLYLINES)streetPolyline(root,r.pts,r.w,true,.03)}
function buildRiver(root){const bank=box(22.4,.035,2.05,mat(0x60796f,1));bank.position.set(0,-.068,-5.45);bank.castShadow=false;root.add(bank);const water=box(22.4,.025,1.42,new THREE.MeshBasicMaterial({color:0x4b989f,transparent:true,opacity:.95}));water.position.set(0,-.048,-5.45);water.castShadow=false;root.add(water);for(const x of[-6.1,-.15,6.2])streetSegment(root,[x,-6.1],[x,-4.78],1.0,true,.13)}

function cluster(root,bank,cx,cz,items){for(const [x,z,k,w=.9,h=1.45,d=.8,r=0] of items)building(root,bank,k,cx+x,cz+z,{w,h,d,rot:r})}
function buildDistricts(root,bank){
 // West End — low-rise residential + park
 pad(root,-8.55,3.65,4.25,3.25,0x789083)
 cluster(root,bank,-8.55,3.65,[[-1.35,.8,'cityA'],[0,.88,'cityC'],[1.35,.72,'achuClient'],[-1.15,-.72,'cityE'],[.35,-.82,'achuSmallOffice']])
 park(root,-9.45,.0,2.2,1.55)
 parking(root,bank,-7.45,.05,0,4,false)

 // Central business district — visibly taller and denser
 pad(root,-3.15,3.65,4.75,3.35,0x899a92)
 cluster(root,bank,-3.15,3.65,[[-1.45,.82,'cityD',1.02,2.2,.9],[.05,.9,'cityN',1.05,2.55,.92],[1.5,.72,'cityS',1.02,2.25,.9],[-1.25,-.72,'cityU',.96,1.95,.86],[.25,-.82,'achuOffice',.98,2.05,.88]])
 building(root,bank,'achuHq',-1.15,2.8,{w:1.24,h:2.35,d:1.04,rot:.04})

 // East office park — varied medium offices, not rows of identical homes
 pad(root,3.05,3.55,5.0,3.2,0x81958c)
 cluster(root,bank,3.05,3.55,[[-1.55,.78,'cityB',1.0,1.9,.88],[0,.84,'cityJ',.98,1.85,.86],[1.55,.7,'cityD',1.0,2.08,.9],[-1.25,-.7,'achuOffice',.95,1.75,.84],[.3,-.78,'cityS',.94,1.82,.84],[1.65,-.62,'cityU',.92,1.72,.82]])
 park(root,4.65,.0,1.9,1.45)

 // East mixed-use
 pad(root,8.65,3.45,4.15,3.05,0x778d84)
 cluster(root,bank,8.65,3.45,[[-1.25,.7,'cityB',.94,1.7,.82],[.1,.8,'cityD',.96,1.9,.84],[1.35,.58,'cityN',.95,2.0,.84],[-.95,-.7,'achuOffice',.9,1.58,.78],[.5,-.72,'cityJ',.9,1.55,.78]])
 parking(root,bank,9.25,.0,0,4,false)

 // West service quarter
 pad(root,-8.5,-.62,4.25,2.65,0x738b7d)
 cluster(root,bank,-8.5,-.62,[[-1.35,.58,'achuStudio',.9,1.35,.78],[.05,.62,'cityC',.9,1.42,.8],[1.35,.5,'achuClient',.9,1.34,.8],[-1.0,-.62,'cityA',.86,1.26,.76],[.5,-.68,'cityE',.86,1.28,.76]])

 // Central retail/services
 pad(root,-3.05,-.62,4.6,2.65,0x80958b)
 cluster(root,bank,-3.05,-.62,[[-1.42,.58,'cityU',.94,1.7,.82],[.05,.62,'cityJ',.92,1.6,.8],[1.45,.5,'cityS',.94,1.74,.82],[-1.0,-.62,'achuOffice',.88,1.55,.76],[.55,-.68,'achuSmallOffice',.86,1.45,.74]])

 // Riverside / park quarter
 pad(root,2.95,-.62,4.7,2.65,0x779083)
 cluster(root,bank,2.95,-.62,[[-1.42,.58,'cityC',.9,1.4,.8],[0,.62,'cityG',.9,1.45,.8],[1.42,.5,'achuClient',.9,1.35,.78],[-.95,-.62,'cityA',.84,1.22,.74],[.6,-.66,'achuStudio',.86,1.28,.74]])
 park(root,4.75,-1.0,1.5,1.35)

 // Logistics district — only here do warehouses appear
 pad(root,8.55,-.7,4.35,2.75,0x687f74)
 building(root,bank,'achuWarehouse',7.45,-.55,{w:1.55,h:1.02,d:1.25,rot:Math.PI/2})
 building(root,bank,'achuDepot',9.35,-.55,{w:1.35,h:1.0,d:1.15,rot:Math.PI/2})
 building(root,bank,'achuWarehouse',10.55,-.95,{w:1.15,h:.92,d:1.05,rot:Math.PI/2})
 parking(root,bank,8.9,-4.05,0,4,true)

 // South riverfront: deliberately sparse, landscaped, not another housing grid
 for(const [x,z] of[[-10.4,-4.45],[-8.8,-4.35],[-4.8,-4.4],[-3.25,-4.25],[2.0,-4.35],[3.6,-4.3]])simpleTree(root,x,z,.9)
 bench(root,-9.6,-4.25,.05);bench(root,-3.9,-4.15,-.05);bench(root,2.8,-4.2,.03)

 for(const [x,z] of[[-10.9,6.35],[-8.7,6.55],[-4.4,6.5],[1.6,6.45],[4.2,6.4],[8.4,6.35],[10.7,6.15]])simpleTree(root,x,z,1)
}

function fitCar(view,target=.55){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),longX=s.x>s.z*1.08,sc=target/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);if(longX)view.rotation.y=-Math.PI/2;view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;view.userData.forwardOffset=0;return view}
function car(root,bank,k='carSedan',target=.55){const v=fitCar(bank?.clone?.(k)??new THREE.Group(),target);root.add(v);return v}
function traffic(root,bank){const items=[];for(let i=0;i<12;i++){const c=TRAFFIC_CURVES[i%TRAFFIC_CURVES.length],v=car(root,bank,['carSedan','carSuv','carVan','carDelivery','carSedan','carTruck'][i%6],.52+(i%3)*.018);items.push({view:v,curve:c,offset:(i*.143)%1,speed:.0000043+(i%4)*.00000038,pingpong:i%TRAFFIC_CURVES.length===5});v.position.y=.09}return items}
function moveTraffic(items,now){for(const t of items??[]){let u=(t.offset+now*t.speed)%1,dir=1;if(t.pingpong){const raw=(t.offset+now*t.speed)%2;u=raw<=1?raw:2-raw;dir=raw<=1?1:-1}const p=t.curve.getPointAt(u),tan=t.curve.getTangentAt(u).normalize().multiplyScalar(dir);t.view.position.set(p.x,.09,p.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)+(t.view.userData.forwardOffset??0)}}

const LOT_X=[-8.55,-3.1,3.0,8.55],LOT_Z=[4.25,2.65,-.55,-3.95]
export function worldVisualPositionV17(x,y){if(x===10&&y===10)return new THREE.Vector3(-1.15,0,2.8);const col=Math.min(3,Math.floor(x/5.25)),row=Math.min(3,Math.floor(y/5.25)),jx=((x%5)-2)*.24,jz=((y%5)-2)*.18;return new THREE.Vector3(LOT_X[col]+jx,0,LOT_Z[row]+jz)}
function hitPlane(root,id){const m=new THREE.Mesh(new THREE.PlaneGeometry(.82,.82),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.1;m.userData.tileId=id;root.add(m)}
function nearestTrafficPoint(p){let best=null,bestD=Infinity;for(const c of TRAFFIC_CURVES){for(let i=0;i<=40;i++){const q=c.getPointAt(i/40),d=q.distanceToSquared(p);if(d<bestD){bestD=d;best=q}}}return best?.clone()??new THREE.Vector3()}
function marchCurve(targetId){const [tx,ty]=parseTile(targetId),target=worldVisualPositionV17(tx,ty),base=worldVisualPositionV17(10,10),a=nearestTrafficPoint(base),b=nearestTrafficPoint(target);return new THREE.CatmullRomCurve3([base,a,b,target],false,'centripetal',.12)}

export class WorldCityV17 extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.traffic=[];this.name='achu-world-city-v17-solid-streets';this.build()}
 build(){this.clear();this.tiles.clear();this.marchObjects.clear();buildGround(this);buildRiver(this);buildRoads(this);buildDistricts(this,this.bank);this.traffic=traffic(this,this.bank);for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const id=key(x,y),g=new THREE.Group();g.position.copy(worldVisualPositionV17(x,y));g.userData.tileId=id;hitPlane(g,id);g.traverse(o=>o.userData.tileId=id);this.add(g);this.tiles.set(id,g)}this.refreshMarches();moveTraffic(this.traffic,Date.now())}
 refresh(){this.build()}
 refreshMarches(){for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear();for(const m of this.state.world.marches??[]){const o=car(this,this.bank,m.type==='attack'?'carSuv':'carDelivery',.52);o.userData.route=marchCurve(m.target);this.marchObjects.set(m.id,o)}this.updateMarches(Date.now())}
 updateMarches(now){moveTraffic(this.traffic,now);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;let p=1,returning=false;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning'){returning=true;p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)))}const c=o.userData.route??marchCurve(m.target),pos=c.getPointAt(p),tan=c.getTangentAt(p).normalize().multiplyScalar(returning?-1:1);o.position.set(pos.x,.09,pos.z);o.rotation.y=Math.atan2(tan.x,tan.z)+(o.userData.forwardOffset??0)}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
