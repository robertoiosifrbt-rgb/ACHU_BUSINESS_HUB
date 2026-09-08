import { Retro4XGame } from './Retro4XGame.js'
import { buildCity4X,buildingPosition4X } from './cityFactory4x.js'
import { World3D4X } from './worldFactory4x.js'
import { GameUI4X } from './ui4x.js'

export class Business4XGame extends Retro4XGame{
 constructor(mount){super(mount);this.mode='world'}
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
  return this
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
}
