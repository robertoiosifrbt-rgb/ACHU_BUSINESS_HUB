import * as THREE from 'three'

const ROAD_LINES=[-12.8,-6.4,0,6.4,12.8]
const ROAD_SPAN=28.4
const ROAD_W=1.72
const CURB_W=2.12
const mat=(color,roughness=.82,metalness=.02)=>new THREE.MeshStandardMaterial({color,roughness,metalness})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.receiveShadow=true;o.castShadow=true;return o}

function fitVehicle(view,targetLength=1.45){
 view.updateMatrixWorld(true)
 let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3())
 if(s.x>s.z*1.08){view.rotation.y=Math.PI/2;view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);s=b.getSize(new THREE.Vector3())}
 const scale=targetLength/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(scale);view.updateMatrixWorld(true)
 b=new THREE.Box3().setFromObject(view);const cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2
 view.position.x-=cx;view.position.z-=cz;view.position.y-=b.min.y;view.userData.forwardOffset=0
 return view
}
function vehicle(parent,bank,index=0,targetLength=1.45){const view=fitVehicle(bank?.cloneCar?.(index)??bank?.clone?.('carSedan')??new THREE.Group(),targetLength);parent.add(view);return view}
function curbAndRoad(parent,x,z,w,d){
 const curb=box(w+(w<d?CURB_W-ROAD_W:0),.045,d+(d<w?CURB_W-ROAD_W:0),mat(0x8d9992,.98));curb.position.set(x,.012,z);curb.castShadow=false;parent.add(curb)
 const asphalt=box(w,.055,d,mat(0x313b3d,.98));asphalt.position.set(x,.045,z);asphalt.castShadow=false;parent.add(asphalt)
}
function dash(parent,x,z,w,d){const m=box(w,.012,d,mat(0xe7e6d9,.72));m.position.set(x,.078,z);m.castShadow=false;parent.add(m)}
function addRoadMarkings(parent){
 for(const line of ROAD_LINES){
  for(let p=-13.2;p<=13.2;p+=1.45){
   if(ROAD_LINES.some(v=>Math.abs(p-v)<1.25))continue
   dash(parent,line,p,.075,.72);dash(parent,p,line,.72,.075)
  }
 }
 for(let i=-3;i<=3;i++){
  const o=i*.19;dash(parent,o,-1.15,.1,.66);dash(parent,o,1.15,.1,.66)
  dash(parent,-1.15,o,.66,.1);dash(parent,1.15,o,.66,.1)
 }
}
function buildRoadNetwork(parent){
 for(const x of ROAD_LINES)curbAndRoad(parent,x,0,ROAD_W,ROAD_SPAN)
 for(const z of ROAD_LINES)curbAndRoad(parent,0,z,ROAD_SPAN,ROAD_W)
 addRoadMarkings(parent)
}
function curbLight(parent,bank,x,z,rot=0){
 const v=bank?.models?.roadLight?bank.clone('roadLight'):null
 if(!v)return
 v.scale.setScalar(2.15);v.position.set(x,.06,z);v.rotation.y=rot;parent.add(v)
}
function centralSignals(parent,bank){
 if(!bank?.models?.roadTrafficLight)return
 const positions=[[-1.18,-1.18,0],[1.18,-1.18,Math.PI/2],[1.18,1.18,Math.PI],[-1.18,1.18,-Math.PI/2]]
 for(const [x,z,r] of positions){const v=bank.clone('roadTrafficLight');v.scale.setScalar(2.25);v.position.set(x,.06,z);v.rotation.y=r;parent.add(v)}
}
function parking(parent,bank,x,z,rot=0){
 const g=new THREE.Group();g.position.set(x,.08,z);g.rotation.y=rot
 const pad=box(2.88,.035,2.82,mat(0x3b4545,.98));pad.position.y=.015;pad.castShadow=false;g.add(pad)
 for(let i=-1;i<=2;i++){const line=box(.035,.018,2.25,mat(0xd8dbd2,.75));line.position.set(-1.02+i*.68,.04,0);line.castShadow=false;g.add(line)}
 const a=vehicle(g,bank,0,1.32);a.position.set(-.68,.04,.05)
 const b=vehicle(g,bank,2,1.4);b.position.set(.68,.04,-.04)
 parent.add(g)
}
function path(points,closed=false){
 const pts=points.map(([x,z])=>new THREE.Vector3(x,0,z)),p=new THREE.CurvePath()
 for(let i=0;i<pts.length-1;i++)p.add(new THREE.LineCurve3(pts[i],pts[i+1]))
 if(closed&&pts.length>2)p.add(new THREE.LineCurve3(pts[pts.length-1],pts[0]))
 return p
}

export const CAMPUS_WALK_ROUTES=[
 path([[-4.95,-3.2],[-4.95,3.2]]),
 path([[-1.25,-3.2],[-1.25,3.2]]),
 path([[1.25,-3.2],[1.25,3.2]]),
 path([[4.95,-3.2],[4.95,3.2]]),
 path([[-9.6,-4.95],[-3.2,-4.95]]),
 path([[3.2,4.95],[9.6,4.95]]),
 path([[-9.6,1.25],[-3.2,1.25]]),
 path([[3.2,-1.25],[9.6,-1.25]])
]

export function decorateCampus(root,bank){
 const g=new THREE.Group();g.name='v9-intentional-city-streets'
 buildRoadNetwork(g);centralSignals(g,bank)
 ;[[-11.6,-5.2,0],[-7.6,5.2,Math.PI],[7.6,-5.2,0],[11.6,5.2,Math.PI],[-5.2,-11.6,Math.PI/2],[5.2,-7.6,-Math.PI/2],[-5.2,11.6,Math.PI/2],[5.2,7.6,-Math.PI/2]].forEach(([x,z,r])=>curbLight(g,bank,x,z,r))
 parking(g,bank,-3.2,-9.6,0);parking(g,bank,3.2,-9.6,0)

 const inner=path([[-6.05,-6.75],[6.05,-6.75],[6.75,-6.05],[6.75,6.05],[6.05,6.75],[-6.05,6.75],[-6.75,6.05],[-6.75,-6.05]],true)
 const outer=path([[-12.45,-6.75],[12.45,-6.75],[12.75,-6.45],[12.75,6.45],[12.45,6.75],[-12.45,6.75],[-12.75,6.45],[-12.75,-6.45]],true)
 const lower=path([[-6.05,-13.15],[6.05,-13.15],[6.75,-12.45],[6.75,-.35],[-6.05,-.35],[-6.75,-1.05],[-6.75,-12.45]],true)
 const traffic=[
  {view:vehicle(g,bank,0,1.48),curve:inner,offset:.04,speed:.0000105},
  {view:vehicle(g,bank,1,1.58),curve:outer,offset:.38,speed:.0000086},
  {view:vehicle(g,bank,2,1.5),curve:lower,offset:.71,speed:.0000095},
  {view:vehicle(g,bank,3,1.42),curve:inner,offset:.55,speed:.0000111},
  {view:vehicle(g,bank,4,1.5),curve:outer,offset:.82,speed:.0000082}
 ]
 traffic.forEach(t=>{t.view.position.y=.10})
 root.add(g);return traffic
}
export function animateCampusTraffic(traffic,now){
 for(const t of traffic??[]){const u=(t.offset+now*t.speed)%1,p=t.curve.getPointAt(u),tan=t.curve.getTangentAt(u).normalize();t.view.position.set(p.x,.10,p.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)+(t.view.userData.forwardOffset??0)}
}
