import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,FACTIONS } from '../data/world.js'

const SIZE=21
const LOT_STEP=.84
const key=(x,y)=>`${x},${y}`
const hash=(x,y,s=0)=>Math.abs(Math.sin(x*91.17+y*47.31+s*17.71)*43758.5453)%1
const mat=(color,rough=.82,metal=.03)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})
const transparent=(color,opacity)=>new THREE.MeshStandardMaterial({color,roughness:.88,transparent:true,opacity,depthWrite:false})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=true;o.receiveShadow=true;return o}

const MAIN=[[-24,7],[-17,8],[-10,6],[-4,3],[0,2],[7,2.8],[14,5.6],[23,6.4]]
const AVENUE=[[-5,23],[-4,16],[-3,9],[-1,4],[0,2],[1,-4],[3,-10],[6,-17],[8,-23]]
const RIVERSIDE=[[-23,-1],[-16,-.2],[-9,.4],[-3,-1.0],[4,-2.7],[11,-2.5],[18,-.2],[24,2.4]]
const SOUTH=[[-22,-16],[-15,-18],[-7,-18.5],[1,-18],[9,-16.4],[16,-13],[23,-8]]
const WEST_LINK=[[-18,12],[-16,6],[-14,1],[-12,-4],[-11,-9],[-10,-15]]
const EAST_LOOP=[[9,13],[14,15],[20,12],[21,7],[18,3.5],[13,3],[9,6],[9,13]]
const OUTER=[[-21,-13],[-15,-20],[-4,-23],[8,-22],[18,-16],[24,-7],[23,5],[18,16],[8,22],[-5,23],[-16,19],[-23,10],[-25,-1],[-21,-13]]
const ROAD_DEFS=[
 {points:MAIN,width:2.15},{points:AVENUE,width:1.75},{points:RIVERSIDE,width:1.5},{points:SOUTH,width:1.75},{points:WEST_LINK,width:1.55},{points:EAST_LOOP,width:1.5,closed:true},{points:OUTER,width:1.8,closed:true}
]
const makeCurve=(points,closed=false)=>new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)),closed,'centripetal',.28)
const ROAD_CURVES=ROAD_DEFS.map(d=>({...d,curve:makeCurve(d.points,d.closed)}))

function closestPointOnSegment(px,pz,a,b){const vx=b[0]-a[0],vz=b[1]-a[1],l=vx*vx+vz*vz||1,t=Math.max(0,Math.min(1,((px-a[0])*vx+(pz-a[1])*vz)/l));return{x:a[0]+vx*t,z:a[1]+vz*t}}
function pushAwayFromRoad(x,z,min=1.45){let px=x,pz=z;for(let pass=0;pass<3;pass++){for(const d of ROAD_DEFS){const pts=d.points;for(let i=0;i<pts.length-1;i++){const q=closestPointOnSegment(px,pz,pts[i],pts[i+1]),dx=px-q.x,dz=pz-q.z,dist=Math.hypot(dx,dz),limit=min+d.width*.23;if(dist>=limit)continue;let nx=dx, nz=dz;if(dist<.001){const sx=pts[i+1][0]-pts[i][0],sz=pts[i+1][1]-pts[i][1];nx=-sz;nz=sx}const len=Math.hypot(nx,nz)||1,move=limit-dist+.18;px+=nx/len*move;pz+=nz/len*move}}}return new THREE.Vector3(px,0,pz)}
export function worldVisualPositionV9(x,y){
 if(x===10&&y===10)return new THREE.Vector3(1.0,0,5.2)
 const gx=Math.floor(x/3)-3,gy=Math.floor(y/3)-3,sx=x%3-1,sy=y%3-1
 const cx=gx*5.05+(gy%2)*.72+Math.sin(gy*.82)*.62,cz=gy*4.85+Math.cos(gx*.9)*.68
 const ang=(gx*.17-gy*.11),ca=Math.cos(ang),sa=Math.sin(ang),ox=(sx*ca-sy*sa)*LOT_STEP,oz=(sx*sa+sy*ca)*LOT_STEP
 return pushAwayFromRoad(cx+ox,cz+oz)
}

