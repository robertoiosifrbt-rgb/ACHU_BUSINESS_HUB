import { Application,Container } from 'pixi.js'
import { CityScene } from './CityScene.js'
import { Hud } from './Hud.js'
import { loadVisualAssets } from './AssetLibrary.js'
import { loadState,saveState,resetState } from '../systems/state.js'
import { startConstruction,tickConstruction,allianceHelp } from '../systems/construction.js'
import { startResearch,tickResearch,researchBonus } from '../systems/research.js'
import { BUILDINGS,resourceProduction } from '../data/buildings.js'

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n))
export class StrategyGame{
 constructor(mount){this.mount=mount;this.state=loadState();this.lastResourceTick=performance.now();this.drag=null;this.pinch=null;this.pointers=new Map();this.toastTimer=null}
 async start(){this.applyOfflineProduction();this.app=new Application();await this.app.init({resizeTo:window,antialias:true,background:0x9fc9d5,resolution:Math.min(devicePixelRatio,2),autoDensity:true});this.mount.appendChild(this.app.canvas);await loadVisualAssets();this.world=new Container();this.fitWorld();this.city=new CityScene(this);this.world.addChild(this.city);this.app.stage.addChild(this.world);this.hud=new Hud(this);this.app.stage.addChild(this.hud);this.setupCamera();this.app.ticker.add(()=>this.update());window.addEventListener('resize',()=>{if(!this.drag&&!this.pinch)this.fitWorld(false)});this.hud.refresh();saveState(this.state)}
 fitWorld(resetScale=true){if(resetScale||!this.world?.scale?.x){const s=clamp(window.innerWidth/760,.5,.94);this.world?.scale?.set?.(s)}if(this.world)this.world.position.set(window.innerWidth/2,window.innerHeight/2+55)}
 setupCamera(){const s=this.app.stage;s.eventMode='static';s.hitArea=this.app.screen;const point=e=>({x:e.global.x,y:e.global.y})
  s.on('pointerdown',e=>{this.pointers.set(e.pointerId,point(e));if(this.pointers.size===1){this.drag={id:e.pointerId,x:e.global.x,y:e.global.y,wx:this.world.x,wy:this.world.y}}else if(this.pointers.size===2){const [a,b]=[...this.pointers.values()],dist=Math.hypot(a.x-b.x,a.y-b.y);this.pinch={dist,scale:this.world.scale.x};this.drag=null}})
  s.on('pointermove',e=>{if(!this.pointers.has(e.pointerId))return;this.pointers.set(e.pointerId,point(e));if(this.pointers.size>=2&&this.pinch){const [a,b]=[...this.pointers.values()],dist=Math.hypot(a.x-b.x,a.y-b.y),n=clamp(this.pinch.scale*(dist/Math.max(1,this.pinch.dist)),.42,1.8);this.world.scale.set(n);return}if(this.drag&&this.drag.id===e.pointerId){this.world.position.set(this.drag.wx+e.global.x-this.drag.x,this.drag.wy+e.global.y-this.drag.y)}})
  const end=e=>{this.pointers.delete(e.pointerId);this.pinch=null;if(this.pointers.size===1){const [id,p]=[...this.pointers.entries()][0];this.drag={id,x:p.x,y:p.y,wx:this.world.x,wy:this.world.y}}else this.drag=null};s.on('pointerup',end);s.on('pointerupoutside',end);s.on('pointercancel',end)
  this.app.canvas.addEventListener('wheel',e=>{e.preventDefault();this.world.scale.set(clamp(this.world.scale.x*(e.deltaY>0?.9:1.1),.42,1.8))},{passive:false})
 }
 selectBuilding(id){this.hud.showBuilding(id)}
 clearSelection(){this.hud.detail.visible=false;this.hud.researchPanel.visible=false}
 focusBuilding(id){const d=BUILDINGS[id];if(!d)return;this.clearSelection();const z=this.world.scale.x;this.world.position.set(window.innerWidth/2-d.x*z,window.innerHeight/2+75-d.y*z);this.city.focus(id);this.toast(`${d.name} located`)}
 upgradeBuilding(id){const r=startConstruction(this.state,id);this.toast(r.ok?`${BUILDINGS[id].name} construction started`:r.error);saveState(this.state);this.city.refresh();this.hud.refresh()}
 helpConstruction(){const ok=allianceHelp(this.state);this.toast(ok?'Alliance help applied':'No construction in progress');saveState(this.state)}
 research(id){const r=startResearch(this.state,id);this.toast(r.ok?'Research started':r.error);saveState(this.state);this.hud.refresh()}
 isCollectReady(id){return Date.now()>=(this.state.collectReady?.[id]??0)}
 collectResource(id){const def=BUILDINGS[id],lvl=this.state.buildings[id]??0;if(!def?.production||!lvl||!this.isCollectReady(id))return;const bonus=1+researchBonus(this.state,'allOutput')+researchBonus(this.state,`${def.production.resource}Output`),amount=Math.max(1,Math.round(def.production.base*lvl*45*bonus));this.state.resources[def.production.resource]=(this.state.resources[def.production.resource]??0)+amount;this.state.collectReady[id]=Date.now()+30000;this.toast(`+${amount} ${def.production.resource.toUpperCase()}`);saveState(this.state);this.city.refresh();this.hud.refresh()}
 claimChapter(chapter){if(!chapter||this.state.claimedChapters?.[chapter.id])return;for(const [k,v] of Object.entries(chapter.reward))this.state.resources[k]=(this.state.resources[k]??0)+v;this.state.claimedChapters[chapter.id]=true;this.toast('Chapter reward claimed');saveState(this.state);this.hud.refresh()}
 toast(message){this.hud.queue.text=message;clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>this.hud.refresh(),1700)}
 productionRates(){const base=resourceProduction(this.state),all=1+researchBonus(this.state,'allOutput');for(const k of Object.keys(base))base[k]*=all*(1+researchBonus(this.state,`${k}Output`));return base}
 applyOfflineProduction(){const last=this.state.lastSavedAt??Date.now(),seconds=Math.min(8*3600,Math.max(0,(Date.now()-last)/1000));if(seconds<3)return;const rates=this.productionRates();for(const [k,v] of Object.entries(rates))this.state.resources[k]=(this.state.resources[k]??0)+v*seconds}
 update(){const now=performance.now(),dt=Math.min(1,(now-this.lastResourceTick)/1000);this.lastResourceTick=now;const rates=this.productionRates();for(const [k,v] of Object.entries(rates))this.state.resources[k]=(this.state.resources[k]??0)+v*dt;const changed=Boolean(tickConstruction(this.state)|tickResearch(this.state));if(changed){this.city.refresh();saveState(this.state);if(this.hud.researchPanel.visible)this.hud.openResearch()}this.city.animate();this.hud.refresh();if(Math.floor(now)%1800<20)saveState(this.state)}
 reset(){this.state=resetState();this.city.refresh();this.hud.refresh();saveState(this.state)}
}
