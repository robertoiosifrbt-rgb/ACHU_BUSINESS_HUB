import { Application,Container } from 'pixi.js'
import { CityScene } from './CityScene.js'
import { Hud } from './Hud.js'
import { loadState,saveState,resetState } from '../systems/state.js'
import { startConstruction,tickConstruction,allianceHelp } from '../systems/construction.js'
import { startResearch,tickResearch,researchBonus } from '../systems/research.js'
import { BUILDINGS } from '../data/buildings.js'

export class StrategyGame{
 constructor(mount){this.mount=mount;this.state=loadState();this.lastResourceTick=performance.now();this.drag=null}
 async start(){this.app=new Application();await this.app.init({resizeTo:window,antialias:true,background:0xb9ddf2,resolution:Math.min(devicePixelRatio,2),autoDensity:true});this.mount.appendChild(this.app.canvas);this.world=new Container();this.world.position.set(window.innerWidth/2,window.innerHeight/2+60);this.world.scale.set(Math.min(1,window.innerWidth/900));this.city=new CityScene(this);this.world.addChild(this.city);this.app.stage.addChild(this.world);this.hud=new Hud(this);this.app.stage.addChild(this.hud);this.setupCamera();this.app.ticker.add(t=>this.update(t));window.addEventListener('resize',()=>{if(!this.drag){this.world.position.set(window.innerWidth/2,window.innerHeight/2+60)}});this.hud.refresh()}
 setupCamera(){const s=this.app.stage;s.eventMode='static';s.hitArea=this.app.screen;s.on('pointerdown',e=>{this.drag={x:e.global.x,y:e.global.y,wx:this.world.x,wy:this.world.y,moved:false}});s.on('pointermove',e=>{if(!this.drag)return;const dx=e.global.x-this.drag.x,dy=e.global.y-this.drag.y;if(Math.hypot(dx,dy)>5)this.drag.moved=true;this.world.position.set(this.drag.wx+dx,this.drag.wy+dy)});const end=()=>this.drag=null;s.on('pointerup',end);s.on('pointerupoutside',end);this.app.canvas.addEventListener('wheel',e=>{e.preventDefault();const f=e.deltaY>0?.9:1.1;const n=Math.max(.45,Math.min(1.8,this.world.scale.x*f));this.world.scale.set(n)},{passive:false})}
 selectBuilding(id){this.hud.showBuilding(id)}
 clearSelection(){this.hud.detail.visible=false;this.hud.researchPanel.visible=false}
 upgradeBuilding(id){const r=startConstruction(this.state,id);this.toast(r.ok?`${BUILDINGS[id].name} queued`:r.error);saveState(this.state);this.hud.refresh()}
 helpConstruction(){const ok=allianceHelp(this.state);this.toast(ok?'Alliance help applied':'No construction in progress');saveState(this.state)}
 research(id){const r=startResearch(this.state,id);this.toast(r.ok?'Research started':r.error);saveState(this.state);this.hud.refresh()}
 toast(message){this.hud.queue.text=message;clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>this.hud.refresh(),1600)}
 update(t){const now=performance.now();const dt=Math.min(1,(now-this.lastResourceTick)/1000);this.lastResourceTick=now;const out=1+researchBonus(this.state,'allOutput');const woodBonus=1+researchBonus(this.state,'woodOutput');const coalBonus=1+researchBonus(this.state,'coalOutput');this.state.resources.wood+=(this.state.buildings.sawmill??0)*2.2*dt*out*woodBonus;this.state.resources.coal+=(this.state.buildings.coalMine??0)*1.15*dt*out*coalBonus;this.state.resources.food+=.45*dt*out;const changed=tickConstruction(this.state)|tickResearch(this.state);if(changed){this.city.refresh();saveState(this.state);if(this.hud.researchPanel.visible)this.hud.openResearch()}this.city.animate(performance.now());if((t.lastTime??0)%10<1){this.hud.refresh();saveState(this.state)}}
 reset(){this.state=resetState();this.city.refresh();this.hud.refresh()}
}