function ribbonGeometry(c,width,y=.006,segments=150){const verts=[],idx=[];for(let i=0;i<=segments;i++){const u=i/segments,p=c.getPointAt(u),t=c.getTangentAt(u).normalize(),nx=-t.z,nz=t.x;verts.push(p.x+nx*width/2,y,p.z+nz*width/2,p.x-nx*width/2,y,p.z-nz*width/2)}for(let i=0;i<segments;i++){const q=i*2;idx.push(q,q+1,q+2,q+1,q+3,q+2)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();return g}
function ribbon(parent,c,width,color,y=.006){const m=new THREE.Mesh(ribbonGeometry(c,width,y),mat(color,.96));m.receiveShadow=true;m.castShadow=false;parent.add(m);return m}
function dashed(parent,c,count=72,y=.045){const dm=mat(0xd6dbd5,.7);for(let i=1;i<count;i+=2){const u=i/count,p=c.getPointAt(u),t=c.getTangentAt(u).normalize(),d=box(.055,.014,.42,dm);d.position.set(p.x,y,p.z);d.rotation.y=Math.atan2(t.x,t.z);d.castShadow=false;parent.add(d)}}
function fit(view,{w=2,h=2,d=2}){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),sc=Math.min(w/Math.max(.001,s.x),h/Math.max(.001,s.y),d/Math.max(.001,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function building(parent,bank,name,x,z,{w=1.05,h=1.4,d=1,rot=0}={}){const v=fit(bank?.clone?.(name)??new THREE.Group(),{w,h,d});v.position.set(x,0,z);v.rotation.y=rot;parent.add(v);return v}
function tree(parent,bank,x,z,h=1.25,i=0){const v=bank?.cloneTree?.(i,h);if(!v)return;v.position.set(x,0,z);v.rotation.y=(i*.87)%6.283;parent.add(v)}
function fitRoad(view,size=2.5){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),sc=size/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function roadAsset(parent,bank,name,x,z,rot=0,size=2.5,y=.02){const v=fitRoad(bank?.clone?.(name)??new THREE.Group(),size);v.position.set(x,y,z);v.rotation.y=rot;parent.add(v);return v}
function fitCar(view,target=1.05){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),longX=s.x>s.z*1.08,sc=target/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;view.userData.forwardOffset=longX?-Math.PI/2:0;return view}
function car(parent,bank,index=0,target=1.05){const v=fitCar(bank?.cloneCar?.(index)??bank?.clone?.('carSedan')??new THREE.Group(),target);parent.add(v);return v}
function ring(parent,r,color,opacity=.5){const m=new THREE.Mesh(new THREE.RingGeometry(r*.78,r,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.07;parent.add(m);return m}
function disk(parent,r,color,opacity=.12){const m=new THREE.Mesh(new THREE.CircleGeometry(r,40),transparent(color,opacity));m.rotation.x=-Math.PI/2;m.position.y=.035;parent.add(m)}
function labelSprite(text,color=0xffffff,scale=1){const c=document.createElement('canvas');c.width=640;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(12,26,23,.88)';x.roundRect(12,17,616,94,22);x.fill();x.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;x.lineWidth=3;x.stroke();x.fillStyle='#eef2eb';x.font='800 28px Inter,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text.toUpperCase(),320,64,570);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(4.1*scale,.82*scale,1);return s}

function riverCurve(){return makeCurve([[-27,-9],[-21,-7],[-14,-6],[-7,-7],[0,-9],[8,-8],[15,-5],[22,-4],[28,-1]])}
function buildRiver(root,bank){const c=riverCurve();ribbon(root,c,5.25,0x698173,-.075);const water=new THREE.Mesh(ribbonGeometry(c,4.35,-.055,170),new THREE.MeshStandardMaterial({color:0x4c979d,roughness:.34,metalness:.05,transparent:true,opacity:.92}));water.receiveShadow=true;root.add(water);const promenade=new THREE.CatmullRomCurve3(Array.from({length:40},(_,i)=>{const u=i/39,p=c.getPointAt(u),t=c.getTangentAt(u).normalize(),n=new THREE.Vector3(-t.z,0,t.x);return p.clone().add(n.multiplyScalar(3.2))}),false,'centripetal',.2);ribbon(root,promenade,.55,0xc6cabf,.015);for(let i=3;i<37;i+=3){const u=i/39,p=promenade.getPointAt(u),t=promenade.getTangentAt(u).normalize(),n=new THREE.Vector3(-t.z,0,t.x);tree(root,bank,p.x+n.x*.65,p.z+n.z*.65,1.05+(i%4)*.12,400+i)}
 // Pedestrian bridge by the riverside park.
 const p=c.getPointAt(.78),deck=box(.7,.14,5.3,mat(0xb9b7aa,.86));deck.position.set(p.x,.42,p.z);deck.rotation.y=-.22;root.add(deck);for(const q of[-1.6,1.6]){const pillar=box(.24,.85,.24,mat(0x68736d,.92));pillar.position.set(p.x+Math.sin(.22)*q,.0,p.z+Math.cos(.22)*q);root.add(pillar)}}
function bridge(root,bank,x,z,rot=0){for(const dz of[-2.1,0,2.1])roadAsset(root,bank,'roadBridge',x+Math.sin(rot)*dz,z+Math.cos(rot)*dz,rot,2.25,.35);roadAsset(root,bank,'roadSlantHigh',x-Math.sin(rot)*4.05,z-Math.cos(rot)*4.05,rot,2.35,.08);roadAsset(root,bank,'roadSlantHigh',x+Math.sin(rot)*4.05,z+Math.cos(rot)*4.05,rot+Math.PI,2.35,.08);for(const dz of[-1.3,1.3])if(bank?.models?.bridgePillarWide){const p=fit(bank.clone('bridgePillarWide'),{w:.72,h:1.0,d:.72});p.position.set(x+Math.sin(rot)*dz,-.02,z+Math.cos(rot)*dz);root.add(p)}}
function roadLight(root,bank,x,z,r=0){if(!bank?.models?.roadLightCurved)return;const v=fit(bank.clone('roadLightCurved'),{w:.22,h:1.55,d:.22});v.position.set(x,.02,z);v.rotation.y=r;root.add(v)}
function buildRoads(root,bank){for(const d of ROAD_CURVES){ribbon(root,d.curve,d.width+.72,0x88968e,-.005);ribbon(root,d.curve,d.width,0x394746,.012);dashed(root,d.curve,d.closed?86:64)}roadAsset(root,bank,'roadRoundabout',0,2,0,4.0,.025);roadAsset(root,bank,'roadRoundabout',15,7.2,0,3.1,.025);roadAsset(root,bank,'roadSplit',7.8,-16.5,-.7,2.6,.025);roadAsset(root,bank,'roadDrivewayDouble',12.0,5.0,.25,2.2,.025);roadAsset(root,bank,'roadDrivewaySingle',-15.2,10.0,-.45,2.1,.025);roadAsset(root,bank,'roadCrossing',-4.0,3.0,1.15,2.25,.025);bridge(root,bank,2.5,-8.2,-.18);bridge(root,bank,-11.5,-6.2,.12);for(const [x,z,r] of[[-17,7,.8],[-8,5,1.0],[4,2.5,-1.2],[11,4,-1],[18,6,-1.3],[-15,-.3,.2],[12,-2.3,-1.1],[7,-16,.4],[-10,-18,1.5]])roadLight(root,bank,x,z,r);if(bank?.models?.roadTrafficLight)for(const [x,z,r] of[[-1.5,.8,0],[1.6,.9,Math.PI],[.7,3.4,Math.PI/2],[-.6,3.5,-Math.PI/2]]){const v=fit(bank.clone('roadTrafficLight'),{w:.24,h:1.2,d:.24});v.position.set(x,.02,z);v.rotation.y=r;root.add(v)}}

function lot(parent,x,z,w,d,color=0xaabbb1,rot=0){const p=box(w,.04,d,mat(color,.99));p.position.set(x,-.025,z);p.rotation.y=rot;p.castShadow=false;parent.add(p)}
function parking(parent,bank,x,z,rot=0,count=4){const g=new THREE.Group();g.position.set(x,.02,z);g.rotation.y=rot;const p=box(4.2,.035,2.4,mat(0x454f4e,.99));p.castShadow=false;g.add(p);for(let i=-2;i<=2;i++){const l=box(.035,.012,1.9,mat(0xe0e2da,.76));l.position.set(i*.78,.03,0);l.castShadow=false;g.add(l)}for(let i=0;i<count;i++){const v=car(g,bank,i,.82+(i%2)*.05);v.position.set(-1.18+i*.78,.05,(i%2)*.1-.05);v.rotation.y=v.userData.forwardOffset??0}parent.add(g)}
function districtLabel(root,text,x,z,color){const l=labelSprite(text,color,.72);l.position.set(x,2.1,z);root.add(l)}
function buildDistricts(root,bank){
 // Central district: compact blocks around the roundabout, not a giant tile field.
 lot(root,1.5,7.0,11,9.0,0xaebbb3,.08)
 ;[[-2.4,5.1,'achuOffice',1.25,2.1,.2],[1.2,5.7,'achuStudio',1.15,1.8,-.1],[4.5,5.2,'achuOffice',1.3,2.3,.1],[-1.8,9.2,'achuSmallOffice',1.1,1.55,.15],[1.7,9.6,'achuOffice',1.25,2.15,-.08],[5.0,9.0,'achuStudio',1.15,1.7,.15]].forEach(([x,z,n,w,h,r])=>building(root,bank,n,x,z,{w,h,d:1.0,rot:r}));districtLabel(root,'CENTRAL',1.4,11.4,0x9d84c7)
 // West End follows a crescent street with small homes and trees.
 lot(root,-15.2,12.7,11.5,11.2,0xb3c7b7,-.12)
 const homes=[[-19.4,9.5,-.4],[-16.2,9.0,.1],[-12.8,9.8,.45],[-19.0,13.2,-.7],[-15.6,13.0,.2],[-12.0,13.4,.55],[-18.0,17.0,-.8],[-14.2,17.2,.3],[-10.8,16.4,.7]];homes.forEach(([x,z,r],i)=>{building(root,bank,'achuClient',x,z,{w:.92,h:1.05,d:.88,rot:r});tree(root,bank,x+(i%2?.8:-.8),z+.7,1.05,i+510)});districtLabel(root,'WEST END',-15,19.0,0xc49a6c)
 // East business park has its own roundabout, parking and larger offices.
 lot(root,15.3,8.0,12.0,10.8,0xaebdb8,.12)
 ;[[11.0,7.4],[13.0,11.3],[17.5,11.0],[19.0,7.0],[14.8,4.8]].forEach(([x,z],i)=>building(root,bank,i%2?'achuOffice':'achuSmallOffice',x,z,{w:1.15,h:1.6+i*.12,d:1.0,rot:-.8+i*.22}));parking(root,bank,17.0,8.2,-.55,4);districtLabel(root,'BUSINESS PARK',17.2,13.8,0x78a7d4)
 // Industrial south is a working yard connected to the distributor and bypass.
 lot(root,5.5,-17.2,22.0,8.0,0xa7b4ae,-.03)
 ;[[-3.0,-16.0,'achuWarehouse',1.9,1.25],[2.2,-17.0,'achuDepot',1.6,1.05],[8.0,-18.0,'achuWarehouse',2.0,1.3],[13.5,-15.5,'achuDepot',1.7,1.08]].forEach(([x,z,n,w,h],i)=>building(root,bank,n,x,z,{w,h,d:1.4,rot:i%2?.4:-.15}));parking(root,bank,9.5,-13.7,.25,4);districtLabel(root,'LOGISTICS',4.5,-21.3,0xe0a24e)
 // Riverside is mostly park and low-density frontage.
 for(let i=0;i<20;i++){const x=-18+i*1.65,z=-3.2+Math.sin(i*.55)*.85;if(Math.abs(x+11.5)<2.0||Math.abs(x-2.5)<2.0)continue;tree(root,bank,x,z,1.1+(i%4)*.12,620+i)}
 ;[[-17,-1.8],[-8,-2.8],[8,-4.0],[18,-1.6]].forEach(([x,z],i)=>building(root,bank,i%2?'achuClient':'achuSmallOffice',x,z,{w:.9,h:1.0,d:.85,rot:.1+i*.3}));districtLabel(root,'RIVERSIDE',-8.5,-4.8,0x5fb08a)
 // North neighbourhood fills the skyline without creating another road grid.
 ;[[-8,18],[-2,18],[4,18],[10,18]].forEach(([x,z],i)=>{building(root,bank,i===2?'achuStudio':'achuClient',x,z,{w:.9,h:1.1+(i===2?.35:0),d:.88,rot:(i-1)*.25});tree(root,bank,x+1.0,z-.5,1.15,710+i)})
}

function hitPlane(parent,id){const h=new THREE.Mesh(new THREE.CircleGeometry(.62,18),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));h.rotation.x=-Math.PI/2;h.position.y=.14;h.userData.tileId=id;parent.add(h)}
function tileVisual(parent,bank,d,id,known,owned){if(owned){disk(parent,.54,0x45c996,.12);ring(parent,.53,0x4ed6a0,.3)}if(!known)return;if(id===BASE_TILE){building(parent,bank,'achuHq',0,0,{w:1.15,h:1.65,d:1.02,rot:.12});ring(parent,.69,0x52d9a6,.75);const l=labelSprite('ACHU HQ',0x52d9a6,.48);l.position.set(0,1.9,0);parent.add(l);return}if(d.businessType==='framework'){building(parent,bank,'achuOffice',0,0,{w:.92,h:1.3,d:.86,rot:.22});ring(parent,.58,FACTIONS[d.tag]?.color??0xc397d3,.55);return}if(d.businessType==='tender'){building(parent,bank,'achuSmallOffice',0,0,{w:.88,h:1.05,d:.82,rot:.18});ring(parent,.55,0xf0a64d,.62);return}if(d.businessType==='lead'){building(parent,bank,'achuClient',0,0,{w:.78,h:.9,d:.76,rot:.15});ring(parent,.5,0x4bd39e,.46);return}if(hash(d.x,d.y)<.26)tree(parent,bank,0,0,.78,d.x*31+d.y)}

function nearestRoadPoint(p){let best=null,bestD=Infinity;for(const d of ROAD_CURVES){const steps=d.closed?100:80;for(let i=0;i<=steps;i++){const q=d.curve.getPointAt(i/steps),dist=q.distanceToSquared(p);if(dist<bestD){bestD=dist;best=q}}}return best?.clone()??new THREE.Vector3()}
function marchCurve(targetId){const [tx,ty]=parseTile(targetId),target=worldVisualPositionV9(tx,ty),base=worldVisualPositionV9(10,10),a=nearestRoadPoint(base),b=nearestRoadPoint(target),centre=new THREE.Vector3(0,0,2);return new THREE.CatmullRomCurve3([base,a,centre,b,target],false,'centripetal',.25)}
function trafficNetwork(root,bank){const westLoop=makeCurve([[-19,10],[-16,17],[-10,19],[-6,15],[-8,10],[-13,8],[-19,10]],true),routes=[ROAD_CURVES[6].curve,ROAD_CURVES[5].curve,westLoop],out=[];for(let i=0;i<13;i++){const v=car(root,bank,i,1.0+(i%3)*.06);out.push({view:v,curve:routes[i%routes.length],offset:(i*.083)%1,speed:.0000057+(i%4)*.0000007})}return out}
function moveTraffic(traffic,now){for(const t of traffic??[]){const u=(t.offset+now*t.speed)%1,p=t.curve.getPointAt(u),tan=t.curve.getTangentAt(u).normalize();t.view.position.set(p.x,.09,p.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)+(t.view.userData.forwardOffset??0)}}

export class WorldCityV9 extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.traffic=[];this.build()}
 build(){this.clear();this.tiles.clear();this.marchObjects.clear();const ground=new THREE.Mesh(new THREE.CircleGeometry(29,96),mat(0xb1c1b7,1));ground.scale.set(1,.86,1);ground.rotation.x=-Math.PI/2;ground.position.y=-.12;ground.receiveShadow=true;this.add(ground);buildRiver(this,this.bank);buildRoads(this,this.bank);buildDistricts(this,this.bank);this.traffic=trafficNetwork(this,this.bank);const owned=new Set(this.state.world.owned??[]),scouted=new Set(this.state.world.scouted??[]);for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const d=worldTile(x,y),id=key(x,y),p=worldVisualPositionV9(x,y),g=new THREE.Group();g.position.copy(p);g.userData.tileId=id;hitPlane(g,id);tileVisual(g,this.bank,d,id,scouted.has(id),owned.has(id));g.traverse(o=>o.userData.tileId=id);this.add(g);this.tiles.set(id,g)}this.refreshMarches();moveTraffic(this.traffic,Date.now())}
 refresh(){this.build()}
 refreshMarches(){for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear();for(const m of this.state.world.marches??[]){const o=car(this,this.bank,m.type==='attack'?4:1,.8);o.userData.route=marchCurve(m.target);this.marchObjects.set(m.id,o)}this.updateMarches(Date.now())}
 updateMarches(now){moveTraffic(this.traffic,now);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;let p=1,returning=false;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning'){returning=true;p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)))}const c=o.userData.route??marchCurve(m.target),pos=c.getPointAt(p),tan=c.getTangentAt(p).normalize().multiplyScalar(returning?-1:1);o.position.set(pos.x,.09,pos.z);o.rotation.y=Math.atan2(tan.x,tan.z)+(o.userData.forwardOffset??0)}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
