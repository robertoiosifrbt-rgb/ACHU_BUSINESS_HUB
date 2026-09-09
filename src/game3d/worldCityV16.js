import * as THREE from 'three'
import { BASE_TILE,parseTile } from '../data/world.js'

const SIZE=21,key=(x,y)=>`${x},${y}`
const mat=(color,rough=.9,metal=.02)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})
const basic=color=>new THREE.MeshBasicMaterial({color})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=true;o.receiveShadow=true;return o}
const curve=(pts,closed=false)=>new THREE.CatmullRomCurve3(pts.map(([x,z])=>new THREE.Vector3(x,0,z)),closed,'centripetal',.12)

function fit(view,{w=2,h=2,d=2}){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),sc=Math.min(w/Math.max(.001,s.x),h/Math.max(.001,s.y),d/Math.max(.001,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function building(root,bank,k,x,z,{w=1,h=1.6,d=.9,rot=0}={}){const v=fit(bank?.clone?.(k)??new THREE.Group(),{w,h,d});v.position.set(x,.035,z);v.rotation.y=rot;root.add(v);return v}
function simpleTree(root,x,z,h=1){const g=new THREE.Group(),trunk=new THREE.Mesh(new THREE.CylinderGeometry(.055,.08,.46,7),mat(0x674a37,1)),crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.31,1),mat(0x4b7a5e,1));trunk.position.y=.23;crown.scale.set(1,1.24,1);crown.position.y=.69;g.add(trunk,crown);g.scale.setScalar(h);g.position.set(x,0,z);root.add(g)}
function bench(root,x,z,r=0){const g=new THREE.Group(),seat=box(.58,.065,.2,mat(0x705b45,.92)),metal=mat(0x303937,.86,.1);seat.position.y=.23;g.add(seat);for(const xx of[-.2,.2]){const l=box(.04,.21,.04,metal);l.position.set(xx,.105,0);g.add(l)}g.position.set(x,0,z);g.rotation.y=r;root.add(g)}
function pad(root,x,z,w,d,color){const p=box(w,.028,d,mat(color,.99));p.position.set(x,-.045,z);p.castShadow=false;root.add(p)}
function prop(root,bank,k,x,z,rot=0,{w=.12,h=.64,d=.12}={}){if(!bank?.models?.[k])return;const v=fit(bank.clone(k),{w,h,d});v.position.set(x,.03,z);v.rotation.y=rot;root.add(v)}
function parking(root,bank,x,z,rot=0,count=4,logistics=false){const g=new THREE.Group();g.position.set(x,.04,z);g.rotation.y=rot;const p=box(2.15,.034,1.28,basic(0x343f3d));p.castShadow=false;g.add(p);for(let i=-2;i<=2;i++){const l=box(.022,.01,1.06,basic(0xe7e8e1));l.position.set(i*.39,.03,0);l.castShadow=false;g.add(l)}for(let i=0;i<count;i++){const k=logistics?['carVan','carDelivery','carTruck'][i%3]:i%2?'carSuv':'carSedan',v=fit(bank?.clone?.(k)??new THREE.Group(),{w:.46,h:.37,d:.64});v.position.set(-.58+i*.39,.05,0);g.add(v)}root.add(g)}
function park(root,x,z,w=2.1,d=1.5){pad(root,x,z,w,d,0x6e9079);for(const [dx,dz,h] of[[-.65,-.3,.9],[.58,-.28,1],[0,.36,.94]])simpleTree(root,x+dx,z+dz,h);bench(root,x-.5,z+.34,.08);bench(root,x+.5,z-.34,Math.PI)}

