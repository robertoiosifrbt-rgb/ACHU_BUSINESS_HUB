import * as THREE from 'three'

const mat=(color,roughness=.82,metalness=.02)=>new THREE.MeshStandardMaterial({color,roughness,metalness})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.receiveShadow=true;o.castShadow=true;return o}

function segment(parent,a,b,width=2.1){
 const [x1,z1]=a,[x2,z2]=b,dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),rot=Math.atan2(dx,dz),mx=(x1+x2)/2,mz=(z1+z2)/2
 const road=box(width,.055,len,mat(0x313a3d,.98,.02));road.position.set(mx,.018,mz);road.rotation.y=rot;parent.add(road)
 const nx=-dz/len,nz=dx/len
 for(const side of[-1,1]){
  const walk=box(.48,.075,len,mat(0xbcc2bd,.96));walk.position.set(mx+nx*side*(width/2+.28),.035,mz+nz*side*(width/2+.28));walk.rotation.y=rot;parent.add(walk)
 }
 const dashCount=Math.max(2,Math.floor(len/2.2))
 for(let i=0;i<dashCount;i++){
  if(i%2)continue
  const t=(i+.5)/dashCount,d=.6
  const mark=box(.07,.018,d,mat(0xe9e8df,.75));mark.position.set(x1+dx*t,.055,z1+dz*t);mark.rotation.y=rot;parent.add(mark)
 }
 return {a,b,width}
}

function crosswalk(parent,x,z,rot=0){
 for(let i=-3;i<=3;i++){
  const stripe=box(.17,.022,1.8,mat(0xf3f1e7,.7));stripe.position.set(x+i*.31,.065,z);stripe.rotation.y=rot;parent.add(stripe)
 }
}

function lamp(parent,x,z){
 const g=new THREE.Group(),pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,1.55,10),mat(0x394447,.5,.35));pole.position.y=.78;g.add(pole)
 const arm=box(.42,.035,.035,mat(0x394447,.5,.35));arm.position.set(.18,1.52,0);g.add(arm)
 const light=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),new THREE.MeshStandardMaterial({color:0xffe6a3,emissive:0xffcf6b,emissiveIntensity:.65,roughness:.4}));light.position.set(.38,1.49,0);g.add(light);g.position.set(x,0,z);parent.add(g)
}

function planter(parent,x,z){
 const pot=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.34,12),mat(0x7a807d,.9));pot.position.set(x,.17,z);parent.add(pot)
 const bush=new THREE.Mesh(new THREE.IcosahedronGeometry(.38,1),mat(0x4d8c68,.94));bush.scale.y=.8;bush.position.set(x,.62,z);parent.add(bush)
}

function van(parent,color=0x3da982){
 const g=new THREE.Group(),body=box(.86,.34,.43,mat(color,.44,.12));body.position.y=.3;g.add(body)
 const cab=box(.34,.27,.39,mat(0xdbe5e1,.24,.06));cab.position.set(.21,.51,0);g.add(cab)
 for(const dx of[-.27,.27])for(const dz of[-.2,.2]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.06,12),mat(0x202627,.98));w.rotation.x=Math.PI/2;w.position.set(dx,.15,dz);g.add(w)}
 g.scale.setScalar(.88);parent.add(g);return g
}

function parking(parent,x,z,rot=0){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot
 const pad=box(4.4,.035,2.5,mat(0x4a5152,.96));pad.position.y=.015;g.add(pad)
 for(let i=-2;i<=2;i++){const line=box(.045,.02,2.2,mat(0xe8e6dd,.75));line.position.set(i*.82,.04,0);g.add(line)}
 const a=van(g,0x3da982);a.position.set(-1.2,.04,.1);a.rotation.y=Math.PI/2
 const b=van(g,0x6d7a80);b.position.set(.45,.04,-.1);b.rotation.y=Math.PI/2
 parent.add(g)
}

function route(points){return new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'catmullrom',.08)}

export const CAMPUS_WALK_ROUTES=[
 route([[-8.6,2.15],[-4.8,2.15],[-4.1,-2.4],[-.7,-2.5],[-.7,1.55],[-4.5,2.2]]),
 route([[.75,1.5],[4.7,1.5],[5.05,-3],[8.2,-3],[8.1,3.6],[4.6,4.1]]),
 route([[-4.2,5.5],[-.8,5.45],[-.8,2.2],[3.2,2.2],[4.1,5.6],[.2,6.3]]),
 route([[-7.8,-4.2],[-4.2,-4.15],[-4.1,-1.8],[-.6,-1.8],[-.8,-5.8],[-5.2,-6.0]]),
 route([[2.1,-5.8],[4.7,-5.7],[4.8,-2.1],[8.5,-2.1],[8.3,-6.3],[5.3,-7.0]])
]

export function decorateCampus(root){
 const g=new THREE.Group();g.name='v5-visible-streets'
 const roads=[]
 roads.push(segment(g,[-14,-2.7],[13,-2.7],2.15))
 roads.push(segment(g,[-13,3.8],[13,3.8],2.15))
 roads.push(segment(g,[-4.2,-11],[-4.2,10.8],2.05))
 roads.push(segment(g,[4.8,-11],[4.8,11],2.05))
 roads.push(segment(g,[-10,-7.2],[10,-7.2],1.8))
 crosswalk(g,-4.2,-2.7,0);crosswalk(g,4.8,-2.7,0);crosswalk(g,-4.2,3.8,0);crosswalk(g,4.8,3.8,0)
 ;[[-6.1,-3.9],[-1.8,-3.9],[2.7,-3.9],[7,-3.9],[-6.1,5.0],[-1.8,5.0],[2.7,5.0],[7,5.0],[-5.45,0.2],[6.05,.2]].forEach(([x,z])=>lamp(g,x,z))
 ;[[-2.5,.7],[2.6,.8],[-2.6,6.2],[2.9,-5.4]].forEach(([x,z])=>planter(g,x,z))
 parking(g,-9.2,6.7,.06);parking(g,9.1,7.3,-.08);parking(g,8.5,-9.1,.02)
 const traffic=[
  {view:van(g,0x3da982),curve:route([[-12,-2.7],[-4.4,-2.7],[4.7,-2.7],[11,-2.7],[4.7,3.8],[-4.2,3.8]]) ,offset:.05,speed:.000018},
  {view:van(g,0x708087),curve:route([[-4.2,-9],[-4.2,-2.7],[-4.2,3.8],[-4.2,8],[4.8,7],[4.8,3.8],[4.8,-2.7],[4.8,-8]]) ,offset:.46,speed:.000015},
  {view:van(g,0x4f91c7),curve:route([[-9,-7.2],[-4.2,-7.2],[4.8,-7.2],[9,-7.2],[4.8,-2.7],[-4.2,-2.7]]) ,offset:.78,speed:.000016}
 ]
 traffic.forEach(t=>{t.view.scale.multiplyScalar(.82);t.view.position.y=.08})
 root.add(g);return traffic
}

export function animateCampusTraffic(traffic,now){
 for(const t of traffic??[]){const u=(t.offset+now*t.speed)%1,p=t.curve.getPointAt(u),tan=t.curve.getTangentAt(u);t.view.position.set(p.x,.08,p.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)}
}
