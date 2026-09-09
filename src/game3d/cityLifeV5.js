import * as THREE from 'three'

const ROAD_TILE=3.2
const ROAD_INDEX_MIN=-4
const ROAD_INDEX_MAX=4
const ROAD_LINES=[-12.8,-6.4,0,6.4,12.8]
const mat=(color,roughness=.82,metalness=.02)=>new THREE.MeshStandardMaterial({color,roughness,metalness})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.receiveShadow=true;o.castShadow=true;return o}

function fallbackVehicle(){
 const g=new THREE.Group(),body=box(.68,.34,1.12,mat(0x397f68,.44,.12));body.position.y=.3;g.add(body)
 const cab=box(.62,.27,.4,mat(0x7d8d86,.28,.06));cab.position.set(0,.51,.34);g.add(cab)
 for(const x of[-.28,.28])for(const z of[-.34,.34]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.06,12),mat(0x171d1e,.98));w.rotation.z=Math.PI/2;w.position.set(x,.15,z);g.add(w)}
 return g
}

function fitVehicle(view,targetLength=1.2){
 view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3())
 const scale=targetLength/Math.max(.001,s.z);view.scale.multiplyScalar(scale);view.updateMatrixWorld(true)
 b=new THREE.Box3().setFromObject(view);const cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2
 view.position.x-=cx;view.position.z-=cz;view.position.y-=b.min.y;view.updateMatrixWorld(true)
 return view
}

function vehicle(parent,bank,key='carVan',targetLength=1.2){
 const view=bank?.models?.[key]?bank.clone(key):fallbackVehicle();fitVehicle(view,targetLength);parent.add(view);return view
}

function fitRoad(view){
 view.updateMatrixWorld(true)
 const b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),scale=ROAD_TILE/Math.max(.001,Math.max(s.x,s.z))
 view.scale.multiplyScalar(scale);view.updateMatrixWorld(true)
 const after=new THREE.Box3().setFromObject(view),cx=(after.min.x+after.max.x)/2,cz=(after.min.z+after.max.z)/2
 view.position.x-=cx;view.position.z-=cz;view.position.y-=after.min.y
 return view
}

function roadTile(parent,bank,key,x,z,rot=0){
 const view=fitRoad(bank?.models?.[key]?bank.clone(key):bank?.clone?.('roadStraight')??new THREE.Group())
 view.position.x+=x;view.position.z+=z;view.position.y+=.015;view.rotation.y=rot;parent.add(view);return view
}

function buildRoadGrid(parent,bank){
 for(let iz=ROAD_INDEX_MIN;iz<=ROAD_INDEX_MAX;iz++)for(let ix=ROAD_INDEX_MIN;ix<=ROAD_INDEX_MAX;ix++){
  const roadX=ix%2===0,roadZ=iz%2===0
  if(!roadX&&!roadZ)continue
  const x=ix*ROAD_TILE,z=iz*ROAD_TILE
  if(roadX&&roadZ){roadTile(parent,bank,'roadCrossroad',x,z);continue}
  const nearCentreCrossing=(iz===0&&Math.abs(ix)===1)||(ix===0&&Math.abs(iz)===1)
  const key=nearCentreCrossing?'roadCrossing':'roadStraight'
  roadTile(parent,bank,key,x,z,roadZ?Math.PI/2:0)
 }
}

function curbLight(parent,bank,x,z,rot=0){
 if(!bank?.models?.roadLight)return
 const v=bank.clone('roadLight');v.scale.setScalar(2.7);v.position.set(x,.04,z);v.rotation.y=rot;parent.add(v)
}

function centralSignals(parent,bank){
 if(!bank?.models?.roadTrafficLight)return
 const positions=[[-1.18,-1.18,0],[1.18,-1.18,Math.PI/2],[1.18,1.18,Math.PI],[-1.18,1.18,-Math.PI/2]]
 for(const [x,z,r] of positions){const v=bank.clone('roadTrafficLight');v.scale.setScalar(2.5);v.position.set(x,.04,z);v.rotation.y=r;parent.add(v)}
}