function ribbonGeometry(c,width,y=.012,segments=96){const verts=[],idx=[];for(let i=0;i<=segments;i++){const u=i/segments,p=c.getPointAt(u),t=c.getTangentAt(u).normalize(),nx=-t.z,nz=t.x;verts.push(p.x+nx*width/2,y,p.z+nz*width/2,p.x-nx*width/2,y,p.z-nz*width/2)}for(let i=0;i<segments;i++){const q=i*2;idx.push(q,q+1,q+2,q+1,q+3,q+2)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();return g}
function ribbon(root,c,width,color,y=.012,material=null){const m=new THREE.Mesh(ribbonGeometry(c,width,y),material??mat(color,.99));m.receiveShadow=true;m.castShadow=false;root.add(m);return m}
function road(root,c,width=.88,marked=true){ribbon(root,c,width+.18,0xc0c9c3,-.006);ribbon(root,c,width,0x202a29,.018,basic(0x202a29));if(!marked)return;const dm=basic(0xe8e8e1);for(let i=1;i<46;i+=2){const u=i/46,p=c.getPointAt(u),t=c.getTangentAt(u).normalize(),d=box(.032,.01,.23,dm);d.position.set(p.x,.052,p.z);d.rotation.y=Math.atan2(t.x,t.z);d.castShadow=false;root.add(d)}}
function footpath(root,c,width=.2){ribbon(root,c,width,0xd8ddd7,.034)}

const MAIN=curve([[-11,1.0],[-8.6,.8],[-6.0,.95],[-3.4,.7],[-.6,.84],[2.4,.65],[5.5,.92],[8.4,1.35],[11,1.18]])
const NORTH=curve([[-9.7,4.65],[-7.3,4.42],[-4.7,4.65],[-2.0,4.5],[.8,4.72],[3.8,4.45]])
const SOUTH=curve([[-10.2,-2.25],[-7.2,-2.5],[-4.3,-2.2],[-1.2,-2.45],[1.7,-2.18],[4.5,-2.42],[7.4,-2.28],[10.2,-2.5]])
const WEST_LOOP=curve([[-10.1,2.15],[-9.7,4.45],[-8.0,5.9],[-5.8,5.25],[-5.0,3.45],[-5.75,1.95],[-8.0,1.55],[-10.1,2.15]],true)
const BUSINESS_LOOP=curve([[3.9,2.0],[5.2,4.55],[7.2,5.65],[9.4,5.0],[10.2,3.25],[9.35,1.72],[6.9,1.5],[4.7,1.65],[3.9,2.0]],true)
const CENTRE=curve([[-1.45,-4.45],[-1.35,-2.4],[-1.2,-.45],[-1.0,.8],[-1.05,2.7],[-1.7,4.55]])
const WEST_LINK=curve([[-6.7,5.0],[-6.65,3.0],[-6.75,1.0],[-6.8,-1.0],[-6.9,-2.45],[-6.95,-4.2],[-7.0,-6.75]])
const EAST_LINK=curve([[6.55,4.7],[6.5,2.8],[6.45,1.0],[6.35,-.8],[6.3,-2.35],[6.25,-4.15],[6.2,-6.7]])
const LOGISTICS=curve([[5.0,-2.35],[6.4,-3.0],[8.2,-3.65],[10.4,-3.85]])
const TRAFFIC_ROUTES=[MAIN,NORTH,SOUTH,WEST_LOOP,BUSINESS_LOOP,CENTRE,WEST_LINK,EAST_LINK,LOGISTICS]
const ROAD_DEFS=[{c:MAIN,w:1.0},{c:NORTH,w:.82},{c:SOUTH,w:.86},{c:WEST_LOOP,w:.78},{c:BUSINESS_LOOP,w:.8},{c:CENTRE,w:.78},{c:WEST_LINK,w:.8},{c:EAST_LINK,w:.8},{c:LOGISTICS,w:.78}]

const RIVER=curve([[-11.4,-5.15],[-8.6,-5.35],[-6.0,-5.2],[-3.2,-4.95],[-.2,-5.22],[2.8,-4.98],[5.5,-5.28],[8.4,-5.08],[11.4,-5.25]])
function buildRiver(root){ribbon(root,RIVER,2.0,0x5e776d,-.075);ribbon(root,RIVER,1.45,0x4a969e,-.052,new THREE.MeshBasicMaterial({color:0x4a969e,transparent:true,opacity:.95}))}
function bridge(root,x,z){const deck=box(1.08,.13,2.25,basic(0x222c2b));deck.position.set(x,.13,z);deck.castShadow=false;root.add(deck);for(const dx of[-.55,.55]){const rail=box(.04,.18,2.25,mat(0xc6cec8,.82,.12));rail.position.set(x+dx,.25,z);rail.castShadow=false;root.add(rail)}for(const dx of[-.42,.42]){const pier=box(.12,.38,.12,mat(0x65736d,.9,.04));pier.position.set(x+dx,-.02,z);root.add(pier)}}

function buildGround(root){const outer=box(23.8,.15,15.8,mat(0x40584e,1));outer.position.y=-.19;outer.castShadow=false;root.add(outer);const inner=box(23.0,.05,15.0,mat(0x748b80,1));inner.position.y=-.09;inner.castShadow=false;root.add(inner)}
function buildRoads(root,bank){for(const {c,w} of ROAD_DEFS)road(root,c,w,!([WEST_LOOP,BUSINESS_LOOP].includes(c)));for(const [x,z,r] of[[-8.8,1.65,0],[-4.0,1.45,0],[1.7,1.35,Math.PI],[8.2,1.8,Math.PI],[-5.6,5.5,0],[5.1,5.25,Math.PI],[.15,-2.9,Math.PI/2]])prop(root,bank,'roadLightCurved',x,z,r,{w:.1,h:.66,d:.1});for(const [x,z,r] of[[-7.15,.6,0],[6.0,-1.85,Math.PI]])prop(root,bank,'roadSignStop',x,z,r,{w:.12,h:.44,d:.12});prop(root,bank,'roadTrafficLight',-1.65,1.15,0,{w:.14,h:.6,d:.14});prop(root,bank,'highwaySign',8.65,-3.35,Math.PI/2,{w:.5,h:.55,d:.12})}
function cluster(root,bank,cx,cz,items){for(const [x,z,k,w=.94,h=1.5,d=.84,r=0] of items)building(root,bank,k,cx+x,cz+z,{w,h,d,rot:r})}
function buildDistricts(root,bank){
  pad(root,-7.75,3.65,4.9,3.45,0x7d9487)
  cluster(root,bank,-7.75,3.65,[[-1.45,.82,'cityA',.92,1.34],[0,.95,'cityC',.96,1.5],[1.45,.7,'achuClient',.94,1.42],[-1.2,-.8,'cityE',.9,1.35],[.25,-.88,'achuSmallOffice',.92,1.42],[1.48,-.62,'cityG',.9,1.3]])
  park(root,-9.45,2.2,1.7,1.35)

  pad(root,-2.25,3.55,5.15,3.55,0x879a91)
  cluster(root,bank,-2.25,3.55,[[-1.6,.85,'cityD',1.02,2.15],[0,.95,'cityN',1.02,2.45],[1.55,.72,'cityS',1.0,2.08],[-1.35,-.82,'cityU',.96,1.85],[.15,-.88,'achuOffice',.98,2.0],[1.55,-.7,'cityJ',.94,1.78]])
  building(root,bank,'achuHq',-2.15,1.95,{w:1.25,h:2.18,d:1.08,rot:.03})

  pad(root,7.3,3.55,5.7,3.7,0x758c83)
  cluster(root,bank,7.25,3.55,[[-1.75,.9,'cityB',1.0,2.0],[-.05,1.0,'cityD',1.02,2.25],[1.7,.78,'cityN',1.02,2.38],[-1.55,-.88,'achuOffice',.96,1.85],[.1,-.9,'cityS',.96,2.0],[1.65,-.72,'cityU',.94,1.8]])
  parking(root,bank,9.15,2.05,.08,4,false)

  pad(root,-8.55,-.6,4.3,2.5,0x738b7c)
  cluster(root,bank,-8.55,-.6,[[-1.3,.58,'achuStudio',.9,1.34],[.1,.65,'cityC',.92,1.42],[1.35,.48,'achuClient',.9,1.34],[-.75,-.65,'cityA',.86,1.26],[.78,-.66,'cityE',.86,1.24]])
  park(root,-10.0,-1.15,1.5,1.2)

  pad(root,-3.2,-.7,4.45,2.55,0x81968b)
  cluster(root,bank,-3.2,-.7,[[-1.35,.6,'cityU',.94,1.72],[.05,.65,'cityJ',.94,1.58],[1.4,.5,'cityS',.94,1.75],[-1.0,-.65,'achuOffice',.9,1.58],[.55,-.7,'achuSmallOffice',.88,1.46]])

  pad(root,2.25,-.72,4.75,2.6,0x80948a)
  cluster(root,bank,2.25,-.72,[[-1.4,.62,'cityC',.9,1.42],[0,.68,'cityG',.92,1.48],[1.4,.5,'achuClient',.9,1.36],[-1.0,-.66,'cityA',.86,1.28],[.55,-.7,'achuStudio',.88,1.4]])
  park(root,4.05,-.55,1.45,1.25)

  pad(root,8.45,-.75,4.5,2.55,0x788e84)
  cluster(root,bank,8.45,-.75,[[-1.35,.6,'cityB',.94,1.68],[.05,.65,'achuOffice',.94,1.78],[1.38,.5,'cityD',.96,1.9],[-1.0,-.66,'cityS',.9,1.58],[.55,-.7,'cityU',.9,1.55]])

  pad(root,-8.65,-3.45,3.95,1.8,0x6f8d79)
  cluster(root,bank,-8.65,-3.45,[[-1.15,.35,'cityA',.82,1.18],[0,.42,'achuStudio',.86,1.25],[1.15,.32,'cityC',.82,1.2],[-.55,-.44,'achuClient',.8,1.15],[.65,-.44,'cityE',.8,1.15]])

  pad(root,-3.0,-3.5,4.2,1.85,0x768f7f)
  cluster(root,bank,-3.0,-3.5,[[-1.2,.38,'cityC',.84,1.24],[0,.44,'cityG',.86,1.3],[1.2,.35,'achuClient',.84,1.22],[-.58,-.46,'cityA',.8,1.14],[.7,-.46,'achuSmallOffice',.8,1.16]])
  parking(root,bank,-4.65,-3.65,.05,4,false)

  pad(root,8.25,-3.55,5.35,2.35,0x667c72)
  building(root,bank,'achuWarehouse',6.7,-3.5,{w:1.55,h:1.15,d:1.3,rot:Math.PI/2})
  building(root,bank,'achuDepot',8.6,-3.55,{w:1.45,h:1.08,d:1.22,rot:Math.PI/2})
  building(root,bank,'achuWarehouse',10.15,-3.55,{w:1.2,h:1.0,d:1.05,rot:Math.PI/2})
  parking(root,bank,8.5,-4.55,0,4,true)

  pad(root,-7.0,-6.45,3.4,1.35,0x657d72)
  building(root,bank,'achuDepot',-7.55,-6.4,{w:1.25,h:1.0,d:1.05,rot:Math.PI/2})
  building(root,bank,'achuWarehouse',-5.95,-6.45,{w:1.35,h:1.04,d:1.12,rot:Math.PI/2})
  parking(root,bank,-8.65,-6.35,Math.PI/2,3,true)

  pad(root,6.2,-6.42,4.0,1.35,0x667e73)
  building(root,bank,'achuWarehouse',5.35,-6.38,{w:1.35,h:1.04,d:1.12,rot:Math.PI/2})
  building(root,bank,'achuDepot',7.05,-6.42,{w:1.25,h:1.0,d:1.05,rot:Math.PI/2})
  parking(root,bank,8.55,-6.35,Math.PI/2,3,true)

  for(const [x,z] of[[-11,6.35],[-9.1,6.55],[-6.5,6.6],[-3.6,6.6],[1.8,6.55],[4.4,6.5],[8.2,6.4],[10.8,6.2],[-11,-4.3],[11,-4.25]])simpleTree(root,x,z,.94+(Math.abs(x+z)%2)*.05)
}
function buildFootpaths(root){footpath(root,curve([[-10.4,1.75],[-7.3,1.65],[-4.1,1.8],[-1.0,1.58],[2.2,1.66],[5.2,1.75],[10.1,1.68]]));footpath(root,curve([[-9.8,-3.1],[-6.8,-3.25],[-3.7,-3.08],[-.6,-3.28],[2.5,-3.05],[5.8,-3.32],[9.8,-3.12]]));footpath(root,curve([[-10.2,5.35],[-8,5.7],[-5.5,5.55],[-3.0,5.38],[-.6,5.5],[2.4,5.25],[5.2,5.45],[8.4,5.6]]),.18)}

function fitCar(view,target=.56){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),longX=s.x>s.z*1.08,sc=target/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);if(longX)view.rotation.y=-Math.PI/2;view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;view.userData.forwardOffset=0;return view}
function car(root,bank,k='carSedan',target=.56){const v=fitCar(bank?.clone?.(k)??new THREE.Group(),target);root.add(v);return v}
function traffic(root,bank){const items=[];for(let i=0;i<14;i++){const c=TRAFFIC_ROUTES[i%TRAFFIC_ROUTES.length],v=car(root,bank,['carSedan','carSuv','carVan','carDelivery','carSedan','carTruck'][i%6],.52+(i%3)*.018);items.push({view:v,curve:c,offset:(i*.139)%1,speed:.0000043+(i%4)*.00000038,pingpong:[1,2,5,8].includes(i%TRAFFIC_ROUTES.length)});v.position.y=.082}return items}
function moveTraffic(items,now){for(const t of items??[]){let u=(t.offset+now*t.speed)%1,dir=1;if(t.pingpong){const raw=(t.offset+now*t.speed)%2;u=raw<=1?raw:2-raw;dir=raw<=1?1:-1}const p=t.curve.getPointAt(u),tan=t.curve.getTangentAt(u).normalize().multiplyScalar(dir);t.view.position.set(p.x,.082,p.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)+(t.view.userData.forwardOffset??0)}}

