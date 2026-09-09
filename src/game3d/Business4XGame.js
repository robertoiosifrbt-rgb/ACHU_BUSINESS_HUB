import * as THREE from 'three'
import { Retro4XGame } from './Retro4XGame.js'
import { buildCity4X,buildingPosition4X } from './cityFactory4x.js'
import { World3D4X } from './worldFactory4x.js'
import { GameUI4X } from './ui4x.js'
import { GameAudio } from './audio.js'
import { currentChapter } from '../data/chapters.js'
import { resetState } from '../systems/state.js'

function fallbackCrew(accent=0x42b98e){
 const g=new THREE.Group()
 const skin=new THREE.MeshStandardMaterial({color:0xd9a47f,roughness:.78})
 const shirt=new THREE.MeshStandardMaterial({color:accent,roughness:.7})
 const trousers=new THREE.MeshStandardMaterial({color:0x26333a,roughness:.9})
 const shoes=new THREE.MeshStandardMaterial({color:0x11181c,roughness:.95})
 const hair=new THREE.MeshStandardMaterial({color:0x362b27,roughness:.92})
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.19,.42,6,12),shirt);torso.position.y=.92;g.add(torso)
 const collar=new THREE.Mesh(new THREE.BoxGeometry(.22,.06,.2),shirt);collar.position.set(0,1.18,0);g.add(collar)
 const head=new THREE.Mesh(new THREE.SphereGeometry(.17,18,14),skin);head.position.y=1.43;g.add(head)
 const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.174,16,10,0,Math.PI*2,0,Math.PI*.46),hair);hairCap.position.y=1.49;g.add(hairCap)
 for(const x of[-.12,.12]){
  const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.055,.36,4,8),trousers);leg.position.set(x,.38,0);g.add(leg)
  const shoe=new THREE.Mesh(new THREE.BoxGeometry(.12,.08,.2),shoes);shoe.position.set(x,.08,.035);g.add(shoe)
  const sleeve=new THREE.Mesh(new THREE.CapsuleGeometry(.052,.16,4,8),shirt);sleeve.position.set(x<0?-.235:.235,1.02,0);sleeve.rotation.z=x<0?-.18:.18;g.add(sleeve)
  const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.042,.17,4,8),skin);arm.position.set(x<0?-.265:.265,.82,0);arm.rotation.z=x<0?-.12:.12;g.add(arm)
 }
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}})
 return g
}

export class Business4XGame extends Retro4XGame{
 constructor(mount){super(mount);this.mode='city';this.audio=new GameAudio();this.workerAnimAt=0}
 async start(){
  await super.start()
  this.ui?.root?.remove()
  this.city?.removeFromParent();this.world?.removeFromParent()
  this.city=buildCity4X(this.assets,this.state)
  this.world=new World3D4X(this.assets,this.state)
  this.scene.add(this.city,this.world)
  this.mode=(this.state.buildings.furnace??1)>=4?'world':'city'
  this.city.visible=this.mode==='city';this.world.visible=this.mode==='world'
  this.addWorkers()
  this.ui=new GameUI4X(this)
  this.scene.background.setHex(0xc4d2cc)
  if(this.scene.fog){this.scene.fog.color.setHex(0xc4d2cc);this.scene.fog.density=.009}
  this.controls.target.set(0,0,0)
  this.camera.position.set(this.mode==='world'?19:17,this.mode==='world'?26:21,this.mode==='world'?19:17)
  this.camera.zoom=1;this.resize();this.ui.refresh()
  window.addEventListener('pointerdown',()=>this.audio.unlock(),{once:true,capture:true})
  return this
 }
 addWorkers(){
  this.workers=[];this.workerAnimAt=performance.now()
  if(!this.city)return
  const routes=[
   {from:[-5.8,2.35],to:[-2.3,2.35],phase:.05,speed:.00007},
   {from:[-1.7,2.6],to:[2.0,2.6],phase:.42,speed:.00006},
   {from:[2.4,2.2],to:[5.3,1.7],phase:.88,speed:.000065},
   {from:[-3.1,5.6],to:[.3,6.5],phase:1.26,speed:.000055},
   {from:[1.2,5.6],to:[4.5,6.8],phase:1.58,speed:.00006},
   {from:[-4.7,-2.2],to:[-2.0,-1.5],phase:.7,speed:.000052}
  ]
  const accents=[0x3da982,0x4f91c7,0xd19b4f,0x8d78bd,0x3da982,0x4f91c7]
  const clip=this.assets?.characterClip?.('walk')
  routes.forEach((r,i)=>{
   const view=this.assets?.cloneCharacter?.()||fallbackCrew(accents[i%accents.length])
   view.scale.multiplyScalar(.48)
   view.position.set(0,0,0);view.updateMatrixWorld(true)
   const fitted=new THREE.Box3().setFromObject(view),groundOffset=Number.isFinite(fitted.min.y)?-fitted.min.y:0
   view.position.set(r.from[0],.02+groundOffset,r.from[1]);this.city.add(view)
   let mixer=null
   if(view.userData.realCrew&&clip){
    mixer=new THREE.AnimationMixer(view)
    const action=mixer.clipAction(clip);action.timeScale=.78+(i%3)*.06;action.play();mixer.update(i*.1)
   }
   this.workers.push({view,mixer,...r})
  })
 }
 animateWorkers(t){
  const dt=Math.min(.05,Math.max(0,(t-(this.workerAnimAt||t))/1000));this.workerAnimAt=t
  for(const w of(this.workers??[])){
   w.mixer?.update(dt)
   const u=(t*w.speed+w.phase)%2,p=u<=1?u:2-u,dir=u<=1?1:-1
   const dx=w.to[0]-w.from[0],dz=w.to[1]-w.from[1]
   w.view.position.x=w.from[0]+dx*p;w.view.position.z=w.from[1]+dz*p
   w.view.rotation.y=Math.atan2(dx*dir,dz*dir)
  }
 }
 setMode(mode){
  if(mode==='world'&&(this.state.buildings.furnace??1)<4){
   this.ui?.toast('The City unlocks in Chapter 3 · Headquarters 4')
   const ch=currentChapter(this.state);if(ch)this.ui?.openMission?.(ch)
   return false
  }
  this.mode=mode
  this.city.visible=mode==='city';this.world.visible=mode==='world'
  this.controls.target.set(0,0,0)
  this.camera.position.set(mode==='world'?19:17,mode==='world'?26:21,mode==='world'?19:17)
  this.camera.zoom=1;this.camera.updateProjectionMatrix();this.resize();this.ui?.hideSheet();this.ui?.refresh()
  return true
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
 resetGame(){
  this.audio?.stopAmbient();this.state=resetState();location.reload()
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
