import * as THREE from 'three'

const roundedRect=(w,h,r=.18)=>{
 const s=new THREE.Shape(),x=-w/2,y=-h/2
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s
}
const extrude=(w,d,h,material,r=.18)=>{const g=new THREE.ExtrudeGeometry(roundedRect(w,d,r),{depth:h,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.05,bevelThickness:.05});g.rotateX(-Math.PI/2);g.translate(0,h/2,0);return new THREE.Mesh(g,material)}

export class BusinessScene{
 constructor(host){this.host=host;this.scene=new THREE.Scene();this.clock=new THREE.Clock();this.state=null;this.build()}
 build(){
  this.scene.background=new THREE.Color(0xdce8e4)
  this.scene.fog=new THREE.Fog(0xdce8e4,30,58)
  this.camera=new THREE.PerspectiveCamera(34,1,.1,100);this.camera.position.set(16,19,19);this.camera.lookAt(0,0,0)
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(2,devicePixelRatio));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;this.renderer.domElement.className='business-canvas';this.host.appendChild(this.renderer.domElement)
  const hemi=new THREE.HemisphereLight(0xf7fbfa,0x667873,2.4);this.scene.add(hemi)
  const sun=new THREE.DirectionalLight(0xfff1d7,4.2);sun.position.set(-8,18,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;this.scene.add(sun)
  this.world=new THREE.Group();this.scene.add(this.world);this.createGround();this.createRoads();this.createBuildings();this.createProps();this.createVan();this.createMarkers();this.resize();addEventListener('resize',()=>this.resize());this.animate()
 }
 mat(color,rough=.65,metal=.04){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})}
 createGround(){
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(54,54),this.mat(0xc8dbd3,1));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;this.world.add(ground)
  const district=new THREE.Mesh(new THREE.CircleGeometry(18,64),this.mat(0xdce8df,.95));district.rotation.x=-Math.PI/2;district.position.y=.012;district.scale.set(1.22,.84,1);this.world.add(district)
 }
 createRoads(){
  const asphalt=this.mat(0x394845,.94),line=this.mat(0xe7d89a,.82)
  const horizontal=new THREE.Mesh(new THREE.PlaneGeometry(45,5.2),asphalt);horizontal.rotation.x=-Math.PI/2;horizontal.position.set(0,.035,2.6);horizontal.receiveShadow=true;this.world.add(horizontal)
  const vertical=new THREE.Mesh(new THREE.PlaneGeometry(5.2,37),asphalt);vertical.rotation.x=-Math.PI/2;vertical.position.set(3.4,.04,-2);vertical.receiveShadow=true;this.world.add(vertical)
  for(let x=-18;x<19;x+=4.3){const dash=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.12),line);dash.rotation.x=-Math.PI/2;dash.position.set(x,.055,2.6);this.world.add(dash)}
  for(let z=-17;z<16;z+=4.3){const dash=new THREE.Mesh(new THREE.PlaneGeometry(.12,2.2),line);dash.rotation.x=-Math.PI/2;dash.position.set(3.4,.06,z);this.world.add(dash)}
 }
 createBuildings(){
  const glass=this.mat(0x7faaa7,.22,.2),dark=this.mat(0x263e3a,.52,.12),stone=this.mat(0xe9e7de,.8),warm=this.mat(0xc8a77e,.76)
  this.base=extrude(6.3,5.1,3.2,stone,.42);this.base.position.set(-7,0,-4.8);this.base.castShadow=true;this.base.receiveShadow=true;this.world.add(this.base)
  const fascia=extrude(5.4,.35,.75,dark,.08);fascia.position.set(-7,2.35,-2.35);fascia.castShadow=true;this.world.add(fascia)
  const door=extrude(1.3,.18,2.1,glass,.06);door.position.set(-7,1.05,-2.18);this.world.add(door)
  for(const x of[-8.8,-5.2]){const win=extrude(1.45,.14,1.2,glass,.05);win.position.set(x,1.35,-2.16);this.world.add(win)}
  const client=extrude(5.2,4.3,5.5,warm,.28);client.position.set(9.1,0,-6.3);client.castShadow=true;client.receiveShadow=true;this.world.add(client)
  for(let floor=0;floor<3;floor++)for(const x of[7.7,9.1,10.5]){const win=extrude(.82,.12,.72,glass,.04);win.position.set(x,1.2+floor*1.42,-4.1);this.world.add(win)}
  const blocks=[[-13,7,5.2,5.5,6.8],[12,8,6.4,5.5,8.5],[-3,11,8,5.4,5.2],[15,-1,5.5,5.1,6.1],[-15,-8,5.8,5.2,4.8]]
  blocks.forEach(([x,z,w,d,h],i)=>{const b=extrude(w,d,h,i%2?stone:dark,.25);b.position.set(x,0,z);b.castShadow=true;b.receiveShadow=true;this.world.add(b);for(let y=1.2;y<h-.4;y+=1.45)for(let wx=-w/2+1;wx<w/2-.4;wx+=1.35){const win=extrude(.68,.11,.58,glass,.03);win.position.set(x+wx,y,z-d/2-.02);this.world.add(win)}})
 }
 createProps(){
  const trunk=this.mat(0x7a6048,.9),leaf=this.mat(0x477d67,.88),pave=this.mat(0xe7e9e2,.92)
  for(const [x,z] of[[-10,-1],[-4,-1],[7,-1],[12,-1],[-10,6],[-2,7],[8,8],[16,7]]){const pad=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.45,.15,32),pave);pad.position.set(x,.08,z);pad.receiveShadow=true;this.world.add(pad);const t=new THREE.Mesh(new THREE.CylinderGeometry(.18,.24,1.4,12),trunk);t.position.set(x,.78,z);t.castShadow=true;this.world.add(t);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.9,2),leaf);crown.scale.y=1.2;crown.position.set(x,2,z);crown.castShadow=true;this.world.add(crown)}
 }
 createVan(){
  this.van=new THREE.Group();const white=this.mat(0xf4f5ef,.38,.1),brand=this.mat(0x2d8b70,.38,.12),rubber=this.mat(0x18201f,.9)
  const body=extrude(2.9,1.5,1.25,white,.28);body.position.y=.62;body.castShadow=true;this.van.add(body)
  const cab=extrude(1.15,1.45,.92,white,.22);cab.position.set(1.45,.52,0);cab.castShadow=true;this.van.add(cab)
  const stripe=extrude(1.45,.08,.42,brand,.04);stripe.position.set(-.45,.72,-.79);this.van.add(stripe)
  for(const x of[-.92,1.18])for(const z of[-.78,.78]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.19,24),rubber);wheel.rotation.x=Math.PI/2;wheel.position.set(x,.34,z);this.van.add(wheel)}
  this.van.position.set(-3.3,.15,-2);this.van.rotation.y=-.18;this.world.add(this.van)
 }
 createMarkers(){
  const ringMat=new THREE.MeshBasicMaterial({color:0x2f9f7d,transparent:true,opacity:.72,side:THREE.DoubleSide})
  this.clientRing=new THREE.Mesh(new THREE.RingGeometry(.7,.95,48),ringMat);this.clientRing.rotation.x=-Math.PI/2;this.clientRing.position.set(9.1,.12,-3.65);this.world.add(this.clientRing)
  this.route=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5,.12,-2),new THREE.Vector3(-1,.12,2.6),new THREE.Vector3(3.4,.12,2.6),new THREE.Vector3(7,.12,-1),new THREE.Vector3(9,.12,-3.6)]),new THREE.LineDashedMaterial({color:0x2f9f7d,dashSize:.55,gapSize:.35,linewidth:2}));this.route.computeLineDistances();this.route.visible=false;this.world.add(this.route)
 }
 update(state){this.state=state;const active=['scheduled','travelling','arrived','finishing'].includes(state.jobPhase);this.route.visible=active;this.clientRing.material.color.setHex(state.jobPhase==='finished'?0xe0ae53:0x2f9f7d);if(state.jobPhase==='arrived'||state.jobPhase==='finishing'||state.jobPhase==='finished')this.van.position.lerp(new THREE.Vector3(7.7,.15,-2.8),1);else if(state.jobPhase!=='travelling')this.van.position.lerp(new THREE.Vector3(-3.3,.15,-2),1)}
 resize(){const w=this.host.clientWidth||innerWidth,h=this.host.clientHeight||innerHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false)}
 animate(){requestAnimationFrame(()=>this.animate());const t=this.clock.getElapsedTime();this.clientRing.scale.setScalar(1+Math.sin(t*2.7)*.08);this.clientRing.material.opacity=.56+Math.sin(t*2.7)*.14;if(this.state?.jobPhase==='travelling'){const p=(Math.sin(t*1.35)+1)/2;this.van.position.lerpVectors(new THREE.Vector3(-3.3,.15,-2),new THREE.Vector3(7.7,.15,-2.8),p)}this.renderer.render(this.scene,this.camera)}
 destroy(){this.renderer.dispose();this.renderer.domElement.remove()}
}
