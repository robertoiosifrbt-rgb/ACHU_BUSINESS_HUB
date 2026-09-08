import * as THREE from 'three'
import { Retro4XGame } from './Retro4XGame.js'
import { buildCity4X,buildingPosition4X } from './cityFactory4x.js'
import { World3D4X } from './worldFactory4x.js'
import { GameUI4X } from './ui4x.js'
import { GameAudio } from './audio.js'

function fallbackCrew(accent=0x42b98e){
 const g=new THREE.Group(),skin=new THREE.MeshStandardMaterial({color:0xd9a47f,roughness:.76}),shirt=new THREE.MeshStandardMaterial({color:accent,roughness:.68}),dark=new THREE.MeshStandardMaterial({color:0x22312e,roughness:.88}),hair=new THREE.MeshStandardMaterial({color:0x362b27,roughness:.9})
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.18,.44,6,12),shirt);torso.position.y=.92;g.add(torso)
 const head=new THREE.Mesh(new THREE.SphereGeometry(.17,18,14),skin);head.position.y=1.43;g.add(head)
 const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.174,16,10,0,Math.PI*2,0,Math.PI*.46),hair);hairCap.position.y=1.49;g.add(hairCap)
 for(const x of[-.12,.12]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.055,.36,4,8),dark);leg.position.set(x,.38,0);g.add(leg);const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.045,.32,4,8),skin);arm.position.set(x<0?-.25:.25,.9,0);arm.rotation.z=x<0?-.16:.16;g.add(arm)}
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});return g
}

export class Business4XGame extends Retro4XGame{
 constructor(mount){super(mount);this.mode='world';this.audio=new GameAudio();this.workerAnimAt=0}
 async start(){
  await super.start()
  this.ui?.root?.remove()
  this.city?.removeFromParent();this.world?.removeFromParent()
  this.city=buildCity4X(this.assets,this.state)
  this.world=new World3D4X(this.assets,this.state)
  this.scene.add(this.city,this.world)
  this.city.visible=false;this.world.visible=true
  this.mode='world'
  this.addWorkers()
  this.ui=new GameUI4X(this)
  this.scene.background.setHex(0xc4d2cc)
  if(this.scene.fog){this.scene.fog.color.setHex(0xc4d2cc);this.scene.fog.density=.009}
  this.controls.target.set(0,0,0);this.camera.position.set(19,26,19);this.camera.zoom=1;this.resize();this.ui.refresh()
  window.addEventListener('pointerdown',()=>this.audio.unlock(),{once:true,capture:true})
  return this
 }
 addWorkers(){
  this.workers=[];this.workerAnimAt=performance.now()
  if(!this.city)return
  const spots=[[-4.6,2.4,.15],[-2.2,3.3,1.2],[1.2,2.7,2.1],[4.2,2.1,2.9],[-3.4,5.2,.7],[2.7,5.1,2.45]],clip=this.assets?.characterClip?.('walk')
  spots.forEach(([x,z,phase],i)=>{
   const view=this.assets?.cloneCharacter?.()||fallbackCrew([0x3da982,0x4f91c7,0xd19b4f,0x9b79c8][i%4])
   view.position.set(x,.02,z);view.rotation.y=(i%3)*1.25;this.city.add(view)
   let mixer=null
   if(view.userData.realCrew&&clip){mixer=new THREE.AnimationMixer(view);const action=mixer.clipAction(clip);action.timeScale=.72+(i%3)*.06;action.play();mixer.update(i*.11)}
   this.workers.push({view,mixer,phase,baseX:x,baseZ:z})
  })
 }
 animateWorkers(t){
  const dt=Math.min(.05,Math.max(0,(t-(this.workerAnimAt||t))/1000));this.workerAnimAt=t
  for(const [i,w] of(this.workers??[]).entries()){
   w.mixer?.update(dt)
   const a=t*.00016+w.phase,x=Math.sin(a*5+i)*.68,z=Math.cos(a*4.4+i)*.48
   w.view.position.x=w.baseX+x;w.view.position.z=w.baseZ+z
   w.view.rotation.y=Math.atan2(Math.cos(a*5+i)*.68,-Math.sin(a*4.4+i)*.48)
  }
 }
 setMode(mode){
  this.mode=mode
  this.city.visible=mode==='city';this.world.visible=mode==='world'
  this.controls.target.set(0,0,0)
  this.camera.position.set(mode==='world'?19:17,mode==='world'?26:21,mode==='world'?19:17)
  this.camera.zoom=1;this.camera.updateProjectionMatrix();this.resize();this.ui?.hideSheet();this.ui?.refresh()
 }
 resize(){
  const w=innerWidth,h=innerHeight,aspect=w/h,view=this.mode==='world'?16.4:12.6
  this.camera.left=-view*aspect;this.camera.right=view*aspect;this.camera.top=view;this.camera.bottom=-view;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false)
 }
 focusBuilding(id){
  this.setMode('city');const p=buildingPosition4X(id);this.controls.target.copy(p);this.camera.position.set(p.x+11,15,p.z+11);this.ui?.toast(`${id==='furnace'?'Headquarters':'Division'} selected`)
 }
 rebuildCity(){
  this.city?.removeFromParent();this.city=buildCity4X(this.assets,this.state);this.scene.add(this.city);this.city.visible=this.mode==='city';this.addWorkers()
 }
 toggleAudio(){const enabled=this.audio.toggle();this.ui?.toast(enabled?'Sound on':'Sound off');return enabled}
 upgradeBuilding(id){const before=this.state.construction;super.upgradeBuilding(id);if(!before&&this.state.construction)this.audio.build()}
 research(id){const before=this.state.researchJob;super.research(id);if(!before&&this.state.researchJob)this.audio.research()}
 dispatch(type,id,cost={}){const ok=super.dispatch(type,id,cost);if(ok)this.audio.dispatch(type);return ok}
 claimChapter(chapter){const before=chapter&&this.state.claimedChapters?.[chapter.id];super.claimChapter(chapter);if(chapter&&!before&&this.state.claimedChapters?.[chapter.id])this.audio.success()}
 trainTroops(type){const before=this.state.world.trainingJob;super.trainTroops(type);if(!before&&this.state.world.trainingJob)this.audio.build()}
 finishOutbound(m,now){
  const type=m.type;super.finishOutbound(m,now)
  if(type==='attack'){const win=this.state.world.battleReports?.[0]?.win;win?this.audio.success():this.audio.fail()}
  else if(type==='scout'||type==='claim')this.audio.success()
 }
}
