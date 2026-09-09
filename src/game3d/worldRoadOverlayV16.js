import * as THREE from 'three'

const curve=(pts,closed=false)=>new THREE.CatmullRomCurve3(pts.map(([x,z])=>new THREE.Vector3(x,0,z)),closed,'centripetal',.12)
const MAIN=curve([[-11,1.0],[-8.6,.8],[-6.0,.95],[-3.4,.7],[-.6,.84],[2.4,.65],[5.5,.92],[8.4,1.35],[11,1.18]])
const NORTH=curve([[-9.7,4.65],[-7.3,4.42],[-4.7,4.65],[-2.0,4.5],[.8,4.72],[3.8,4.45]])
const SOUTH=curve([[-10.2,-2.25],[-7.2,-2.5],[-4.3,-2.2],[-1.2,-2.45],[1.7,-2.18],[4.5,-2.42],[7.4,-2.28],[10.2,-2.5]])
const WEST_LOOP=curve([[-10.1,2.15],[-9.7,4.45],[-8.0,5.9],[-5.8,5.25],[-5.0,3.45],[-5.75,1.95],[-8.0,1.55],[-10.1,2.15]],true)
const BUSINESS_LOOP=curve([[3.9,2.0],[5.2,4.55],[7.2,5.65],[9.4,5.0],[10.2,3.25],[9.35,1.72],[6.9,1.5],[4.7,1.65],[3.9,2.0]],true)
const CENTRE=curve([[-1.45,-4.45],[-1.35,-2.4],[-1.2,-.45],[-1.0,.8],[-1.05,2.7],[-1.7,4.55]])
const WEST_LINK=curve([[-6.7,5.0],[-6.65,3.0],[-6.75,1.0],[-6.8,-1.0],[-6.9,-2.45],[-6.95,-4.2],[-7.0,-6.75]])
const EAST_LINK=curve([[6.55,4.7],[6.5,2.8],[6.45,1.0],[6.35,-.8],[6.3,-2.35],[6.25,-4.15],[6.2,-6.7]])
const LOGISTICS=curve([[5.0,-2.35],[6.4,-3.0],[8.2,-3.65],[10.4,-3.85]])
const ROADS=[
 {c:MAIN,w:1.0,marked:true},{c:NORTH,w:.82,marked:true},{c:SOUTH,w:.86,marked:true},
 {c:WEST_LOOP,w:.78,marked:false},{c:BUSINESS_LOOP,w:.8,marked:false},{c:CENTRE,w:.78,marked:true},
 {c:WEST_LINK,w:.8,marked:true},{c:EAST_LINK,w:.8,marked:true},{c:LOGISTICS,w:.78,marked:true}
]

const asphalt=new THREE.MeshBasicMaterial({color:0x172120,side:THREE.DoubleSide})
const curb=new THREE.MeshBasicMaterial({color:0xd4d9d5,side:THREE.DoubleSide})
const line=new THREE.MeshBasicMaterial({color:0xf0efe8,side:THREE.DoubleSide})

function segment(root,a,b,width,material,y,height=.035){
 const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)
 if(len<.001)return
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,len+.035),material)
 mesh.position.set((a.x+b.x)/2,y,(a.z+b.z)/2)
 mesh.rotation.y=Math.atan2(dx,dz)
 mesh.castShadow=false;mesh.receiveShadow=true
 root.add(mesh)
}
function solidRoad(root,c,width,marked,steps=72){
 for(let i=0;i<steps;i++){
  const a=c.getPointAt(i/steps),b=c.getPointAt((i+1)/steps)
  segment(root,a,b,width+.22,curb,.034,.032)
  segment(root,a,b,width,asphalt,.058,.04)
 }
 if(!marked)return
 for(let i=1;i<steps;i+=4){
  const u=i/steps,p=c.getPointAt(u),t=c.getTangentAt(u).normalize()
  const dash=new THREE.Mesh(new THREE.BoxGeometry(.035,.018,.25),line)
  dash.position.set(p.x,.088,p.z)
  dash.rotation.y=Math.atan2(t.x,t.z)
  dash.castShadow=false
  root.add(dash)
 }
}
function junction(root,x,z,r=.58){
 const curbDisk=new THREE.Mesh(new THREE.CylinderGeometry(r+.11,r+.11,.032,32),curb)
 curbDisk.position.set(x,.034,z);root.add(curbDisk)
 const disk=new THREE.Mesh(new THREE.CylinderGeometry(r,r,.04,32),asphalt)
 disk.position.set(x,.058,z);root.add(disk)
}

export function buildWorldRoadOverlayV16(){
 const root=new THREE.Group();root.name='world-road-overlay-v16-solid'
 for(const def of ROADS)solidRoad(root,def.c,def.w,def.marked)
 for(const [x,z,r] of[[-6.7,.95,.58],[-1.05,.8,.6],[6.45,1.0,.6],[-6.9,-2.42,.55],[-1.35,-2.4,.56],[6.3,-2.35,.56],[5.0,-2.35,.5]])junction(root,x,z,r)
 return root
}
