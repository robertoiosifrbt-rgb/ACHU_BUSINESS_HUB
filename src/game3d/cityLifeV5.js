import * as THREE from 'three'

const ROAD=3.2
const mat=(color,roughness=.82,metalness=.02)=>new THREE.MeshStandardMaterial({color,roughness,metalness})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.receiveShadow=true;o.castShadow=true;return o}
const cellKey=(x,z)=>`${x},${z}`
const DIRS={N:[0,1],E:[1,0],S:[0,-1],W:[-1,0]}

function fitVehicle(view,targetLength=1.45){
 view.rotation.set(0,0,0);view.updateMatrixWorld(true)
 let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3())
 const longX=s.x>s.z*1.08
 const scale=targetLength/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(scale);view.updateMatrixWorld(true)
 b=new THREE.Box3().setFromObject(view);const cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2
 view.position.x-=cx;view.position.z-=cz;view.position.y-=b.min.y
 // Designersoup FBX models point opposite to the tangent after the axis swap.
 // Keep the model-axis correction and flip the actual nose into travel direction.
 view.userData.forwardOffset=longX?Math.PI/2:Math.PI
 return view
}
function vehicle(parent,bank,index=0,targetLength=1.45){const view=fitVehicle(bank?.cloneCar?.(index)??bank?.clone?.('carSedan')??new THREE.Group(),targetLength);parent.add(view);return view}
function fitRoad(view,size=ROAD){
 view.rotation.set(0,0,0);view.updateMatrixWorld(true)
 let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),scale=size/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(scale);view.updateMatrixWorld(true)
 b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y
 return view
}
function roadTile(parent,bank,key,x,z,rot=0){
 const source=bank?.models?.[key]?bank.clone(key):bank?.clone?.('roadStraight')??new THREE.Group(),v=fitRoad(source)
 v.position.set(x*ROAD,.025,z*ROAD);v.rotation.y=rot;parent.add(v);return v
}
function buildStreetCells(){
 const cells=new Set(),add=(x,z)=>cells.add(cellKey(x,z))
 for(let i=-4;i<=4;i++){add(-4,i);add(4,i);add(i,-4);add(i,4)}
 for(let i=-2;i<=2;i++){add(-2,i);add(2,i);add(i,-2);add(i,2)}
 for(let i=-4;i<=4;i++){add(0,i);add(i,0)}
 return cells
}
function connections(cells,x,z){return Object.entries(DIRS).filter(([,d])=>cells.has(cellKey(x+d[0],z+d[1]))).map(([n])=>n)}
function roadSpec(c){
 const has=n=>c.includes(n),n=c.length
 if(n>=4)return['roadCrossroad',0]
 if(n===3){if(!has('S'))return['roadIntersection',0];if(!has('W'))return['roadIntersection',Math.PI/2];if(!has('N'))return['roadIntersection',Math.PI];return['roadIntersection',-Math.PI/2]}
 if(n===2){if(has('E')&&has('W'))return['roadStraight',0];if(has('N')&&has('S'))return['roadStraight',Math.PI/2];if(has('N')&&has('W'))return['roadBend',0];if(has('N')&&has('E'))return['roadBend',Math.PI/2];if(has('S')&&has('E'))return['roadBend',Math.PI];return['roadBend',-Math.PI/2]}
 if(n===1){if(has('E'))return['roadEnd',0];if(has('S'))return['roadEnd',Math.PI/2];if(has('W'))return['roadEnd',Math.PI];return['roadEnd',-Math.PI/2]}
 return['roadStraight',0]
}
function buildRoadNetwork(parent,bank){const cells=buildStreetCells();for(const k of cells){const [x,z]=k.split(',').map(Number),spec=roadSpec(connections(cells,x,z));roadTile(parent,bank,spec[0],x,z,spec[1])}return cells}
function curbLight(parent,bank,x,z,rot=0){const v=bank?.models?.roadLight?bank.clone('roadLight'):null;if(!v)return;v.scale.setScalar(2.15);v.position.set(x,.06,z);v.rotation.y=rot;parent.add(v)}
function centralSignals(parent,bank){
 if(!bank?.models?.roadTrafficLight)return
 const positions=[[-1.18,-1.18,0],[1.18,-1.18,Math.PI/2],[1.18,1.18,Math.PI],[-1.18,1.18,-Math.PI/2]]
 for(const [x,z,r] of positions){const v=bank.clone('roadTrafficLight');v.scale.setScalar(2.25);v.position.set(x,.06,z);v.rotation.y=r;parent.add(v)}
}
function parking(parent,bank,x,z,rot=0){
 const g=new THREE.Group();g.position.set(x,.08,z);g.rotation.y=rot
 const pad=box(2.88,.035,2.82,mat(0x3b4545,.98));pad.position.y=.015;pad.castShadow=false;g.add(pad)
 for(let i=-1;i<=2;i++){const line=box(.035,.018,2.25,mat(0xd8dbd2,.75));line.position.set(-1.02+i*.68,.04,0);line.castShadow=false;g.add(line)}
 const a=vehicle(g,bank,0,1.32);a.position.set(-.68,.04,.05);a.rotation.y=a.userData.forwardOffset??0
 const b=vehicle(g,bank,2,1.4);b.position.set(.68,.04,-.04);b.rotation.y=b.userData.forwardOffset??0
 parent.add(g)
}
function path(points,closed=false){const pts=points.map(([x,z])=>new THREE.Vector3(x,0,z)),p=new THREE.CurvePath();for(let i=0;i<pts.length-1;i++)p.add(new THREE.LineCurve3(pts[i],pts[i+1]));if(closed&&pts.length>2)p.add(new THREE.LineCurve3(pts[pts.length-1],pts[0]));return p}
function roundedLoop(min,max,r=.55){const p=new THREE.CurvePath(),v=(x,z)=>new THREE.Vector3(x,0,z);p.add(new THREE.LineCurve3(v(min+r,min),v(max-r,min)));p.add(new THREE.QuadraticBezierCurve3(v(max-r,min),v(max,min),v(max,min+r)));p.add(new THREE.LineCurve3(v(max,min+r),v(max,max-r)));p.add(new THREE.QuadraticBezierCurve3(v(max,max-r),v(max,max),v(max-r,max)));p.add(new THREE.LineCurve3(v(max-r,max),v(min+r,max)));p.add(new THREE.QuadraticBezierCurve3(v(min+r,max),v(min,max),v(min,max-r)));p.add(new THREE.LineCurve3(v(min,max-r),v(min,min+r)));p.add(new THREE.QuadraticBezierCurve3(v(min,min+r),v(min,min),v(min+r,min)));return p}

