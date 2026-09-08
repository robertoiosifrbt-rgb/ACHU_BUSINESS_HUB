import * as THREE from 'three'

const roundedRect=(w,h,r=.18)=>{
 const s=new THREE.Shape(),x=-w/2,y=-h/2
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s
}
const extrude=(w,d,h,material,r=.18)=>{const g=new THREE.ExtrudeGeometry(roundedRect(w,d,r),{depth:h,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.05,bevelThickness:.05});g.rotateX(-Math.PI/2);g.translate(0,h/2,0);return new THREE.Mesh(g,material)}

export class BusinessScene{
 constructor(host){this.host=host;this.scene=new THREE.Scene();this.clock=new THREE.Clock();this.state=null;this.build()}
 build(){
  this.scene.background=new THREE.Color(0xdce8e4);this.scene.fog=new THREE.Fog(0xdce8e4,34,64)
  this.camera=new THREE.PerspectiveCamera(32,1,.1,100);this.camera.position.set(15.5,20.5,22.5);this.camera.lookAt(0,0,-.5)
  this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(2,devicePixelRatio));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;this.renderer.domElement.className='business-canvas';this.host.appendChild(this.renderer.domElement)
  this.scene.add(new THREE.HemisphereLight(0xffffff,0x587067,2.35));const sun=new THREE.DirectionalLight(0xfff0d4,4.4);sun.position.set(-10,20,13);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24});this.scene.add(sun)
  this.world=new THREE.Group();this.scene.add(this.world);this.createGround();this.createRoads();this.createBuildings();this.createStreetLife();this.createVan();this.createMarkers();this.resize();addEventListener('resize',()=>this.resize());this.animate()
 }
 mat(color,rough=.65,metal=.04){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})}
 createGround(){const ground=new THREE.Mesh(new THREE.PlaneGeometry(56,56),this.mat(0xbfd3cb,1));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;this.world.add(ground);const district=new THREE.Mesh(new THREE.CircleGeometry(20,72),this.mat(0xd9e7e0,.96));district.rotation.x=-Math.PI/2;district.position.y=.012;district.scale.set(1.18,.88,1);this.world.add(district)}
 createRoads(){
  const asphalt=this.mat(0x344440,.96),line=this.mat(0xf0e5ba,.84),pave=this.mat(0xe7e9e3,.94)
  for(const [w,d,x,z] of[[46,5.6,0,2.8],[5.6,40,3.5,-2]]){const r=new THREE.Mesh(new THREE.PlaneGeometry(w,d),asphalt);r.rotation.x=-Math.PI/2;r.position.set(x,.035,z);r.receiveShadow=true;this.world.add(r)}
  for(const [w,d,x,z] of[[46,1.2,0,-.6],[46,1.2,0,6.2],[1.2,40,.1,-2],[1.2,40,6.9,-2]]){const s=new THREE.Mesh(new THREE.PlaneGeometry(w,d),pave);s.rotation.x=-Math.PI/2;s.position.set(x,.052,z);s.receiveShadow=true;this.world.add(s)}
  for(let x=-18;x<19;x+=4.3)this.roadMark(2.2,.12,x,2.8,line)
  for(let z=-17;z<16;z+=4.3)this.roadMark(.12,2.2,3.5,z,line)
  for(let i=0;i<7;i++){this.roadMark(.28,3.3,-.1+i*.65,2.8,pave);this.roadMark(3.3,.28,3.5,-.8-i*.65,pave)}
 }
 roadMark(w,d,x,z,mat){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);m.rotation.x=-Math.PI/2;m.position.set(x,.06,z);this.world.add(m)}
 window(x,y,z,w=.76,h=.7,rot=0){const glass=this.mat(0x78a8aa,.18,.24),frame=this.mat(0x263b38,.55,.12);const f=extrude(w+.14,.1,h+.14,frame,.03);f.position.set(x,y,z);f.rotation.y=rot;this.world.add(f);const g=extrude(w,.11,h,glass,.03);g.position.set(x,y,z-(rot?0:.015));g.rotation.y=rot;this.world.add(g)}
 label(text,x,y,z,rot=0){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#173d33';ctx.fillRect(0,0,512,128);ctx.font='800 64px Arial';ctx.fillStyle='#f4f4ef';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,66);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:tex});const p=new THREE.Mesh(new THREE.PlaneGeometry(3.1,.78),m);p.position.set(x,y,z);p.rotation.y=rot;this.world.add(p)}
 createBuildings(){
  const glass=this.mat(0x7faaa7,.22,.2),dark=this.mat(0x233d37,.48,.14),stone=this.mat(0xe9e7df,.82),warm=this.mat(0xc99e79,.72),roof=this.mat(0x687b75,.86)
  this.base=extrude(6.8,5.6,3.45,stone,.42);this.base.position.set(-7.4,0,-4.6);this.base.castShadow=true;this.base.receiveShadow=true;this.world.add(this.base)
  const garage=extrude(2.7,.16,2.15,dark,.05);garage.position.set(-8.85,1.07,-1.76);this.world.add(garage);for(let y=.35;y<1.9;y+=.36){const line=extrude(2.5,.04,.035,stone,.01);line.position.set(-8.85,y,-1.67);this.world.add(line)}
  const door=extrude(1.15,.15,2.15,glass,.06);door.position.set(-5.55,1.07,-1.75);this.world.add(door);this.window(-7.15,1.35,-1.73,1.15,1.15);this.label('ACHU',-7.25,2.74,-1.67)
  for(const x of[-9.6,-7.8,-6]){const ac=extrude(.75,.72,.32,roof,.06);ac.position.set(x,3.62,-4.9);this.world.add(ac)}
  const client=extrude(6.1,4.8,6.1,warm,.3);client.position.set(8.8,0,-7.3);client.castShadow=true;client.receiveShadow=true;this.world.add(client)
  for(let floor=0;floor<3;floor++)for(const x of[7.1,8.8,10.5])this.window(x,1.25+floor*1.48,-4.84,.86,.76)
  for(let floor=0;floor<3;floor++)for(const z of[-8.6,-7.2,-5.8])this.window(11.88,1.25+floor*1.48,z,.8,.72,Math.PI/2)
  const canopy=extrude(2.1,1.1,.22,dark,.08);canopy.position.set(8.8,2.45,-4.65);this.world.add(canopy);const entry=extrude(1.2,.14,2.15,glass,.05);entry.position.set(8.8,1.07,-4.77);this.world.add(entry)
  const blocks=[[-14,8,5.5,5.5,6.6],[11.8,9,6.2,5.5,8.2],[-3,11,7.8,5.2,5.3],[15.5,.4,5.8,5.1,6.2],[-15,-8.5,5.8,5.2,4.9]]
  blocks.forEach(([x,z,w,d,h],i)=>{const b=extrude(w,d,h,i%2?stone:dark,.25);b.position.set(x,0,z);b.castShadow=true;b.receiveShadow=true;this.world.add(b);for(let y=1.2;y<h-.4;y+=1.45)for(let wx=-w/2+1;wx<w/2-.5;wx+=1.4)this.window(x+wx,y,z-d/2-.03,.7,.58)})
 }
 createStreetLife(){
  const trunk=this.mat(0x705842,.9),leafA=this.mat(0x3f7d64,.88),leafB=this.mat(0x6da37c,.86),pave=this.mat(0xe7e9e2,.92),metal=this.mat(0x303b39,.48,.3),bin=this.mat(0x275c4c,.75),skin=this.mat(0xd6a47f,.82)
  const trees=[[-11,-.3],[-3.4,-.3],[8,-.2],[13,-.2],[-10,7.2],[-2,7.5],[8,8.1],[16,7.4]]
  trees.forEach(([x,z],i)=>{const pad=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.17,.13,32),pave);pad.position.set(x,.08,z);pad.receiveShadow=true;this.world.add(pad);const t=new THREE.Mesh(new THREE.CylinderGeometry(.16,.23,1.45,12),trunk);t.position.set(x,.79,z);t.castShadow=true;this.world.add(t);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.82,3),i%2?leafA:leafB);crown.scale.y=1.18;crown.position.set(x,1.98,z);crown.castShadow=true;this.world.add(crown)})
  for(const [x,z] of[[-12,4.9],[-5,4.9],[8,4.9],[14,4.9],[1,-5],[5,-9]])this.streetlight(x,z,metal)
  for(const [x,z] of[[-4.2,-2.1],[7.2,-10.2],[12.7,1.2]])this.parkedCar(x,z)
  for(const [x,z] of[[-5,-1.1],[10.8,-4.2]]){const b=extrude(.58,.52,.8,bin,.07);b.position.set(x,.4,z);b.castShadow=true;this.world.add(b)}
  this.person(-5.7,-.7,0x355b9a,skin);this.person(9.9,-4.15,0x914f4c,skin);this.person(-2.3,5.7,0x5d6f57,skin)
 }
 streetlight(x,z,metal){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,2.8,12),metal);pole.position.set(x,1.4,z);pole.castShadow=true;this.world.add(pole);const arm=new THREE.Mesh(new THREE.BoxGeometry(.75,.07,.07),metal);arm.position.set(x+.34,2.75,z);this.world.add(arm);const lamp=new THREE.Mesh(new THREE.BoxGeometry(.32,.12,.22),this.mat(0xf3dda5,.4,.2));lamp.position.set(x+.67,2.7,z);this.world.add(lamp)}
 parkedCar(x,z){const body=this.mat(0x8096a0,.4,.18),glass=this.mat(0x557a80,.18,.28),rubber=this.mat(0x171c1b,.92);const car=new THREE.Group();const lower=extrude(2.15,1.12,.52,body,.22);lower.position.y=.34;lower.castShadow=true;car.add(lower);const cabin=extrude(1.15,1.02,.48,glass,.18);cabin.position.set(.05,.72,0);car.add(cabin);for(const xx of[-.72,.72])for(const zz of[-.56,.56]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.14,20),rubber);w.rotation.x=Math.PI/2;w.position.set(xx,.24,zz);car.add(w)}car.position.set(x,.1,z);car.rotation.y=z>0?Math.PI:0;this.world.add(car)}
 person(x,z,shirt,skin){const g=new THREE.Group();const legs=new THREE.Mesh(new THREE.BoxGeometry(.3,.75,.25),this.mat(0x263330,.9));legs.position.y=.42;g.add(legs);const torso=extrude(.5,.34,.72,this.mat(shirt,.72),.12);torso.position.y=1.05;g.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.22,20,16),skin);head.position.y=1.62;g.add(head);g.position.set(x,0,z);g.castShadow=true;this.world.add(g)}
 createVan(){
  this.van=new THREE.Group();const white=this.mat(0xf4f5ef,.32,.14),brand=this.mat(0x2d8b70,.32,.18),glass=this.mat(0x527d82,.16,.3),rubber=this.mat(0x171d1b,.92),light=this.mat(0xf6db91,.28,.16)
  const body=extrude(3.05,1.58,1.34,white,.3);body.position.y=.67;body.castShadow=true;this.van.add(body);const cab=extrude(1.18,1.52,1.02,white,.24);cab.position.set(1.48,.55,0);cab.castShadow=true;this.van.add(cab);const wind=extrude(.08,1.12,.62,glass,.04);wind.position.set(2.08,.9,0);this.van.add(wind);const stripe=extrude(1.75,.08,.43,brand,.04);stripe.position.set(-.38,.72,-.82);this.van.add(stripe);const logo=extrude(.62,.08,.62,brand,.08);logo.position.set(-1.12,.82,-.83);this.van.add(logo);for(const x of[-.95,1.15])for(const z of[-.81,.81]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.19,24),rubber);w.rotation.x=Math.PI/2;w.position.set(x,.34,z);this.van.add(w)}for(const z of[-.52,.52]){const l=new THREE.Mesh(new THREE.BoxGeometry(.08,.22,.22),light);l.position.set(2.12,.62,z);this.van.add(l)}this.van.position.set(-3.8,.15,-2.25);this.van.rotation.y=-.12;this.world.add(this.van)
 }
 createMarkers(){const ringMat=new THREE.MeshBasicMaterial({color:0x2f9f7d,transparent:true,opacity:.72,side:THREE.DoubleSide});this.clientRing=new THREE.Mesh(new THREE.RingGeometry(.7,.95,48),ringMat);this.clientRing.rotation.x=-Math.PI/2;this.clientRing.position.set(8.8,.12,-4.32);this.world.add(this.clientRing);this.route=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5,.12,-2),new THREE.Vector3(-1,.12,2.8),new THREE.Vector3(3.5,.12,2.8),new THREE.Vector3(6.2,.12,-1),new THREE.Vector3(8.8,.12,-4.3)]),new THREE.LineDashedMaterial({color:0x36aa83,dashSize:.55,gapSize:.32}));this.route.computeLineDistances();this.route.visible=false;this.world.add(this.route)}
 update(state){this.state=state;const active=['scheduled','travelling','arrived','finishing'].includes(state.jobPhase);this.route.visible=active;this.clientRing.material.color.setHex(state.jobPhase==='finished'?0xe0ae53:0x2f9f7d);const clientPos=new THREE.Vector3(7.2,.15,-3.4),basePos=new THREE.Vector3(-3.8,.15,-2.25);if(['arrived','finishing','finished'].includes(state.jobPhase))this.van.position.copy(clientPos);else if(state.jobPhase!=='travelling')this.van.position.copy(basePos)}
 resize(){const w=this.host.clientWidth||innerWidth,h=this.host.clientHeight||innerHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false)}
 animate(){requestAnimationFrame(()=>this.animate());const t=this.clock.getElapsedTime();this.clientRing.scale.setScalar(1+Math.sin(t*2.7)*.07);this.clientRing.material.opacity=.56+Math.sin(t*2.7)*.14;if(this.state?.jobPhase==='travelling'){const p=(Math.sin(t*1.2)+1)/2;this.van.position.lerpVectors(new THREE.Vector3(-3.8,.15,-2.25),new THREE.Vector3(7.2,.15,-3.4),p)}this.renderer.render(this.scene,this.camera)}
 destroy(){this.renderer.dispose();this.renderer.domElement.remove()}
}
