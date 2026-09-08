import * as THREE from 'three'
import { Retro4XGame } from './Retro4XGame.js'
import { buildCity4X,buildingPosition4X } from './cityFactory4x.js'
import { World3D4X } from './worldFactory4x.js'
import { GameUI4X } from './ui4x.js'
import { GameAudio } from './audio.js'
import { currentChapter } from '../data/chapters.js'

function fallbackCrew(accent=0x42b98e){
 const g=new THREE.Group(),skin=new THREE.MeshStandardMaterial({color:0xd9a47f,roughness:.76}),shirt=new THREE.MeshStandardMaterial({color:accent,roughness:.68}),trousers=new THREE.MeshStandardMaterial({color:0x263b43,roughness:.88}),hair=new THREE.MeshStandardMaterial({color:0x362b27,roughness:.9})
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.2,.5,6,12),shirt);torso.position.y=1.02;g.add(torso)
 const head=new THREE.Mesh(new THREE.SphereGeometry(.17,18,14),skin);head.position.y=1.53;g.add(head)
 const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.174,16,10,0,Math.PI*2,0,Math.PI*.46),hair);hairCap.position.y=1.59;g.add(hairCap)
 for(const x of[-.12,.12]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.06,.42,4,8),trousers);leg.position.set(x,.42,0);g.add(leg);const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.05,.34,4,8),shirt);arm.position.set(x<0?-.27:.27,1.03,0);arm.rotation.z=x<0?-.12:.12;g.add(arm)}
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
  const unlock=()=>this.audio.unlock()
  window.addEventListener('pointerdown',unlock,{capture:true})
  window.addEventListener('touchstart',unlock,{capture:true,passive:true})
  setTimeout(()=>this.ui?.showChapterIfNew?.(),500)
  return this
 }
 addWorkers(){
  this.workers=[];this.workerAnimAt=performance.now()
  if(!this.city)return
  const patrols=[
   {from:[-5.4,2.1],to:[-2.8,2.8],phase:.1,speed:.11,moving:true},
   {from:[-.8,3.4],to:[2.2,3.1],phase:.55,speed:.095,moving:true},
   {from:[3.5,1.8],to:[5.2,3.7],phase:1.1,speed:.105,moving:true},
   {from:[-3.7,5.2],to:[-3.7,5.2],phase:0,speed:0,moving:false},
   {from:[1.6,5.25],to:[1.6,5.25],phase:0,speed:0,moving:false},
   {from:[4.8,5.0],to:[4.8,5.0],phase:0,speed:0,moving:false}
  ]
  const walk=this.assets?.characterClip?.('walk'),idle=this.assets?.characterClip?.('idle')
  patrols.forEach((p,i)=>{
   const view=this.assets?.cloneCharacter?.(i)||fallbackCrew([0x3da982,0x4f91c7,0xd19b4f,0x7d86b8][i%4])
   view.position.set(p.from[0],.02,p.from[1]);this.city.add(view)
   let mixer=null
   const clip=p.moving?walk:idle
   if(view.userData.realCrew&&clip){mixer=new THREE.AnimationMixer(view);const action=mixer.clipAction(clip);action.timeScale=p.moving?.82:1;action.play();mixer.update(i*.07)}
   const dx=p.to[0]-p.from[0],dz=p.to[1]-p.from[1],baseYaw=Math.atan2(dx,dz)
   view.rotation.y=baseYaw
   this.workers.push({view,mixer,...p,baseYaw,lastDirection:1})
  })
 }
 animateWorkers(t){
  const dt=Math.min(.05,Math.max(0,(t-(this.workerAnimAt||t))/1000));this.workerAnimAt=t
  for(const w of(this.workers??[])){
   w.mixer?.update(dt)
   if(!w.moving)continue
   const cycle=((t/1000)*w.speed+w.phase)%2,p=cycle<=1?cycle:2-cycle,direction=cycle<=1?1:-1
   w.view.position.x=THREE.MathUtils.lerp(w.from[0],w.to[0],p)
   w.view.position.z=THREE.MathUtils.lerp(w.from[1],w.to[1],p)
   if(direction!==w.lastDirection){w.lastDirection=direction;w.view.rotation.y=w.baseYaw+(direction<0?Math.PI:0)}
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
 claimChapter(chapter=currentChapter(this.state)){
  const before=chapter&&this.state.claimedChapters?.[chapter.id]
  super.claimChapter(chapter)
  if(chapter&&!before&&this.state.claimedChapters?.[chapter.id]){
   this.audio.success()
   const next=currentChapter(this.state)
   if(next)setTimeout(()=>this.ui?.openMission?.(next,{markSeen:true}),320)
  }
 }
 trainTroops(type){const before=this.state.world.trainingJob;super.trainTroops(type);if(!before&&this.state.world.trainingJob)this.audio.build()}
 finishOutbound(m,now){
  const type=m.type;super.finishOutbound(m,now)
  if(type==='attack'){const win=this.state.world.battleReports?.[0]?.win;win?this.audio.success():this.audio.fail()}
  else if(type==='scout'||type==='claim')this.audio.success()
 }
}
