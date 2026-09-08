import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const ASSET_ROOT='https://raw.githubusercontent.com/petroulacl/fps-buildings-env-kit/main'
const ASSETS={
 hdri:`${ASSET_ROOT}/environment/skyboxes/polyhaven-hdri/urban_street_01_2k.hdr`,
 asphalt:`${ASSET_ROOT}/environment/ground-textures/ambientcg/Asphalt021_2K-JPG/Asphalt021_2K-JPG_Color.jpg`,
 brick:`${ASSET_ROOT}/environment/ground-textures/ambientcg/Bricks066_2K-JPG/Bricks066_2K-JPG_Color.jpg`,
}

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v))
const smooth=t=>t*t*(3-2*t)

export class BusinessScene{
 constructor(host){
  this.host=host
  this.scene=new THREE.Scene()
  this.clock=new THREE.Clock()
  this.state=null
  this.travelStartedAt=0
  this.basePos=new THREE.Vector3(-6.8,.3,-3.2)
  this.clientPos=new THREE.Vector3(7.7,.3,-4.9)
  this.build()
 }

 build(){
  this.scene.background=new THREE.Color(0xbfcfcb)
  this.scene.fog=new THREE.Fog(0xc8d4d0,38,76)
  this.camera=new THREE.PerspectiveCamera(40,1,.1,120)
  this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})
  this.renderer.setPixelRatio(Math.min(2,devicePixelRatio))
  this.renderer.shadowMap.enabled=true
  this.renderer.shadowMap.type=THREE.PCFSoftShadowMap
  this.renderer.outputColorSpace=THREE.SRGBColorSpace
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping
  this.renderer.toneMappingExposure=.92
  this.renderer.domElement.className='business-canvas'
  this.host.appendChild(this.renderer.domElement)

  this.textureLoader=new THREE.TextureLoader()
  this.textures={
   asphalt:this.loadTexture(ASSETS.asphalt,5.5,5.5),
   brick:this.loadTexture(ASSETS.brick,2.6,2.2),
  }
  this.loadEnvironment()

  this.scene.add(new THREE.HemisphereLight(0xeaf4f2,0x53645d,1.45))
  const sun=new THREE.DirectionalLight(0xfff1da,3.15)
  sun.position.set(-14,24,16)
  sun.castShadow=true
  sun.shadow.mapSize.set(2048,2048)
  sun.shadow.bias=-.00025
  Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:.5,far:70})
  this.scene.add(sun)

  this.world=new THREE.Group()
  this.world.scale.setScalar(.84)
  this.scene.add(this.world)
  this.createGround()
  this.createRoads()
  this.createBuildings()
  this.createStreetLife()
  this.createVan()
  this.createMarkers()
  this.resize()
  addEventListener('resize',()=>this.resize())
  this.animate()
 }

 loadTexture(url,rx=1,ry=1){
  const t=this.textureLoader.load(url)
  t.wrapS=t.wrapT=THREE.RepeatWrapping
  t.repeat.set(rx,ry)
  t.colorSpace=THREE.SRGBColorSpace
  t.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy())
  return t
 }

 loadEnvironment(){
  new RGBELoader().load(ASSETS.hdri,texture=>{
   texture.mapping=THREE.EquirectangularReflectionMapping
   this.scene.environment=texture
   this.scene.background=texture
   this.scene.backgroundBlurriness=.3
   this.scene.backgroundIntensity=.72
  },undefined,()=>{})
 }

 mat(color,rough=.7,metal=.02,map=null){
  return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,map})
 }

 addBox(w,h,d,material,x,y,z,{cast=true,receive=true,radius=0}={}){
  const geometry=radius?new RoundedBoxGeometry(w,h,d,4,radius):new THREE.BoxGeometry(w,h,d)
  const mesh=new THREE.Mesh(geometry,material)
  mesh.position.set(x,y,z)
  mesh.castShadow=cast
  mesh.receiveShadow=receive
  this.world.add(mesh)
  return mesh
 }

 addPlane(w,h,material,x,y,z,rx=-Math.PI/2,ry=0){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material)
  mesh.position.set(x,y,z)
  mesh.rotation.set(rx,ry,0)
  mesh.receiveShadow=true
  this.world.add(mesh)
  return mesh
 }

 createGround(){
  const grass=this.mat(0xaebfae,.96)
  this.addPlane(48,42,grass,0,-.02,0)
  const verge=this.mat(0xc9d1c4,.94)
  this.addPlane(32,18,verge,-2,.005,-6.2)
 }

 createRoads(){
  const asphalt=this.mat(0xffffff,.94,.01,this.textures.asphalt)
  const concrete=this.mat(0xd9dad4,.9)
  const curb=this.mat(0xb9bbb5,.82)
  const paint=this.mat(0xece8dc,.74)

  this.addPlane(46,6.4,asphalt,0,.03,2.2)
  this.addPlane(6.2,31,asphalt,2.8,.035,-5.4)
  this.addPlane(46,1.35,concrete,0,.055,-1.72)
  this.addPlane(46,1.35,concrete,0,.055,6.12)
  this.addPlane(1.32,31,concrete,-.98,.06,-5.4)
  this.addPlane(1.32,31,concrete,6.6,.06,-5.4)

  this.addBox(46,.18,.15,curb,0,.09,-1.06,{cast:false})
  this.addBox(46,.18,.15,curb,0,.09,5.46,{cast:false})
  this.addBox(.15,.18,31,curb,-.32,.09,-5.4,{cast:false})
  this.addBox(.15,.18,31,curb,5.94,.09,-5.4,{cast:false})

  for(let x=-19;x<20;x+=4.4)this.addPlane(2.15,.11,paint,x,.065,2.2)
  for(let z=-17;z<8;z+=4.4)this.addPlane(.11,2.15,paint,2.8,.07,z)
  for(let i=0;i<6;i++)this.addPlane(.28,3.6,paint,-.15+i*.66,.072,2.2)
  for(let i=0;i<6;i++)this.addPlane(3.6,.28,paint,2.8,.072,-1.25-i*.66)

  const bay=this.mat(0xf1eee3,.82)
  for(const [x,z] of[[-11,-.9],[-7,-.9],[10,5.15],[14,5.15]]){
   const g=new THREE.Group()
   const a=new THREE.Mesh(new THREE.BoxGeometry(2.8,.035,.055),bay)
   const b=a.clone();b.position.z=1.1
   const c=new THREE.Mesh(new THREE.BoxGeometry(.055,.035,1.1),bay);c.position.set(-1.4,0,.55)
   const d=c.clone();d.position.x=1.4
   g.add(a,b,c,d);g.position.set(x,.08,z);this.world.add(g)
  }
 }

 createBuildings(){
  this.createAchuBase()
  this.createClientHouse()
  this.createTerrace(-13.2,-13.4,5.4,4.8,5.3,0xc8beb2)
  this.createTerrace(-6.9,-13.5,5.5,4.8,6.1,0x8e7567)
  this.createTerrace(-.4,-13.5,5.6,4.8,5.6,0xd8d0c4)
  this.createOffice(-15.7,-6.8)
 }

 createAchuBase(){
  const wall=this.mat(0xe2e4df,.72)
  const dark=this.mat(0x203c35,.46,.16)
  const glass=this.mat(0x6f9b9a,.18,.26)
  const metal=this.mat(0x8d9690,.43,.35)
  const base=this.addBox(7.1,3.55,4.9,wall,-8.1,1.78,-5.5,{radius:.1})
  base.castShadow=true
  const roof=this.addBox(7.4,.25,5.2,dark,-8.1,3.65,-5.5,{radius:.08})
  roof.castShadow=true

  this.addBox(3.05,2.35,.12,metal,-9.35,1.23,-2.99,{radius:.04})
  for(let y=.3;y<2.2;y+=.28)this.addBox(2.82,.025,.035,dark,-9.35,y,-2.91,{cast:false})
  this.addBox(1.12,2.18,.12,glass,-6.05,1.12,-2.98,{radius:.04})
  this.addBox(1.25,.09,.14,dark,-6.05,2.24,-2.9,{cast:false})
  this.addWindow(-7.45,1.45,-2.96,1.25,1.05)
  this.addSign('ACHU',-8.05,2.88,-2.91,2.7,.72)

  this.addBox(.92,.35,.82,dark,-9.55,3.95,-5.8,{radius:.07})
  this.addBox(.82,.3,.72,dark,-7.7,3.93,-5.2,{radius:.07})

  const yard=this.mat(0xc8c9c2,.93)
  this.addPlane(8.7,3.35,yard,-8.1,.045,-1.75)
  for(const x of[-11.5,-10.95])this.addBox(.42,.92,.45,dark,x,.48,-1.25,{radius:.05})
 }

 createClientHouse(){
  const brick=this.mat(0xffffff,.82,0,this.textures.brick)
  const trim=this.mat(0xeee9df,.72)
  const roofMat=this.mat(0x4e5552,.9,.02)
  const glass=this.mat(0x698d92,.16,.25)

  this.addBox(6.2,4.45,4.9,brick,8.6,2.22,-6.9,{radius:.04})
  const roof=this.gableRoof(6.7,5.35,2.0,roofMat)
  roof.position.set(8.6,4.45,-6.9);roof.castShadow=true;roof.receiveShadow=true;this.world.add(roof)

  this.addBox(1.2,2.25,.12,glass,8.72,1.13,-4.4,{radius:.04})
  this.addBox(1.42,.12,.18,trim,8.72,2.28,-4.31,{cast:false})
  this.addWindow(6.75,1.3,-4.38,1.28,1.22,trim,glass)
  this.addWindow(10.45,1.3,-4.38,1.28,1.22,trim,glass)
  this.addWindow(6.75,3.2,-4.38,1.28,1.1,trim,glass)
  this.addWindow(10.45,3.2,-4.38,1.28,1.1,trim,glass)

  this.addBox(1.75,1.65,.75,trim,10.05,.88,-3.98,{radius:.04})
  this.addWindow(10.05,1.08,-3.58,1.34,.92,trim,glass)

  const path=this.mat(0xc8c7c0,.9)
  this.addPlane(2.0,3.4,path,8.72,.05,-2.72)
  const hedge=this.mat(0x2f654b,.88)
  for(const x of[6.05,6.75,10.7,11.25])this.addBox(.65,.75,.68,hedge,x,.42,-3.15,{radius:.22})
 }

 createTerrace(x,z,w,d,h,color){
  const wall=this.mat(color,.82)
  const trim=this.mat(0xe3e1d8,.78)
  const glass=this.mat(0x6a8689,.18,.22)
  const roofMat=this.mat(0x5f6460,.9)
  this.addBox(w,h,d,wall,x,h/2,z,{radius:.03})
  const roof=this.gableRoof(w+.45,d+.3,1.45,roofMat)
  roof.position.set(x,h,z);roof.castShadow=true;this.world.add(roof)
  for(const yy of[1.25,3.0])for(const xx of[-1.35,1.35])this.addWindow(x+xx,yy,z+d/2+.02,.92,.82,trim,glass)
  this.addBox(.95,2,.1,this.mat(0x38413d,.55,.12),x,1,z+d/2+.055,{radius:.03})
 }

 createOffice(x,z){
  const stone=this.mat(0xb5b8b3,.72)
  const dark=this.mat(0x2a3835,.48,.12)
  const glass=this.mat(0x55777a,.15,.32)
  this.addBox(6.8,5.6,5.4,stone,x,2.8,z,{radius:.08})
  this.addBox(7.05,.35,5.65,dark,x,5.68,z,{radius:.06})
  for(const y of[1.35,3.05,4.65])for(const xx of[-2.1,0,2.1])this.addWindow(x+xx,y,z+2.73,1.25,.82,dark,glass)
 }

 addWindow(x,y,z,w,h,frame=this.mat(0xeee9df,.7),glass=this.mat(0x648a8d,.18,.28)){
  this.addBox(w+.13,h+.13,.09,frame,x,y,z,{cast:false,radius:.025})
  this.addBox(w,h,.105,glass,x,y,z+.055,{cast:false,radius:.02})
 }

 addSign(text,x,y,z,w,h){
  const c=document.createElement('canvas');c.width=512;c.height=160
  const ctx=c.getContext('2d')
  ctx.fillStyle='#173f35';ctx.fillRect(0,0,c.width,c.height)
  ctx.font='800 72px system-ui, sans-serif';ctx.fillStyle='#f7f5ef';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,82)
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}))
  mesh.position.set(x,y,z);this.world.add(mesh)
 }

 gableRoof(w,d,h,material){
  const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,h);shape.closePath()
  const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,steps:1})
  geo.translate(0,0,-d/2)
  return new THREE.Mesh(geo,material)
 }

 createStreetLife(){
  const trunk=this.mat(0x705743,.9)
  const leaf=this.mat(0x3f775f,.86)
  const metal=this.mat(0x343f3d,.42,.35)
  const positions=[[-12,-.1],[-5,-.15],[8,-.2],[14,5.2],[-11,6.7],[-3,6.8],[6.8,6.75]]
  positions.forEach(([x,z],i)=>{
   this.addBox(.16,1.55,.16,trunk,x,.78,z,{radius:.05})
   const crown=new THREE.Mesh(new THREE.SphereGeometry(.74+i%2*.08,18,14),leaf)
   crown.scale.set(1,1.3,1);crown.position.set(x,2.05,z);crown.castShadow=true;this.world.add(crown)
  })
  for(const [x,z] of[[-13,4.8],[-6,4.8],[8,4.8],[13,4.8],[-.65,-5.5],[6.25,-9.2]])this.streetLight(x,z,metal)
  this.parkedCar(-11.1,-.62,0x65747a)
  this.parkedCar(-6.8,-.62,0x8d6d63)
  this.parkedCar(11.4,5.18,0x293d4d)
 }

 streetLight(x,z,material){
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.05,.065,2.9,12),material);pole.position.set(x,1.45,z);pole.castShadow=true;this.world.add(pole)
  this.addBox(.72,.07,.07,material,x+.32,2.84,z,{cast:false,radius:.02})
  this.addBox(.28,.11,.22,this.mat(0xe5d2a0,.36,.15),x+.66,2.78,z,{cast:false,radius:.03})
 }

 parkedCar(x,z,color){
  const car=new THREE.Group()
  const bodyMat=this.mat(color,.32,.22),glass=this.mat(0x4b6d74,.12,.35),rubber=this.mat(0x171b1a,.92)
  const lower=new THREE.Mesh(new RoundedBoxGeometry(2.2,.58,1.12,4,.15),bodyMat);lower.position.y=.43;lower.castShadow=true;car.add(lower)
  const cabin=new THREE.Mesh(new RoundedBoxGeometry(1.15,.52,1.02,4,.16),glass);cabin.position.set(.05,.82,0);car.add(cabin)
  for(const xx of[-.72,.72])for(const zz of[-.55,.55]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.16,20),rubber);wheel.rotation.x=Math.PI/2;wheel.position.set(xx,.28,zz);car.add(wheel)}
  car.position.set(x,.08,z);this.world.add(car)
 }

 createVan(){
  this.van=new THREE.Group()
  const white=this.mat(0xf1f2ed,.28,.16),brand=this.mat(0x23866d,.28,.2),glass=this.mat(0x4d7379,.12,.36),rubber=this.mat(0x161a19,.94),metal=this.mat(0x9ca3a0,.34,.25)
  const body=new THREE.Mesh(new RoundedBoxGeometry(2.95,1.46,1.55,5,.22),white);body.position.set(-.15,.92,0);body.castShadow=true;this.van.add(body)
  const cab=new THREE.Mesh(new RoundedBoxGeometry(1.3,1.22,1.48,5,.2),white);cab.position.set(1.35,.76,0);cab.castShadow=true;this.van.add(cab)
  const wind=new THREE.Mesh(new THREE.BoxGeometry(.05,.68,1.08),glass);wind.position.set(2.02,1.02,0);wind.rotation.z=-.08;this.van.add(wind)
  const side=new THREE.Mesh(new RoundedBoxGeometry(1.7,.48,.045,3,.03),brand);side.position.set(-.45,.94,-.79);this.van.add(side)
  const logo=new THREE.Mesh(new RoundedBoxGeometry(.58,.58,.05,3,.08),brand);logo.position.set(-1.23,1.03,-.8);this.van.add(logo)
  for(const xx of[-.96,1.15])for(const zz of[-.77,.77]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.2,24),rubber);wheel.rotation.x=Math.PI/2;wheel.position.set(xx,.42,zz);this.van.add(wheel);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.205,20),metal);hub.rotation.x=Math.PI/2;hub.position.set(xx,.42,zz);this.van.add(hub)}
  this.van.position.copy(this.basePos);this.van.rotation.y=-.14;this.world.add(this.van)
 }

 createMarkers(){
  const ringMat=new THREE.MeshBasicMaterial({color:0x2f9f7d,transparent:true,opacity:.67,side:THREE.DoubleSide,depthWrite:false})
  this.clientRing=new THREE.Mesh(new THREE.RingGeometry(.72,.95,64),ringMat)
  this.clientRing.rotation.x=-Math.PI/2;this.clientRing.position.set(8.72,.12,-2.65);this.world.add(this.clientRing)
  const points=[this.basePos.clone().setY(.12),new THREE.Vector3(-2,.12,.15),new THREE.Vector3(2.8,.12,2.2),new THREE.Vector3(5.4,.12,-.8),this.clientPos.clone().setY(.12)]
  const curve=new THREE.CatmullRomCurve3(points)
  const routeMat=new THREE.MeshBasicMaterial({color:0x31a980,transparent:true,opacity:.5,depthWrite:false})
  this.route=new THREE.Mesh(new THREE.TubeGeometry(curve,70,.055,8,false),routeMat)
  this.route.visible=false;this.world.add(this.route)
 }

 update(state){
  const wasTravelling=this.state?.jobPhase==='travelling'
  this.state=state
  const active=['scheduled','travelling','arrived','finishing'].includes(state.jobPhase)
  this.route.visible=active
  this.clientRing.material.color.setHex(state.jobPhase==='finished'?0xd8a746:0x2f9f7d)
  if(state.jobPhase==='travelling'&&!wasTravelling)this.travelStartedAt=performance.now()
  if(['arrived','finishing','finished'].includes(state.jobPhase))this.van.position.copy(this.clientPos)
  else if(state.jobPhase!=='travelling')this.van.position.copy(this.basePos)
 }

 resize(){
  const w=this.host.clientWidth||innerWidth,h=this.host.clientHeight||innerHeight,aspect=w/h
  this.camera.aspect=aspect
  if(aspect<.7){
   this.camera.fov=40
   this.camera.position.set(10.5,13.5,29.5)
   this.camera.lookAt(0,1,-4)
  }else{
   this.camera.fov=36
   this.camera.position.set(16,13,25)
   this.camera.lookAt(0,.9,-3.2)
  }
  this.camera.updateProjectionMatrix()
  this.renderer.setSize(w,h,false)
 }

 animate(){
  requestAnimationFrame(()=>this.animate())
  const t=this.clock.getElapsedTime()
  this.clientRing.scale.setScalar(1+Math.sin(t*2.4)*.06)
  this.clientRing.material.opacity=.52+Math.sin(t*2.4)*.11
  if(this.state?.jobPhase==='travelling'){
   const elapsed=performance.now()-this.travelStartedAt
   const p=smooth(clamp(elapsed/850,0,1))
   this.van.position.lerpVectors(this.basePos,this.clientPos,p)
  }
  this.renderer.render(this.scene,this.camera)
 }

 destroy(){
  this.renderer.dispose()
  this.renderer.domElement.remove()
 }
}
