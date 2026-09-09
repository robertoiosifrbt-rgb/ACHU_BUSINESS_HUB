import * as THREE from 'three'
import { Business4XGame } from './Business4XGame.js'
import { StoryMissionUI } from './StoryMissionUI.js'
import { buildBaseV12,baseBuildingPositionV12,BASE_WALK_ROUTES,animateBaseTrafficV12 } from './baseCampusV12.js'
import { WorldClarityOverlay,WORLD_VISUAL_SCALE } from './worldClarityV12.js'
import { WorldCityV12 } from './worldCityV12.js'
import { BUILDINGS } from '../data/buildings.js'

function simpleWorker(color=0x3da982){
 const g=new THREE.Group(),skin=new THREE.MeshStandardMaterial({color:0xd8a17e,roughness:.8}),shirt=new THREE.MeshStandardMaterial({color,roughness:.72}),dark=new THREE.MeshStandardMaterial({color:0x263238,roughness:.92})
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.15,.34,5,8),shirt);body.position.y=.62;g.add(body)
 const head=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),skin);head.position.y=1.03;g.add(head)
 for(const x of[-.09,.09]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.28,4,7),dark);leg.position.set(x,.24,0);g.add(leg)}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true});return g
}
function fitHeight(view,target=.62){view.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(view),h=Math.max(.01,b.max.y-b.min.y),s=target/h;view.scale.multiplyScalar(s);view.updateMatrixWorld(true);const after=new THREE.Box3().setFromObject(view);return Number.isFinite(after.min.y)?-after.min.y:0}
function tintLightMaterials(root){
 const target=new THREE.Color(0x70847a)
 root?.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!m?.color||m.userData?.achuTinted)continue;const c=m.color;if(c.r>.62&&c.g>.62&&c.b>.58)c.lerp(target,.12);m.userData={...(m.userData??{}),achuTinted:true};m.needsUpdate=true}})
}
export class VisualBusinessGame extends Business4XGame{
 constructor(mount){super(mount);this.cityTraffic=[];this.worldOverlay=null;this.visualSyncAt=0}
 async start(){
  await super.start()
  this.ui?.root?.remove();this.city?.removeFromParent();this.world?.removeFromParent()
  this.city=buildBaseV12(this.assets,this.state);this.cityTraffic=this.city.userData.traffic??[];this.city.visible=this.mode==='city';this.scene.add(this.city);this.addWorkers()
  this.world=new WorldCityV12(this.assets,this.state);this.world.visible=this.mode==='world';this.world.scale.setScalar(WORLD_VISUAL_SCALE);this.scene.add(this.world)
  this.worldOverlay=new WorldClarityOverlay(this.state);this.worldOverlay.visible=this.mode==='world';this.scene.add(this.worldOverlay)
  this.ui=new StoryMissionUI(this)
  this.scene.background.setHex(0x4d675b)
  if(this.scene.fog){this.scene.fog.color.setHex(0x4d675b);this.scene.fog.density=.0032}
  tintLightMaterials(this.city);tintLightMaterials(this.world)
  if(this.mode==='world')this.focusWorldObjective(false)
  this.resize();this.ui.refresh();this.ui.maybeStartStory?.();return this
 }
 addWorkers(){
  this.workers=[];this.workerAnimAt=performance.now();if(!this.city)return
  const accents=[0x3da982,0x4f91c7,0xd19b4f,0x8d78bd,0xd46f78,0x66a87c,0x7c8fd0,0x3da982,0x4f91c7,0xd19b4f],clip=this.assets?.characterClip?.('walk')
  for(let i=0;i<12;i++){
   const view=this.assets?.cloneCharacter?.()||simpleWorker(accents[i%accents.length]);view.position.set(0,0,0);const groundOffset=fitHeight(view,.56+(i%3)*.018)
   const route=BASE_WALK_ROUTES[i%BASE_WALK_ROUTES.length],p=route.getPointAt((i*.083)%1);view.position.set(p.x,.025+groundOffset,p.z);this.city.add(view)
   let mixer=null;if(view.userData.realCrew&&clip){try{mixer=new THREE.AnimationMixer(view);const action=mixer.clipAction(clip);action.timeScale=.74+(i%4)*.05;action.play()}catch{mixer=null}}
   this.workers.push({view,mixer,curve:route,offset:(i*.083)%1,speed:.000016+(i%5)*.0000013,groundOffset,facingOffset:Math.PI})
  }
 }
 animateWorkers(t){
  const dt=Math.min(.05,Math.max(0,(t-(this.workerAnimAt||t))/1000));this.workerAnimAt=t
  for(const w of(this.workers??[])){w.mixer?.update(dt);const raw=(w.offset+t*w.speed)%2,u=raw<=1?raw:2-raw,dir=raw<=1?1:-1,p=w.curve.getPointAt(u),tan=w.curve.getTangentAt(u).normalize().multiplyScalar(dir);w.view.position.set(p.x,.025+w.groundOffset,p.z);w.view.rotation.y=Math.atan2(tan.x,tan.z)+w.facingOffset}
  animateBaseTrafficV12(this.cityTraffic,t);this.worldOverlay?.animate(t)
 }
 resize(){
  const w=innerWidth,h=innerHeight,aspect=w/h,view=this.mode==='world'?10.8:10.6
  this.camera.left=-view*aspect;this.camera.right=view*aspect;this.camera.top=view;this.camera.bottom=-view;this.camera.updateProjectionMatrix();this.renderer?.setSize(w,h,false)
 }
 setMode(mode){const ok=super.setMode(mode);if(ok===false)return false;if(this.worldOverlay)this.worldOverlay.visible=mode==='world';if(mode==='world')this.focusWorldObjective(true);this.resize();return true}
 focusWorldObjective(announce=true){if(!this.worldOverlay)return;this.worldOverlay.sync(this.state);const p=this.worldOverlay.objectivePoint();this.controls.target.copy(p);this.camera.position.set(p.x+10.2,15.5,p.z+10.2);this.camera.lookAt(p);this.camera.zoom=1;this.camera.updateProjectionMatrix();if(announce)this.ui?.toast('Follow the gold NEXT marker')}
 focusBuilding(id){this.setMode('city');const p=baseBuildingPositionV12(id);this.controls.target.copy(p);this.camera.position.set(p.x+8.9,13.2,p.z+8.9);this.camera.lookAt(p);this.camera.zoom=1.1;this.camera.updateProjectionMatrix();this.ui?.toast(`${id==='furnace'?'Headquarters':BUILDINGS[id]?.name??'Division'} selected`)}
 rebuildCity(){this.city?.removeFromParent();this.city=buildBaseV12(this.assets,this.state);this.cityTraffic=this.city.userData.traffic??[];this.scene.add(this.city);this.city.visible=this.mode==='city';this.addWorkers();tintLightMaterials(this.city)}
 claimEventReward(eventId){super.claimEventReward(eventId);this.ui?.openEvents?.()}
 update(){super.update();const now=performance.now();if(this.worldOverlay&&now-this.visualSyncAt>500){this.visualSyncAt=now;this.worldOverlay.sync(this.state);tintLightMaterials(this.world)}}
}
