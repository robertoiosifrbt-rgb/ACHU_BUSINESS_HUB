import * as THREE from 'three'
import { BUILDINGS } from '../data/buildings.js'

const ACCENT={furnace:0x50d4a1,shelter:0x67b9e8,sawmill:0xe9aa54,huntersHut:0xe88170,coalMine:0xe6c159,storehouse:0x76aee3,infantryCamp:0x62d99b,infirmary:0x61cfc6,ironMine:0xb991e5,lancerCamp:0x5fa8e0,embassy:0xe9c06a,marksmanCamp:0xe486ad,researchCenter:0x69d5df}
const ASSET={furnace:'achuHq',shelter:'achuClient',sawmill:'achuDepot',huntersHut:'achuSmallOffice',coalMine:'achuStudio',storehouse:'achuWarehouse',infantryCamp:'achuOffice',infirmary:'achuClient',ironMine:'achuSmallOffice',lancerCamp:'achuDepot',embassy:'achuStudio',marksmanCamp:'achuSmallOffice',researchCenter:'achuOffice'}
const INDUSTRIAL=new Set(['sawmill','storehouse','lancerCamp'])
const BASE_LAYOUT={
 furnace:{p:[0,0],r:.10},
 shelter:{p:[6.0,2.2],r:-1.05},
 huntersHut:{p:[8.1,6.0],r:-1.55},
 coalMine:{p:[4.5,9.4],r:-2.55},
 marksmanCamp:{p:[-0.2,11.4],r:Math.PI},
 embassy:{p:[-4.6,9.2],r:2.55},
 researchCenter:{p:[-8.1,6.0],r:1.55},
 infirmary:{p:[-9.1,1.6],r:1.15},
 infantryCamp:{p:[-8.0,-4.2],r:.55},
 ironMine:{p:[-5.1,-8.6],r:.18},
 sawmill:{p:[.2,-9.8],r:0},
 storehouse:{p:[5.1,-9.0],r:-.15},
 lancerCamp:{p:[9.2,-5.0],r:-.65}
}

const mat=(color,rough=.82,metal=.03)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=true;o.receiveShadow=true;return o}
const curve=points=>new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal',.3)
const closedCurve=points=>new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'centripetal',.3)

