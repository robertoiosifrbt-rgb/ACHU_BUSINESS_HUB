import * as THREE from 'three'
import { BASE_TILE,parseTile } from '../data/world.js'

const SIZE=21,key=(x,y)=>`${x},${y}`
const mat=(color,rough=.9,metal=.02)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})
const basic=color=>new THREE.MeshBasicMaterial({color})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=true;o.receiveShadow=true;return o}
const curve=(pts,closed=false)=>new THREE.CatmullRomCurve3(pts.map(([x,z])=>new THREE.Vector3(x,0,z)),closed,'centripetal',.11)

function fit(view,{w=2,h=2,d=2}){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),sc=Math.min(w/Math.max(.001,s.x),h/Math.max(.001,s.y),d/Math.max(.001,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function building(root,bank,k,x,z,{w=.95,h=1.5,d=.84,rot=0}={}){const v=fit(bank?.clone?.(k)??new THREE.Group(),{w,h,d});v.position.set(x,.035,z);v.rotation.y=rot;root.add(v);return v}
function simpleTree(root,x,z,h=1){const g=new THREE.Group(),trunk=new THREE.Mesh(new THREE.CylinderGeometry(.055,.08,.45,7),mat(0x6b4d38,1)),crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.31,1),mat(0x4a7b5d,1));trunk.position.y=.225;crown.scale.set(1,1.22,1);crown.position.y=.67;g.add(trunk,crown);g.scale.setScalar(h);g.position.set(x,0,z);root.add(g)}
function bench(root,x,z,r=0){const g=new THREE.Group(),seat=box(.58,.065,.2,mat(0x705a44,.92)),metal=mat(0x303937,.86,.1);seat.position.y=.23;g.add(seat);for(const xx of[-.2,.2]){const l=box(.04,.21,.04,metal);l.position.set(xx,.105,0);g.add(l)}g.position.set(x,0,z);g.rotation.y=r;root.add(g)}
function pad(root,x,z,w,d,color){const p=box(w,.028,d,mat(color,.99));p.position.set(x,-.045,z);p.castShadow=false;root.add(p)}
function prop(root,bank,k,x,z,rot=0,{w=.12,h=.65,d=.12}={}){if(!bank?.models?.[k])return;const v=fit(bank.clone(k),{w,h,d});v.position.set(x,.03,z);v.rotation.y=rot;root.add(v)}
function parking(root,bank,x,z,rot=0,count=4,logistics=false){const g=new THREE.Group();g.position.set(x,.04,z);g.rotation.y=rot;const p=box(2.05,.034,1.22,basic(0x323d3b));p.castShadow=false;g.add(p);for(let i=-2;i<=2;i++){const l=box(.022,.01,1.0,basic(0xe7e8e1));l.position.set(i*.37,.03,0);l.castShadow=false;g.add(l)}for(let i=0;i<count;i++){const k=logistics?['carVan','carDelivery','carTruck'][i%3]:i%2?'carSuv':'carSedan',v=fit(bank?.clone?.(k)??new THREE.Group(),{w:.44,h:.36,d:.62});v.position.set(-.55+i*.37,.05,0);g.add(v)}root.add(g)}
function park(root,x,z,w=2.2,d=1.6){pad(root,x,z,w,d,0x6f907a);for(const [dx,dz,h] of[[-.7,-.35,.9],[.65,-.28,1],[0,.38,.92]])simpleTree(root,x+dx,z+dz,h);bench(root,x-.55,z+.35,.1);bench(root,x+.55,z-.38,Math.PI)}