function parking(parent,bank,x,z,rot=0){
 const g=new THREE.Group();g.position.set(x,.07,z);g.rotation.y=rot
 const pad=box(2.78,.035,2.72,mat(0x30383a,.98));pad.position.y=.015;pad.castShadow=false;g.add(pad)
 for(let i=-1;i<=2;i++){const line=box(.035,.018,2.25,mat(0xb8bbb0,.75));line.position.set(-1.02+i*.68,.04,0);line.castShadow=false;g.add(line)}
 const a=vehicle(g,bank,'carSedan',1.08);a.position.set(-.68,.04,.08);a.rotation.y=0
 const b=vehicle(g,bank,'carVan',1.18);b.position.set(.68,.04,-.04);b.rotation.y=0
 parent.add(g)
}

function polyline(points,closed=true){
 const pts=points.map(([x,z])=>new THREE.Vector3(x,0,z)),path=new THREE.CurvePath()
 for(let i=0;i<pts.length-1;i++)path.add(new THREE.LineCurve3(pts[i],pts[i+1]))
 if(closed&&pts.length>2)path.add(new THREE.LineCurve3(pts[pts.length-1],pts[0]))
 return path
}

// Sidewalk routes follow the edges of the Kenney road tiles; they never cross a lot.
export const CAMPUS_WALK_ROUTES=[
 polyline([[-5.05,-6.4],[-5.05,6.4],[5.05,6.4],[5.05,-6.4]]),
 polyline([[-7.75,-6.4],[-7.75,6.4],[-11.45,6.4],[-11.45,-6.4]]),
 polyline([[7.75,-6.4],[7.75,6.4],[11.45,6.4],[11.45,-6.4]]),
 polyline([[-6.4,-7.75],[6.4,-7.75],[6.4,-11.45],[-6.4,-11.45]]),
 polyline([[-6.4,7.75],[6.4,7.75],[6.4,11.45],[-6.4,11.45]]),
 polyline([[-1.35,-6.4],[-1.35,6.4],[1.35,6.4],[1.35,-6.4]])
]

export function decorateCampus(root,bank){
 const g=new THREE.Group();g.name='v8-kenney-road-grid'
 buildRoadGrid(g,bank)
 centralSignals(g,bank)
 ;[[-11.4,-4.9,0],[-7.8,4.9,Math.PI],[7.8,-4.9,0],[11.4,4.9,Math.PI],[-4.9,-11.4,Math.PI/2],[4.9,-7.8,-Math.PI/2],[-4.9,11.4,Math.PI/2],[4.9,7.8,-Math.PI/2]].forEach(([x,z,r])=>curbLight(g,bank,x,z,r))
 // Parking lives only in deliberately empty building plots.
 parking(g,bank,-3.2,-9.6,0);parking(g,bank,3.2,-9.6,0)

 const innerLoop=polyline([[-6.4,-6.4],[6.4,-6.4],[6.4,6.4],[-6.4,6.4]])
 const outerLoop=polyline([[-12.8,-6.4],[12.8,-6.4],[12.8,6.4],[-12.8,6.4]])
 const lowerLoop=polyline([[-6.4,-12.8],[6.4,-12.8],[6.4,0],[-6.4,0]])
 const traffic=[
  {view:vehicle(g,bank,'carVan',1.15),curve:innerLoop,offset:.04,speed:.0000105},
  {view:vehicle(g,bank,'carDelivery',1.34),curve:outerLoop,offset:.38,speed:.0000088},
  {view:vehicle(g,bank,'carSuv',1.12),curve:lowerLoop,offset:.71,speed:.0000097},
  {view:vehicle(g,bank,'carSedan',1.08),curve:innerLoop,offset:.55,speed:.0000112}
 ]
 traffic.forEach(t=>{t.view.position.y=.095})
 root.add(g);return traffic
}

export function animateCampusTraffic(traffic,now){
 for(const t of traffic??[]){
  const u=(t.offset+now*t.speed)%1,p=t.curve.getPointAt(u),tan=t.curve.getTangentAt(u).normalize()
  t.view.position.set(p.x,.095,p.z)
  // Kenney cars use local +Z as their front.
  t.view.rotation.y=Math.atan2(tan.x,tan.z)
 }
}