function ribbonGeometry(c,width,y=.006,segments=120){
 const verts=[],idx=[]
 for(let i=0;i<=segments;i++){
  const u=i/segments,p=c.getPointAt(u),t=c.getTangentAt(u).normalize(),nx=-t.z,nz=t.x
  verts.push(p.x+nx*width/2,y,p.z+nz*width/2,p.x-nx*width/2,y,p.z-nz*width/2)
 }
 for(let i=0;i<segments;i++){const q=i*2;idx.push(q,q+1,q+2,q+1,q+3,q+2)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();return g
}
function ribbon(parent,c,width,color,y=.006){const m=new THREE.Mesh(ribbonGeometry(c,width,y),mat(color,.96));m.receiveShadow=true;m.castShadow=false;parent.add(m);return m}
function dashedLine(parent,c,y=.035){
 const dashMat=mat(0xdadfd8,.7);for(let i=1;i<43;i+=2){const u=i/43,p=c.getPointAt(u),t=c.getTangentAt(u).normalize(),d=box(.055,.015,.48,dashMat);d.position.set(p.x,y,p.z);d.rotation.y=Math.atan2(t.x,t.z);d.castShadow=false;parent.add(d)}
}
function fit(view,{w=2,h=2,d=2}){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),sc=Math.min(w/Math.max(.001,s.x),h/Math.max(.001,s.y),d/Math.max(.001,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function fitRoad(view,size=3.1){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),sc=size/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function roadAsset(parent,bank,key,x,z,rot=0,size=3.1,y=.015){const v=fitRoad(bank?.clone?.(key)??new THREE.Group(),size);v.position.set(x,y,z);v.rotation.y=rot;parent.add(v);return v}
function sign(text,color){const c=document.createElement('canvas');c.width=640;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(12,26,23,.9)';x.roundRect(12,17,616,94,22);x.fill();x.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;x.lineWidth=3;x.stroke();x.fillStyle='#eef2eb';x.font='800 29px Inter,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text.toUpperCase(),320,64,560);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(4.15,.84,1);return s}
function tag(root,id){root.userData.buildingId=id;root.traverse(o=>o.userData.buildingId=id);return root}
function tree(parent,bank,x,z,h=1.7,i=0){const v=bank?.cloneTree?.(i,h);if(!v)return;v.position.set(x,0,z);v.rotation.y=(i*.91)%6.283;parent.add(v)}
function ring(parent,r,color,opacity=.42){const m=new THREE.Mesh(new THREE.RingGeometry(r*.82,r,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.07;parent.add(m)}

function buildingView(bank,id,lvl){
 const g=new THREE.Group(),key=ASSET[id],hq=id==='furnace',industrial=INDUSTRIAL.has(id),growth=1+Math.min(12,Math.max(1,lvl))*.012
 const target=hq?{w:3.2*growth,h:3.15*growth,d:2.8*growth}:industrial?{w:2.9*growth,h:2.0*growth,d:2.45*growth}:{w:2.45*growth,h:2.35*growth,d:2.1*growth}
 const model=fit(bank?.clone?.(key)??new THREE.Group(),target);g.add(model)
 const pad=box(target.w+.42,.055,target.d+.42,mat(hq?0x4f6b5e:industrial?0x53645e:0x5c7066,.98));pad.position.y=.02;pad.castShadow=false;g.add(pad);g.add(model)
 const label=sign(hq?'ACHU HQ':BUILDINGS[id]?.name??id,ACCENT[id]??0x50d4a1);label.position.set(0,target.h+.55,0);label.scale.multiplyScalar(.86);g.add(label);ring(g,hq?1.48:1.08,ACCENT[id]??0x50d4a1,hq?.58:.28)
 return tag(g,id)
}
function plot(id,active=false){const g=new THREE.Group(),c=ACCENT[id]??0x50d4a1,pad=box(2.65,.05,2.2,mat(active?0x756544:0x53655d,.98));pad.position.y=.02;pad.castShadow=false;g.add(pad);ring(g,1.0,c,.45);const l=sign(active?'DEVELOPING':BUILDINGS[id]?.name??id,c);l.position.set(0,1.0,0);l.scale.multiplyScalar(.74);g.add(l);return tag(g,id)}
function unlocked(state,id){return id==='furnace'||(state.buildings.furnace??1)>=(BUILDINGS[id]?.unlockFurnace??1)}

function fitVehicle(view,target=1.25){
 view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),longX=s.x>s.z*1.08,sc=target/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y
 // Designersoup cars are modelled along +X. -PI/2, not +PI/2, puts the nose into +Z.
 view.userData.forwardOffset=longX?-Math.PI/2:0
 return view
}
function vehicle(parent,bank,index=0,target=1.25){const v=fitVehicle(bank?.cloneCar?.(index)??bank?.clone?.('carSedan')??new THREE.Group(),target);parent.add(v);return v}
function parking(parent,bank,x,z,rot=0,count=4){const g=new THREE.Group();g.position.set(x,.02,z);g.rotation.y=rot;const pad=box(4.1,.035,2.5,mat(0x3e4948,.99));pad.castShadow=false;g.add(pad);for(let i=-2;i<=2;i++){const line=box(.035,.012,2.05,mat(0xe1e3da,.78));line.position.set(i*.78,.03,0);line.castShadow=false;g.add(line)}for(let i=0;i<count;i++){const v=vehicle(g,bank,i,.92+(i%2)*.06);v.position.set(-1.18+i*.78,.05,(i%2)*.12-.08);v.rotation.y=(v.userData.forwardOffset??0)}parent.add(g)}
function roadLight(parent,bank,x,z,rot=0){if(!bank?.models?.roadLightCurved)return;const v=fit(bank.clone('roadLightCurved'),{w:.23,h:1.6,d:.23});v.position.set(x,.02,z);v.rotation.y=rot;parent.add(v)}

const LOOP=closedCurve([[0,-4.8],[-5.7,-4.8],[-9.5,-1.5],[-10,4.2],[-6.5,8.4],[-.5,10.2],[5.6,9.0],[9.2,5.0],[9.4,.2],[6.2,-3.8],[0,-4.8]])
const ENTRANCE=curve([[0,-14],[0,-10],[0,-6.2],[0,-4.8]])
const LOGISTICS=curve([[0,-4.8],[3.1,-6.6],[6.2,-8.3],[10.6,-8.3]])
const STAFF=curve([[-2.3,-4.8],[-4.6,-6.7],[-7.2,-8.6]])
const NORTH=curve([[-.5,10.2],[1.0,12.1],[4.8,12.4],[7.5,10.8]])

export const BASE_WALK_ROUTES=[
 curve([[-2.0,-2.2],[-4.8,-1.8],[-7.4,1.0],[-7.2,4.5]]),
 curve([[1.8,-2.1],[4.0,-1.0],[5.0,2.0],[6.0,4.7]]),
 curve([[-5.8,7.0],[-2.3,8.3],[1.4,8.6],[4.5,7.5]]),
 curve([[-6.8,-5.1],[-4.5,-6.0],[-2.0,-7.0],[.1,-7.2]]),
 curve([[2.0,-7.1],[4.5,-6.9],[7.0,-5.6],[8.0,-3.7]]),
 curve([[-1.5,2.6],[0,3.6],[2.0,3.0],[3.5,1.6]])
]

function buildRoads(root,bank){
 for(const c of[LOOP,ENTRANCE,LOGISTICS,STAFF,NORTH]){ribbon(root,c,2.25,0x81918a,-.005);ribbon(root,c,1.55,0x394746,.015);dashedLine(root,c)}
 roadAsset(root,bank,'roadRoundabout',0,-4.8,0,3.4,.02)
 roadAsset(root,bank,'roadDrivewayDouble',4.0,-8.0,.6,2.3,.025)
 roadAsset(root,bank,'roadDrivewaySingle',-5.1,-7.3,-.65,2.1,.025)
 roadAsset(root,bank,'roadCrossing',0,-1.8,Math.PI/2,2.3,.025)
 roadAsset(root,bank,'roadSplit',0,-6.1,0,2.5,.025)
 ;[[-8,1.0,.7],[-7.2,7.2,2.2],[2.0,9.8,-2.7],[8.0,5.8,-2.3],[8.8,-1.2,-1.1],[5.7,-7.6,-.2],[-2.8,-6.0,.5],[0,-11.5,0]].forEach(([x,z,r])=>roadLight(root,bank,x,z,r))
 if(bank?.models?.roadSignStreet){const s=fit(bank.clone('roadSignStreet'),{w:.35,h:.9,d:.24});s.position.set(.7,.02,-6.4);s.rotation.y=Math.PI;root.add(s)}
}
function landscaping(root,bank){
 const lawn=new THREE.Mesh(new THREE.CircleGeometry(16.2,72),mat(0x678172,1));lawn.rotation.x=-Math.PI/2;lawn.position.y=-.08;lawn.receiveShadow=true;root.add(lawn)
 const plaza=new THREE.Mesh(new THREE.CircleGeometry(3.15,48),mat(0xaebbb2,.98));plaza.rotation.x=-Math.PI/2;plaza.position.y=.005;root.add(plaza)
 for(let i=0;i<34;i++){const a=i*2.399,r=12.4+(i%5)*.72,x=Math.cos(a)*r,z=Math.sin(a)*r;if(z<-11&&Math.abs(x)<2.5)continue;tree(root,bank,x,z,1.35+(i%4)*.16,i)}
 for(const [x,z] of[[-4,2.3],[-4.8,3.8],[3.8,4.0],[4.6,5.2],[-2.5,5.4],[2.2,6.0]])tree(root,bank,x,z,1.15,90+x*10+z)
 const fountainBase=box(1.35,.18,1.35,mat(0x8b9b94,.9));fountainBase.position.set(0,.08,3.0);root.add(fountainBase);const water=new THREE.Mesh(new THREE.CylinderGeometry(.48,.6,.09,28),mat(0x58a2a5,.35));water.position.set(0,.2,3.0);root.add(water)
}
function buildBuildings(root,bank,state){
 for(const id of Object.keys(BUILDINGS)){const spec=BASE_LAYOUT[id];if(!spec)continue;const lvl=state.buildings[id]??0,active=state.construction?.id===id;let v=null;if(lvl>0||id==='furnace')v=buildingView(bank,id,Math.max(1,lvl));else if(unlocked(state,id))v=plot(id,active);if(v){v.position.set(spec.p[0],.08,spec.p[1]);v.rotation.y=spec.r;root.add(v)}}
}
function buildParking(root,bank){parking(root,bank,4.2,-5.0,-.35,4);parking(root,bank,7.1,2.1,-1.05,3);parking(root,bank,-6.7,-3.4,.4,3);parking(root,bank,5.5,-11.3,0,4)}
function buildTraffic(root,bank){const routes=[LOOP,LOOP,LOGISTICS,ENTRANCE],traffic=[];for(let i=0;i<6;i++){const v=vehicle(root,bank,i,1.06+(i%3)*.07);traffic.push({view:v,curve:routes[i%routes.length],offset:(i*.19)%1,speed:.0000065+(i%3)*.0000008,pingpong:i>=4});v.position.y=.09}return traffic}

export function buildBaseV9(bank,state){const root=new THREE.Group();root.name='achu-base-v9-real-campus';const ground=new THREE.Mesh(new THREE.CircleGeometry(20.5,80),mat(0x4f695d,1));ground.rotation.x=-Math.PI/2;ground.position.y=-.13;ground.receiveShadow=true;root.add(ground);landscaping(root,bank);buildRoads(root,bank);buildBuildings(root,bank,state);buildParking(root,bank);root.userData.traffic=buildTraffic(root,bank);return root}
export function baseBuildingPositionV9(id){const p=BASE_LAYOUT[id]?.p??[0,0];return new THREE.Vector3(p[0],0,p[1])}
export function animateBaseTrafficV9(traffic,now){for(const t of traffic??[]){let u=(t.offset+now*t.speed)%1,dir=1;if(t.pingpong){const raw=(t.offset+now*t.speed)%2;u=raw<=1?raw:2-raw;dir=raw<=1?1:-1}const p=t.curve.getPointAt(u),tan=t.curve.getTangentAt(u).normalize().multiplyScalar(dir);t.view.position.set(p.x,.09,p.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)+(t.view.userData.forwardOffset??0)}}