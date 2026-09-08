import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Retro4XGame } from './Retro4XGame.js'
import { AssetBank } from './AssetBank.js'
import { buildCity } from './cityFactory.js'
import { World3D } from './worldFactory.js'
import { GameUI } from './ui.js'
import { saveState } from '../systems/state.js'

Retro4XGame.prototype.start=async function(){
 this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'})
 this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setSize(innerWidth,innerHeight)
 this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap
 this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.16
 this.renderer.domElement.className='three-canvas';this.mount.appendChild(this.renderer.domElement)
 this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x18282d);this.scene.fog=new THREE.FogExp2(0x1c3035,.012)
 this.camera=new THREE.OrthographicCamera(-12,12,12,-12,.1,180);this.camera.position.set(17,21,17);this.camera.lookAt(0,0,0)
 this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableRotate=false;this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.screenSpacePanning=true;this.controls.minZoom=.6;this.controls.maxZoom=2.8;this.controls.target.set(0,0,0)
 this.controls.mouseButtons.LEFT=THREE.MOUSE.PAN;this.controls.touches.ONE=THREE.TOUCH.PAN;this.controls.touches.TWO=THREE.TOUCH.DOLLY_PAN
 this.controls.panSpeed=.82;this.controls.zoomSpeed=.9
 this.scene.add(new THREE.HemisphereLight(0xd8f1ff,0x26352f,2.55))
 const fill=new THREE.DirectionalLight(0x89b9cf,1.05);fill.position.set(16,10,-18);this.scene.add(fill)
 const sun=new THREE.DirectionalLight(0xffe5bf,4.15);sun.position.set(-16,28,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.00025;sun.shadow.camera.left=-34;sun.shadow.camera.right=34;sun.shadow.camera.top=34;sun.shadow.camera.bottom=-34;this.scene.add(sun)
 this.assets=new AssetBank()
 this.city=buildCity(this.assets,this.state);this.world=new World3D(this.assets,this.state);this.world.visible=false;this.scene.add(this.city,this.world)
 this.addWorkers();this.ui=new GameUI(this);this.bind();this.resize();this.applyOfflineProduction();saveState(this.state);this.loop()
 this.assets.load().then(()=>{
  const mode=this.mode
  this.rebuildCity();this.city.visible=mode==='city'
  this.world.removeFromParent();this.world=new World3D(this.assets,this.state);this.world.visible=mode==='world';this.scene.add(this.world)
  this.ui.toast('Visual assets ready')
 }).catch(err=>{console.warn('Asset load failed, using safe 3D fallbacks',err);this.ui?.toast('Using offline 3D assets')})
}
