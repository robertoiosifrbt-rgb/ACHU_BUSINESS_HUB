import * as THREE from 'three'

const mat=(color,roughness=.82,metalness=.02)=>new THREE.MeshStandardMaterial({color,roughness,metalness})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.receiveShadow=true;o.castShadow=true;return o}

function segment(parent,a,b,width=2.1){
 const [x1,z1]=a,[x2,z2]=b,dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),rot=Math.atan2(dx,dz),mx=(x1+x2)/2,mz=(z1+z2)/2
 const road=box(width,.055,len,mat(0x273135,.99,.03));road.position.set(mx,.018,mz);road.rotation.y=rot;parent.add(road)
 const nx=-dz/len,nz=dx/len
 for(const side of[-1,1]){
  const walk=box(.5,.075,len,mat(0x87958d,.96));walk.position.set(mx+nx*side*(width/2+.3),.035,mz+nz*side*(width/2+.3));walk.rotation.y=rot;parent.add(walk)
 }
 const dashCount=Math.max(2,Math.floor(len/2.2))
 for(let i=0;i<dashCount;i++){
  if(i%2)continue
  const t=(i+.5)/dashCount,d=.6
  const mark=box(.07,.018,d,mat(0xd7d5c8,.75));mark.position.set(x1+dx*t,.055,z1+dz*t);mark.rotation.y=rot;parent.add(mark)
 }
 return {a,b,width}
}

function crosswalk(parent,x,z,rot=0){
 for(let i=-3;i<=3;i++){
  const stripe=box(.17,.022,1.8,mat(0xdedbcf,.72));stripe.position.set(x+i*.31,.065,z);stripe.rotation.y=rot;parent.add(stripe)
 }
}

function lamp(parent,x,z){
 const g=new THREE.Group(),pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,1.55,10),mat(0x2f3b3d,.5,.35));pole.position.y=.78;g.add(pole)
 const arm=box(.42,.035,.035,mat(0x2f3b3d,.5,.35));arm.position.set(.18,1.52,0);g.add(arm)
 const light=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),new THREE.MeshStandardMaterial({color:0xffd98a,emissive:0xffc65b,emissiveIntensity:.65,roughness:.4}));light.position.set(.38,1.49,0);g.add(light);g.position.set(x,0,z);parent.add(g)
}

function planter(parent,x,z){
 const pot=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.34,12),mat(0x596861,.9));pot.position.set(x,.17,z);parent.add(pot)
 const bush=new THREE.Mesh(new THREE.IcosahedronGeometry(.38,1),mat(0x356c50,.94));bush.scale.y=.8;bush.position.set(x,.62,z);parent.add(bush)
}

function van(parent,color=0x31906f){
 const g=new THREE.Group(),body=box(.86,.34,.43,mat(color,.44,.12));body.position.y=.3;g.add(body)
 const cab=box(.34,.27,.39,mat(0x81938c,.28,.06));cab.position.set(.21,.51,0);g.add(cab)
 for(const dx of[-.27,.27])for(const dz of[-.2,.2]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.06,12),mat(0x171d1e,.98));w.rotation.x=Math.PI/2;w.position.set(dx,.15,dz);g.add(w)}
 g.scale.setScalar(.88);parent.add(g);return g
}

function parking(parent,x,z,rot=0){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot
 const pad=box(4.4,.035,2.5,mat(0x394346,.98));pad.position.y=.015;g.add(pad)
 for(let i=-2;i<=2;i++){const line=box(.045,.02,2.2,mat(0xc8c6ba,.75));line.position.set(i*.82,.04,0);g.add(line)}
 const a=van(g,0x31906f);a.position.set(-1.2,.04,.1);a.rotation.y=Math.PI/2
 const b=van(g,0x59676c);b.position.set(.45,.04,-.1);b.rotation.y=Math.PI/2
 parent.add(g)
}

// Piecewise straight routes deliberately follow the street/sidewalk geometry.
// Catmull-Rom was removed because it cut corners through plots and buildings.
function polyline(points,closed=true){
 const pts=points.map(([x,z])=>new THREE.Vector3(x,0,z)),path=new THREE.CurvePath()
 for(let i=0;i<pts.length-1;i++)path.add(new THREE.LineCurve3(pts[i],pts[i+1]))
 if(closed&&pts.length>2)path.add(new THREE.LineCurve3(pts[pts.length-1],pts[0]))
 return path
}

export const CAMPUS_WALK_ROUTES=[
 polyline([[-5.55,-4.05],[3.45,-4.05],[3.45,5.15],[-5.55,5.15]]),
 polyline([[3.45,-4.05],[6.15,-4.05],[6.15,-1.35],[3.45,-1.35]]),
 polyline([[-5.55,-4.05],[-2.85,-4.05],[-2.85,-1.35],[-5.55,-1.35]]),
 polyline([[-5.55,2.45],[-2.85,2.45],[-2.85,5.15],[-5.55,5.15]]),
 polyline([[3.45,2.45],[6.15,2.45],[6.15,5.15],[3.45,5.15]]),
 polyline([[-5.55,-8.38],[6.15,-8.38],[6.15,-4.05],[-5.55,-4.05]])
]

export function decorateCampus(root){
 const g=new THREE.Group();g.name='v6-street-network'
 segment(g,[-14,-2.7],[13,-2.7],2.15)
 segment(g,[-13,3.8],[13,3.8],2.15)
 segment(g,[-4.2,-11],[-4.2,10.8],2.05)
 segment(g,[4.8,-11],[4.8,11],2.05)
 segment(g,[-10,-7.2],[10,-7.2],1.8)
 crosswalk(g,-4.2,-2.7,0);crosswalk(g,4.8,-2.7,0);crosswalk(g,-4.2,3.8,0);crosswalk(g,4.8,3.8,0)
 ;[[-6.1,-3.9],[-1.8,-3.9],[2.7,-3.9],[7,-3.9],[-6.1,5],[-1.8,5],[2.7,5],[7,5],[-5.45,.2],[6.05,.2]].forEach(([x,z])=>lamp(g,x,z))
 ;[[-2.5,.7],[2.6,.8],[-2.6,6.2],[2.9,-5.4]].forEach(([x,z])=>planter(g,x,z))
 parking(g,-9.2,6.7,.06);parking(g,9.1,7.3,-.08);parking(g,8.5,-9.1,.02)

 const roadLoop=polyline([[-11.5,-2.7],[4.8,-2.7],[4.8,3.8],[-4.2,3.8],[-4.2,-7.2],[4.8,-7.2]])
 const innerLoop=polyline([[-4.2,-7.2],[4.8,-7.2],[4.8,3.8],[-4.2,3.8]])
 const traffic=[
  {view:van(g,0x31906f),curve:roadLoop,offset:.04,speed:.0000105},
  {view:van(g,0x59676c),curve:roadLoop,offset:.47,speed:.0000092},
  {view:van(g,0x3f7891),curve:innerLoop,offset:.74,speed:.0000100}
 ]
 traffic.forEach(t=>{t.view.scale.multiplyScalar(.82);t.view.position.y=.08})
 root.add(g);return traffic
}

export function animateCampusTraffic(traffic,now){
 for(const t of traffic??[]){
  const u=(t.offset+now*t.speed)%1,p=t.curve.getPointAt(u),tan=t.curve.getTangentAt(u).normalize()
  t.view.position.set(p.x,.08,p.z)
  // Vans are modelled with their bonnet on local +X, so align +X to travel direction.
  t.view.rotation.y=Math.atan2(-tan.z,tan.x)
 }
}
