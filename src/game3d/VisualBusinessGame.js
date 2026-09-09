import * as THREE from 'three'
import { Business4XGame } from './Business4XGame.js'
import { StoryMissionUI } from './StoryMissionUI.js'
import { CAMPUS_WALK_ROUTES,decorateCampus,animateCampusTraffic } from './cityLifeV5.js'
import { WorldClarityOverlay,WORLD_VISUAL_SCALE } from './worldClarityV5.js'

function simpleWorker(color=0x3da982){
 const g=new THREE.Group(),skin=new THREE.MeshStandardMaterial({color:0xd8a17e,roughness:.8}),shirt=new THREE.MeshStandardMaterial({color,roughness:.72}),dark=new THREE.MeshStandardMaterial({color:0x263238,roughness:.92})
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.15,.34,5,8),shirt);body.position.y=.62;g.add(body)
 const head=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),skin);head.position.y=1.03;g.add(head)
 for(const x of[-.09,.09]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.28,4,7),dark);leg.position.set(x,.24,0);g.add(leg)}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g
}
function fitHeight(view,target=.88){view.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(view),h=Math.max(.01,b.max.y-b.min.y),s=target/h;view.scale.multiplyScalar(s);view.updateMatrixWorld(true);const after=new THREE.Box3().setFromObject(view);return Number.isFinite(after.min.y)?-after.min.y:0}
function tintLightMaterials(root){
 const target=new THREE.Color(0x71867c)
 root?.traverse(o=>{
  if(!o.isMesh)return
  const mats=Array.isArray(o.material)?o.material:[o.material]
  for(const m of mats){
   if(!m?.color||m.userData?.achuTinted)continue
   const c=m.color
   if(c.r>.56&&c.g>.56&&c.b>.53)c.lerp(target,.28)
   m.userData={...(m.userData??{}),achuTinted:true};m.needsUpdate=true
  }
 })
}

export class VisualBusinessGame extends Business4XGame{
 constructor(mount){super(mount);this.cityTraffic=[];this.worldOverlay=null;this.visualSyncAt=0;this.vehicleMotion=new WeakMap()}
 async start(){
  await super.start()
  this.ui?.root?.remove();this.ui=new StoryMissionUI(this)
  this.cityTraffic=decorateCampus(this.city,this.assets)
  this.world.scale.setScalar(WORLD_VISUAL_SCALE)
  this.worldOverlay=new WorldClarityOverlay(this.state);this.worldOverlay.visible=this.mode==='world';this.scene.add(this.worldOverlay)
  this.scene.background.setHex(0x506b61);if(this.scene.fog){this.scene.fog.color.setHex(0x506b61);this.scene.fog.density=.0055}
  tintLightMaterials(this.city);tintLightMaterials(this.world)
  if(this.mode==='world')this.focusWorldObjective(false)
  this.resize();this.ui.refresh();this.ui.maybeStartStory?.();return this
 }
 addWorkers(){
  this.workers=[];this.workerAnimAt=performance.now();if(!this.city)return
  const accents=[0x3da982,0x4f91c7,0xd19b4f,0x8d78bd,0x3da982,0x4f91c7,0xd46f78,0x66a87c,0x7c8fd0],clip=this.assets?.characterClip?.('walk')
  for(let i=0;i<9;i++){
   const view=this.assets?.cloneCharacter?.()||simpleWorker(accents[i%accents.length]);view.position.set(0,0,0);const groundOffset=fitHeight(view,.78+(i%3)*.035)
   const curve=CAMPUS_WALK_ROUTES[i%CAMPUS_WALK_ROUTES.length],p=curve.getPointAt((i*.117)%1);view.position.set(p.x,.025+groundOffset,p.z);this.city.add(view)
   let mixer=null;if(view.userData.realCrew&&clip){try{mixer=new THREE.AnimationMixer(view);const action=mixer.clipAction(clip);action.timeScale=.7+(i%4)*.05;action.play()}catch{mixer=null}}
   this.workers.push({view,mixer,curve,offset:(i*.117)%1,speed:.0000105+(i%5)*.0000012,groundOffset,facingOffset:view.userData.realCrew?Math.PI:0})
  }
 }
 animateWorkers(t){
  const dt=Math.min(.05,Math.max(0,(t-(this.workerAnimAt||t))/1000));this.workerAnimAt=t
  for(const w of(this.workers??[])){
   w.mixer?.update(dt);const u=(w.offset+t*w.speed)%1,p=w.curve.getPointAt(u),tan=w.curve.getTangentAt(u).normalize()
   w.view.position.set(p.x,.025+w.groundOffset,p.z)
   w.view.rotation.y=Math.atan2(tan.x,tan.z)+w.facingOffset
  }
  animateCampusTraffic(this.cityTraffic,t);this.worldOverlay?.animate(t)
 }
 correctWorldVehicleFacing(){
  const views=[...(this.world?.traffic??[]).map(t=>t.view),...(this.world?.marchObjects?.values?.()??[])]
  for(const view of views){
   if(!view)continue
   const prev=this.vehicleMotion.get(view),now={x:view.position.x,z:view.position.z}
   if(prev){const dx=now.x-prev.x,dz=now.z-prev.z;if(Math.hypot(dx,dz)>.0005)view.rotation.y=Math.atan2(-dz,dx)}
   this.vehicleMotion.set(view,now)
  }
 }
 resize(){
  const w=innerWidth,h=innerHeight,aspect=w/h,view=this.mode==='world'?13.2:12.1;this.camera.left=-view*aspect;this.camera.right=view*aspect;this.camera.top=view;this.camera.bottom=-view;this.camera.updateProjectionMatrix();this.renderer?.setSize(w,h,false)
 }
 setMode(mode){
  const ok=super.setMode(mode);if(ok===false)return false
  if(this.worldOverlay)this.worldOverlay.visible=mode==='world'
  if(mode==='world')this.focusWorldObjective(true)
  return true
 }
 focusWorldObjective(announce=true){
  if(!this.worldOverlay)return;this.worldOverlay.sync(this.state);const p=this.worldOverlay.objectivePoint();this.controls.target.copy(p);this.camera.position.set(p.x+11.5,16.5,p.z+11.5);this.camera.lookAt(p);this.camera.zoom=1;this.camera.updateProjectionMatrix();if(announce)this.ui?.toast('Follow the gold NEXT marker')
 }
 focusBuilding(id){super.focusBuilding(id);this.camera.position.y=14.5;this.camera.updateProjectionMatrix()}
 rebuildCity(){super.rebuildCity();this.cityTraffic=decorateCampus(this.city,this.assets);tintLightMaterials(this.city)}
 update(){
  super.update();this.correctWorldVehicleFacing()
  const now=performance.now();if(this.worldOverlay&&now-this.visualSyncAt>500){this.visualSyncAt=now;this.worldOverlay.sync(this.state);tintLightMaterials(this.world)}
 }
}
