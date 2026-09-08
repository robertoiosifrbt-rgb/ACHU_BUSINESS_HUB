import {Application,Container} from 'pixi.js'
import {StrategyGame} from './StrategyGame.js'
import {CityScene} from './CityScene.js'
import {WorldScene} from './WorldScene.js'
import {loadVisualAssets} from './AssetLibrary.js'
import {saveState} from '../systems/state.js'
import {DomHud} from './DomHud.js'

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n))

StrategyGame.prototype.start=async function(){
 this.applyOfflineProduction()
 this.app=new Application()
 await this.app.init({resizeTo:window,antialias:true,background:0x668b9a,resolution:Math.min(devicePixelRatio,2),autoDensity:true})
 this.mount.appendChild(this.app.canvas)
 await loadVisualAssets()
 this.world=new Container()
 this.city=new CityScene(this)
 this.worldMap=new WorldScene(this)
 this.worldMap.visible=false
 this.world.addChild(this.city,this.worldMap)
 this.app.stage.addChild(this.world)
 this.fitWorld()
 this.hud=new DomHud(this,this.mount)
 this.setupCamera()
 this.app.ticker.add(()=>this.update())
 window.addEventListener('resize',()=>{if(!this.drag&&!this.pinch)this.fitWorld(false);this.hud.layout()})
 this.hud.refresh(true)
 saveState(this.state)
}

StrategyGame.prototype.fitWorld=function(resetScale=true){
 const phone=window.innerWidth<700
 const target=this.mode==='world'?clamp(window.innerWidth/(phone?650:820),.48,.94):clamp(window.innerWidth/(phone?690:980),.50,.84)
 if(resetScale||!this.world?.scale?.x)this.world.scale.set(target)
 this.world.position.set(window.innerWidth/2,window.innerHeight/2+(this.mode==='world'?(phone?38:55):(phone?96:118)))
}

StrategyGame.prototype.clearSelection=function(){
 if(!this.hud)return
 this.hud.hideSheets?.()
}