function ribbonGeometry(c,width,y=.012,segments=90){const verts=[],idx=[];for(let i=0;i<=segments;i++){const p=c.getPointAt(i/segments),t=c.getTangentAt(i/segments).normalize(),nx=-t.z,nz=t.x;verts.push(p.x+nx*width/2,y,p.z+nz*width/2,p.x-nx*width/2,y,p.z-nz*width/2)}for(let i=0;i<segments;i++){const q=i*2;idx.push(q,q+1,q+2,q+1,q+3,q+2)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();return g}
function ribbon(root,c,width,color,y=.012,material=null){const m=new THREE.Mesh(ribbonGeometry(c,width,y),material??mat(color,.99));m.receiveShadow=true;m.castShadow=false;root.add(m);return m}
function road(root,c,width=1.0,marked=true){ribbon(root,c,width+.20,0xb9c3bd,-.006);ribbon(root,c,width,0x222c2b,.018,new THREE.MeshBasicMaterial({color:0x222c2b}));if(!marked)return;const dm=basic(0xe8e8e1);for(let i=1;i<44;i+=2){const u=i/44,p=c.getPointAt(u),t=c.getTangentAt(u).normalize(),d=box(.034,.01,.25,dm);d.position.set(p.x,.052,p.z);d.rotation.y=Math.atan2(t.x,t.z);d.castShadow=false;root.add(d)}}
function footpath(root,c,width=.2){ribbon(root,c,width,0xd7ddd7,.034)}

const MAIN=curve([[-11,1.35],[-8.0,1.15],[-5.0,1.28],[-2.0,1.0],[1.0,.82],[4.0,1.0],[7.2,1.42],[11,1.18]])
const NORTH=curve([[-10.5,5.15],[-7.2,4.9],[-3.7,5.18],[-.5,4.92],[3.0,4.68],[6.5,5.02],[10.2,4.72]])
const SOUTH=curve([[-10.4,-2.55],[-7.2,-2.9],[-3.8,-2.58],[-.6,-2.82],[2.8,-2.52],[6.3,-2.9],[10.4,-2.62]])
const WEST=curve([[-7.0,-6.45],[-6.85,-5.0],[-6.65,-3.6],[-6.7,-2.75],[-6.4,-.8],[-6.45,1.18],[-6.15,3.0],[-6.1,4.98],[ -5.95,6.3]])
const CENTRE=curve([[-1.35,-6.35],[-1.25,-5.0],[-1.35,-3.55],[-1.0,-2.7],[-1.15,-.65],[-1.0,.95],[-.9,2.9],[-1.05,4.9],[-.95,6.25]])
const EAST=curve([[5.45,-6.25],[5.35,-5.0],[5.45,-3.5],[5.75,-2.75],[5.55,-.6],[5.75,1.22],[5.85,3.0],[6.1,4.95],[6.2,6.15]])
const LOGI=curve([[5.7,-2.72],[7.1,-3.35],[8.4,-4.15],[10.3,-4.55]])
const TRAFFIC_ROUTES=[MAIN,NORTH,SOUTH,WEST,CENTRE,EAST,LOGI]

const RIVER=curve([[-11.4,-5.45],[-8.4,-5.6],[-5.0,-5.42],[-1.7,-5.55],[1.7,-5.35],[5.1,-5.58],[8.2,-5.38],[11.4,-5.5]])
function buildRiver(root){ribbon(root,RIVER,2.05,0x60796f,-.075);ribbon(root,RIVER,1.48,0x4b989f,-.052,new THREE.MeshBasicMaterial({color:0x4b989f,transparent:true,opacity:.94}))}
function bridge(root,x,z){const deck=box(1.08,.12,2.2,basic(0x26302f));deck.position.set(x,.12,z);deck.castShadow=false;root.add(deck);for(const dx of[-.56,.56]){const rail=box(.045,.16,2.2,mat(0xc3cbc5,.82,.12));rail.position.set(x+dx,.25,z);rail.castShadow=false;root.add(rail)}}

function buildGround(root){const outer=box(23.4,.15,15.8,mat(0x40584e,1));outer.position.y=-.19;outer.castShadow=false;root.add(outer);const inner=box(22.6,.05,15.0,mat(0x748b80,1));inner.position.y=-.09;inner.castShadow=false;root.add(inner)}
function buildRoads(root,bank){for(const c of[MAIN,NORTH,SOUTH])road(root,c,1.0);for(const c of[WEST,CENTRE,EAST])road(root,c,.9);road(root,LOGI,.88);for(const [x,z,r] of[[-8.7,2.0,0],[-3.7,1.8,0],[2.3,1.65,Math.PI],[8.4,2.0,Math.PI],[-5.6,5.55,0],[5.55,5.5,Math.PI],[-.35,-3.35,Math.PI/2]])prop(root,bank,'roadLightCurved',x,z,r,{w:.10,h:.67,d:.10});for(const [x,z,r] of[[-6.8,1.0,0],[5.3,-2.1,Math.PI]])prop(root,bank,'roadSignStop',x,z,r,{w:.12,h:.45,d:.12});prop(root,bank,'roadTrafficLight',-1.55,1.45,0,{w:.14,h:.62,d:.14})}
function cluster(root,bank,cx,cz,items){for(const [x,z,k,w=.92,h=1.45,d=.82,r=0] of items)building(root,bank,k,cx+x,cz+z,{w,h,d,rot:r})}
function buildDistricts(root,bank){
  pad(root,-8.7,3.25,4.3,2.7,0x7d9387)
  cluster(root,bank,-8.7,3.25,[[-1.35,.65,'cityA'],[.05,.75,'cityC'],[1.45,.55,'achuClient'],[-1.1,-.65,'cityE'],[.45,-.72,'achuSmallOffice']])
  park(root,-10.0,.05,2.0,1.45)

  pad(root,-3.55,3.25,4.4,2.75,0x879a91)
  cluster(root,bank,-3.55,3.25,[[-1.45,.68,'cityD',1.0,2.0],[.05,.72,'cityN',1.0,2.25],[1.45,.55,'cityS',.98,1.95],[-1.15,-.65,'cityU',.92,1.7],[.45,-.7,'achuOffice',.94,1.82]])
  building(root,bank,'achuHq',-1.95,2.55,{w:1.22,h:2.15,d:1.05,rot:.05})

  pad(root,2.2,3.15,4.6,2.8,0x81968e)
  cluster(root,bank,2.2,3.15,[[-1.5,.7,'cityD',.98,1.9],[0,.75,'cityB',.98,2.05],[1.5,.6,'cityN',1.0,2.2],[-1.35,-.65,'achuOffice',.92,1.7],[.2,-.72,'cityS',.92,1.78],[1.55,-.58,'cityU',.9,1.68]])

  pad(root,8.65,3.15,4.25,2.75,0x758b83)
  cluster(root,bank,8.65,3.15,[[-1.4,.65,'cityB',.94,1.75],[0,.7,'cityD',.94,1.9],[1.4,.55,'cityN',.94,2.0],[-1.1,-.7,'achuOffice',.9,1.6],[.45,-.65,'cityJ',.9,1.52]])
  parking(root,bank,9.35,.1,0,4,false)

  pad(root,-8.8,-.65,4.3,2.55,0x738b7d)
  cluster(root,bank,-8.8,-.65,[[-1.35,.58,'cityA'],[.05,.62,'achuStudio'],[1.4,.5,'cityC'],[-1.0,-.6,'achuClient'],[.5,-.65,'cityE']])

  pad(root,-3.7,-.7,4.4,2.55,0x81968c)
  cluster(root,bank,-3.7,-.7,[[-1.4,.58,'cityU',.94,1.72],[.05,.62,'cityJ',.94,1.6],[1.45,.48,'cityS',.94,1.76],[-1.0,-.62,'achuOffice',.9,1.58],[.55,-.68,'achuSmallOffice',.88,1.48]])

  pad(root,2.25,-.72,4.6,2.55,0x7f948a)
  cluster(root,bank,2.25,-.72,[[-1.45,.6,'cityC'],[0,.64,'cityG'],[1.45,.5,'achuClient'],[-1.1,-.62,'cityA'],[.45,-.68,'achuStudio']])
  park(root,3.95,-.62,1.45,1.55)

  pad(root,8.55,-.72,4.35,2.55,0x788e84)
  cluster(root,bank,8.55,-.72,[[-1.45,.58,'cityB',.94,1.62],[0,.62,'achuOffice',.94,1.72],[1.45,.5,'cityD',.94,1.82],[-1.05,-.62,'cityS',.9,1.58],[.55,-.66,'cityU',.9,1.55]])

  pad(root,-9.0,-3.75,3.9,1.95,0x6f8d79)
  cluster(root,bank,-9.0,-3.75,[[-1.1,.42,'cityA',.86,1.25],[.1,.48,'cityC',.86,1.32],[1.15,.38,'achuClient',.86,1.26],[-.55,-.48,'cityE',.82,1.2],[.7,-.48,'cityG',.82,1.2]])

  pad(root,-3.7,-3.75,4.3,1.95,0x768f7f)
  cluster(root,bank,-3.7,-3.75,[[-1.2,.42,'cityA',.86,1.25],[0,.48,'achuStudio',.86,1.34],[1.2,.4,'cityC',.86,1.28],[-.6,-.48,'achuClient',.82,1.2],[.7,-.48,'cityE',.82,1.2]])

  pad(root,2.3,-3.72,4.4,1.95,0x748d7d)
  cluster(root,bank,2.3,-3.72,[[-1.25,.42,'cityC',.86,1.28],[0,.48,'cityG',.86,1.3],[1.25,.4,'achuClient',.86,1.25],[-.6,-.48,'cityA',.82,1.18],[.75,-.48,'achuSmallOffice',.82,1.2]])

  pad(root,8.7,-3.75,4.4,2.25,0x64786f)
  building(root,bank,'achuWarehouse',7.25,-3.72,{w:1.45,h:1.08,d:1.2,rot:Math.PI/2})
  building(root,bank,'achuDepot',9.05,-3.72,{w:1.35,h:1.0,d:1.12,rot:Math.PI/2})
  building(root,bank,'achuWarehouse',10.35,-3.68,{w:1.12,h:.95,d:1.0,rot:Math.PI/2})
  parking(root,bank,8.75,-5.0,0,4,true)

  for(const [x,z] of[[-11,6.3],[-9,6.6],[-6.8,6.4],[-3.8,6.55],[1.8,6.5],[4.2,6.45],[8.2,6.4],[10.8,6.2],[-11,-4.8],[11,-4.8]])simpleTree(root,x,z,1)
}
function buildFootpaths(root){footpath(root,curve([[-10.8,2.0],[-7.4,1.85],[-4.2,2.05],[-1.2,1.75],[2.1,1.85],[5.2,2.0],[10.5,1.82]]));footpath(root,curve([[-10,-3.55],[-7,-3.85],[-3.8,-3.55],[-.6,-3.75],[2.7,-3.52],[6,-3.9],[10,-3.55]]))}

function fitCar(view,target=.56){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),longX=s.x>s.z*1.08,sc=target/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);if(longX)view.rotation.y=-Math.PI/2;view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;view.userData.forwardOffset=0;return view}
function car(root,bank,k='carSedan',target=.56){const v=fitCar(bank?.clone?.(k)??new THREE.Group(),target);root.add(v);return v}
function traffic(root,bank){const items=[];for(let i=0;i<14;i++){const c=TRAFFIC_ROUTES[i%TRAFFIC_ROUTES.length],v=car(root,bank,['carSedan','carSuv','carVan','carDelivery','carSedan','carTruck'][i%6],.53+(i%3)*.018);items.push({view:v,curve:c,offset:(i*.137)%1,speed:.0000045+(i%4)*.0000004,pingpong:i%TRAFFIC_ROUTES.length===6});v.position.y=.082}return items}
function moveTraffic(items,now){for(const t of items??[]){let u=(t.offset+now*t.speed)%1,dir=1;if(t.pingpong){const raw=(t.offset+now*t.speed)%2;u=raw<=1?raw:2-raw;dir=raw<=1?1:-1}const p=t.curve.getPointAt(u),tan=t.curve.getTangentAt(u).normalize().multiplyScalar(dir);t.view.position.set(p.x,.082,p.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)+(t.view.userData.forwardOffset??0)}}