function nearestInfo(c,p,samples=48){let best=null,dist=Infinity,u=0;for(let i=0;i<=samples;i++){const q=c.getPointAt(i/samples),d=q.distanceToSquared(p);if(d<dist){dist=d;best=q;u=i/samples}}return{p:best,d:Math.sqrt(dist),t:c.getTangentAt(Math.min(.999,Math.max(.001,u))).normalize()}}
function avoidInfrastructure(p){const out=p.clone();for(let pass=0;pass<4;pass++){let best=null,clearance=.9;for(const {c,w} of ROAD_DEFS){const q=nearestInfo(c,out,40),need=w*.5+.56;if(q.d<need&&(!best||q.d/need<best.ratio)){best={...q,need,ratio:q.d/need};clearance=need}}if(best){const n=new THREE.Vector3(-best.t.z,0,best.t.x),sign=Math.sign(out.clone().sub(best.p).dot(n))||1;out.addScaledVector(n,sign*(clearance-best.d+.04))}const r=nearestInfo(RIVER,out,44);if(r.d<1.25){const n=new THREE.Vector3(-r.t.z,0,r.t.x),sign=Math.sign(out.clone().sub(r.p).dot(n))||1;out.addScaledVector(n,sign*(1.31-r.d))}}out.x=THREE.MathUtils.clamp(out.x,-10.7,10.7);out.z=THREE.MathUtils.clamp(out.z,-6.55,6.55);return out}
export function worldVisualPositionV16(x,y){if(x===10&&y===10)return new THREE.Vector3(-2.15,0,2.0);const raw=new THREE.Vector3((x-10)*.92+Math.sin(y*.55)*.12,0,(y-10)*.57+Math.cos(x*.46)*.10);return avoidInfrastructure(raw)}
function hitPlane(root,id){const m=new THREE.Mesh(new THREE.PlaneGeometry(.74,.74),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.1;m.userData.tileId=id;root.add(m)}
function nearestTrafficPoint(p){let best=null,bestD=Infinity;for(const c of TRAFFIC_ROUTES){for(let i=0;i<=44;i++){const q=c.getPointAt(i/44),d=q.distanceToSquared(p);if(d<bestD){bestD=d;best=q}}}return best?.clone()??new THREE.Vector3()}
function marchCurve(targetId){const [tx,ty]=parseTile(targetId),target=worldVisualPositionV16(tx,ty),base=worldVisualPositionV16(10,10),a=nearestTrafficPoint(base),b=nearestTrafficPoint(target);return new THREE.CatmullRomCurve3([base,a,b,target],false,'centripetal',.15)}

export class WorldCityV16 extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.traffic=[];this.name='achu-world-city-v16-neighbourhoods';this.build()}
 build(){this.clear();this.tiles.clear();this.marchObjects.clear();buildGround(this);buildRiver(this);buildRoads(this,this.bank);bridge(this,-6.9,-5.2);bridge(this,6.25,-5.2);buildDistricts(this,this.bank);buildFootpaths(this);this.traffic=traffic(this,this.bank);for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const id=key(x,y),g=new THREE.Group();g.position.copy(worldVisualPositionV16(x,y));g.userData.tileId=id;hitPlane(g,id);g.traverse(o=>o.userData.tileId=id);this.add(g);this.tiles.set(id,g)}this.refreshMarches();moveTraffic(this.traffic,Date.now())}
 refresh(){this.build()}
 refreshMarches(){for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear();for(const m of this.state.world.marches??[]){const o=car(this,this.bank,m.type==='attack'?'carSuv':'carDelivery',.52);o.userData.route=marchCurve(m.target);this.marchObjects.set(m.id,o)}this.updateMarches(Date.now())}
 updateMarches(now){moveTraffic(this.traffic,now);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;let p=1,returning=false;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning'){returning=true;p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)))}const c=o.userData.route??marchCurve(m.target),pos=c.getPointAt(p),tan=c.getTangentAt(p).normalize().multiplyScalar(returning?-1:1);o.position.set(pos.x,.082,pos.z);o.rotation.y=Math.atan2(tan.x,tan.z)+(o.userData.forwardOffset??0)}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