export const CAMPUS_WALK_ROUTES=[path([[-4.95,-3.2],[-4.95,3.2]]),path([[-1.25,-3.2],[-1.25,3.2]]),path([[1.25,-3.2],[1.25,3.2]]),path([[4.95,-3.2],[4.95,3.2]]),path([[-9.6,-4.95],[-3.2,-4.95]]),path([[3.2,4.95],[9.6,4.95]]),path([[-9.6,1.25],[-3.2,1.25]]),path([[3.2,-1.25],[9.6,-1.25]])]

export function decorateCampus(root,bank){
 const g=new THREE.Group();g.name='v10-road-kit-street-graph';buildRoadNetwork(g,bank);centralSignals(g,bank)
 ;[[-11.6,-5.2,0],[-7.6,5.2,Math.PI],[7.6,-5.2,0],[11.6,5.2,Math.PI],[-5.2,-11.6,Math.PI/2],[5.2,-7.6,-Math.PI/2],[-5.2,11.6,Math.PI/2],[5.2,7.6,-Math.PI/2]].forEach(([x,z,r])=>curbLight(g,bank,x,z,r))
 parking(g,bank,-3.2,-9.6,0);parking(g,bank,3.2,-9.6,0)
 const innerA=roundedLoop(-6.14,6.14,.52),innerB=roundedLoop(-6.66,6.66,.52),outerA=roundedLoop(-12.54,12.54,.52),outerB=roundedLoop(-13.06,13.06,.52)
 const traffic=[{view:vehicle(g,bank,0,1.48),curve:innerA,offset:.04,speed:.0000105},{view:vehicle(g,bank,1,1.58),curve:outerA,offset:.38,speed:.0000086},{view:vehicle(g,bank,2,1.5),curve:innerB,offset:.71,speed:.0000095},{view:vehicle(g,bank,3,1.42),curve:outerB,offset:.55,speed:.0000088},{view:vehicle(g,bank,4,1.5),curve:innerA,offset:.82,speed:.0000082}]
 traffic.forEach(t=>{t.view.position.y=.10});root.add(g);return traffic
}
export function animateCampusTraffic(traffic,now){for(const t of traffic??[]){const u=(t.offset+now*t.speed)%1,p=t.curve.getPointAt(u),tan=t.curve.getTangentAt(u).normalize();t.view.position.set(p.x,.10,p.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)+(t.view.userData.forwardOffset??0)}}
