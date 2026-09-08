import { BusinessStore } from '../state/store.js'
import { BusinessScene } from '../scene/BusinessScene.js'
import { GameShell } from '../ui/GameShell.js'
import '../ui/business-game.css'

export class BusinessGameApp{
 constructor(host){this.host=host;this.store=null;this.scene=null;this.ui=null}
 start(){
  this.host.innerHTML='';this.host.className='business-game';this.store=new BusinessStore();this.scene=new BusinessScene(this.host)
  this.scene.camera.position.set(10.5,20.5,24.5);this.scene.camera.lookAt(-.6,0,-1.6);this.scene.camera.updateProjectionMatrix()
  this.ui=new GameShell(this.host,this.store);this.unsubscribe=this.store.subscribe(state=>this.scene.update(state));return this
 }
 destroy(){this.unsubscribe?.();this.ui?.destroy();this.scene?.destroy();this.host.innerHTML=''}
}