function nearestInfo(c,p,samples=44){let best=null,dist=Infinity,u=0;for(let i=0;i<=samples;i++){const q=c.getPointAt(i/samples),d=q.distanceToSquared(p);if(d<dist){dist=d;best=q;u=i/samples}}return{p:best,d:Math.sqrt(dist),t:c.getTangentAt(Math.min(.999,Math.max(.001,u))).normalize()}}
function avoidInfrastructure(p){const out=p.clone();for(let pass=0;pass<3;pass++){let best=null;for(const c of TRAFFIC_ROUTES){const q=nearestInfo(c,out);if(!best||q.d<best.d)best=q}if(best&&best.d<.72){const n=new THREE.Vector3(-best.t.z,0,best.t.x),sign=Math.sign(out.clone().sub(best.p).dot(n))||1;out.addScaledVector(n,sign*(.78-best.d))}const r=nearestInfo(RIVER,out);if(r.d<1.2){const n=new THREE.Vector3(-r.t.z,0,r.t.x),sign=Math.sign(out.clone().sub(r.p).dot(n))||1;out.addScaledVector(n,sign*(1.26-r.d))}}out.x=THREE.MathUtils.clamp(out.x,-10.6,10.6);out.z=THREE.MathUtils.clamp(out.z,-6.2,6.2);return out}
export function worldVisualPositionV16(x,y){if(x===10&&y===10)return new THREE.Vector3(-1.95,0,2.5);const raw=new THREE.Vector3((x-10)*.94+Math.sin(y*.57)*.11,0,(y-10)*.59+Math.cos(x*.43)*.10);return avoidInfrastructure(raw)}
function hitPlane(root,id){const m=new THREE.Mesh(new THREE.PlaneGeometry(.88,.88),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.1;m.userData.tileId=id;root.add(m)}
function nearestTrafficPoint(p){let best=null,bestD=Infinity;for(const c of TRAFFIC_ROUTES){for(let i=0;i<=42;i++){const q=c.getPointAt(i/42),d=q.distanceToSquared(p);if(d<bestD){bestD=d;best=q}}}return best?.clone()??new THREE.Vector3()}
function marchCurve(targetId){const [tx,ty]=parseTile(targetId),target=worldVisualPositionV16(tx,ty),base=worldVisualPositionV16(10,10),a=nearestTrafficPoint(base),b=nearestTrafficPoint(target);return new THREE.CatmullRomCurve3([base,a,b,target],false,'centripetal',.15)}

export class WorldCityV16 extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.traffic=[];this.name='achu-world-city-v16-districts';this.build()}
 build(){this.clear();this.tiles.clear();this.marchObjects.clear();buildGround(this);buildRiver(this);buildRoads(this,this.bank);bridge(this,-6.85,-5.48);bridge(this,-1.28,-5.48);bridge(this,5.4,-5.48);buildDistricts(this,this.bank);buildFootpaths(this);this.traffic=traffic(this,this.bank);for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const id=key(x,y),g=new THREE.Group();g.position.copy(worldVisualPositionV16(x,y));g.userData.tileId=id;hitPlane(g,id);g.traverse(o=>o.userData.tileId=id);this.add(g);this.tiles.set(id,g)}this.refreshMarches();moveTraffic(this.traffic,Date.now())}
 refresh(){this.build()}
 refreshMarches(){for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear();for(const m of this.state.world.marches??[]){const o=car(this,this.bank,m.type==='attack'?'carSuv':'carDelivery',.52);o.userData.route=marchCurve(m.target);this.marchObjects.set(m.id,o)}this.updateMarches(Date.now())}
 updateMarches(now){moveTraffic(this.traffic,now);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;let p=1,returning=false;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning'){returning=true;p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)))}const c=o.userData.route??marchCurve(m.target),pos=c.getPointAt(p),tan=c.getTangentAt(p).normalize().multiplyScalar(returning?-1:1);o.position.set(pos.x,.082,pos.z);o.rotation.y=Math.atan2(tan.x,tan.z)+(o.userData.forwardOffset??0)}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
