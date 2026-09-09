import * as THREE from 'three'
import { Retro4XGame } from './Retro4XGame.js'
import { buildCity4X,buildingPosition4X } from './cityFactory4x.js'
import { World3D4X } from './worldFactory4x.js'
import { BusinessCleaningUI } from './BusinessCleaningUI.js'
import { GameAudio } from './audio.js'
import { BUILDINGS } from '../data/buildings.js'
import { currentChapter } from '../data/chapters.js'
import { worldTile,parseTile,adjacentTo } from '../data/world.js'
import { resetState,saveState } from '../systems/state.js'

const canPay=(resources,cost)=>Object.entries(cost).every(([k,v])=>(resources[k]??0)>=v)
const pay=(resources,cost)=>Object.entries(cost).forEach(([k,v])=>resources[k]-=v)
const HIRING_HUB={infantry:'infantryCamp',lancer:'lancerCamp',marksman:'marksmanCamp'}
const HIRING_LABEL={infantry:'cleaners',lancer:'mobile cleaners',marksman:'specialists'}

function fallbackCrew(accent=0x42b98e){
 const g=new THREE.Group(),skin=new THREE.MeshStandardMaterial({color:0xd9a47f,roughness:.78}),shirt=new THREE.MeshStandardMaterial({color:accent,roughness:.7}),trousers=new THREE.MeshStandardMaterial({color:0x26333a,roughness:.9}),shoes=new THREE.MeshStandardMaterial({color:0x11181c,roughness:.95}),hair=new THREE.MeshStandardMaterial({color:0x362b27,roughness:.92})
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
  this.ui?.root?.remove();this.city?.removeFromParent();this.world?.removeFromParent()
  this.city=buildCity4X(this.assets,this.state);this.world=new World3D4X(this.assets,this.state);this.scene.add(this.city,this.world)
  this.mode=(this.state.buildings.furnace??1)>=4?'world':'city';this.city.visible=this.mode==='city';this.world.visible=this.mode==='world'
  this.addWorkers();this.ui=new BusinessCleaningUI(this)
  this.scene.background.setHex(0xc4d2cc);if(this.scene.fog){this.scene.fog.color.setHex(0xc4d2cc);this.scene.fog.density=.009}
  this.controls.target.set(0,0,0);this.camera.position.set(this.mode==='world'?19:17,this.mode==='world'?26:21,this.mode==='world'?19:17)
  this.camera.zoom=1;this.resize();this.ui.refresh();this.ui.maybeStartStory?.();this.audio.prepare()
  this.audioUnlock=()=>this.audio.unlock();window.addEventListener('pointerdown',this.audioUnlock,{capture:true})
  return this
 }
 addWorkers(){
  this.workers=[];this.workerAnimAt=performance.now();if(!this.city)return
  const routes=[
   {from:[-5.8,2.35],to:[-2.3,2.35],phase:.05,speed:.00007},{from:[-1.7,2.6],to:[2.0,2.6],phase:.42,speed:.00006},
   {from:[2.4,2.2],to:[5.3,1.7],phase:.88,speed:.000065},{from:[-3.1,5.6],to:[.3,6.5],phase:1.26,speed:.000055},
   {from:[1.2,5.6],to:[4.5,6.8],phase:1.58,speed:.00006},{from:[-4.7,-2.2],to:[-2.0,-1.5],phase:.7,speed:.000052}
  ]
  const accents=[0x3da982,0x4f91c7,0xd19b4f,0x8d78bd,0x3da982,0x4f91c7],clip=this.assets?.characterClip?.('walk')
  routes.forEach((r,i)=>{
   const view=this.assets?.cloneCharacter?.()||fallbackCrew(accents[i%accents.length]);view.scale.multiplyScalar(.48);view.position.set(0,0,0);view.updateMatrixWorld(true)
   const fitted=new THREE.Box3().setFromObject(view),groundOffset=Number.isFinite(fitted.min.y)?-fitted.min.y:0
   view.position.set(r.from[0],.02+groundOffset,r.from[1]);this.city.add(view)
   let mixer=null
   if(view.userData.realCrew&&clip){try{mixer=new THREE.AnimationMixer(view);const action=mixer.clipAction(clip);action.timeScale=.78+(i%3)*.06;action.play();mixer.update(i*.1)}catch{mixer=null}}
   this.workers.push({view,mixer,...r})
  })
 }
 animateWorkers(t){
  const dt=Math.min(.05,Math.max(0,(t-(this.workerAnimAt||t))/1000));this.workerAnimAt=t
  for(const w of(this.workers??[])){w.mixer?.update(dt);const u=(t*w.speed+w.phase)%2,p=u<=1?u:2-u,dir=u<=1?1:-1,dx=w.to[0]-w.from[0],dz=w.to[1]-w.from[1];w.view.position.x=w.from[0]+dx*p;w.view.position.z=w.from[1]+dz*p;w.view.rotation.y=Math.atan2(dx*dir,dz*dir)}
 }
 companyCapability(){
  const t=this.state.world.troops??{},b=this.state.buildings,rep=Math.max(0,this.state.resources.coal??0)
  const people=(t.infantry??0)*7+(t.lancer??0)*9+(t.marksman??0)*12
  const systems=(b.infantryCamp??0)*70+(b.infirmary??0)*80+(b.lancerCamp??0)*65+(b.marksmanCamp??0)*90+(b.researchCenter??0)*55+(b.furnace??1)*45
  const reputation=Math.min(900,Math.round(Math.sqrt(rep)*32))
  return Math.round(people+systems+reputation)
 }
 setMode(mode){
  if(mode==='world'&&(this.state.buildings.furnace??1)<4){this.ui?.toast('The market map unlocks in Chapter 3 · Headquarters 4');const ch=currentChapter(this.state);if(ch)this.ui?.openMission?.(ch);return false}
  this.mode=mode;this.city.visible=mode==='city';this.world.visible=mode==='world';this.controls.target.set(0,0,0)
  this.camera.position.set(mode==='world'?19:17,mode==='world'?26:21,mode==='world'?19:17);this.camera.zoom=1;this.camera.updateProjectionMatrix();this.resize();this.ui?.hideSheet();this.ui?.refresh();return true
 }
 resize(){const w=innerWidth,h=innerHeight,aspect=w/h,view=this.mode==='world'?16.4:12.6;this.camera.left=-view*aspect;this.camera.right=view*aspect;this.camera.top=view;this.camera.bottom=-view;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false)}
 focusBuilding(id){this.setMode('city');const p=buildingPosition4X(id);this.controls.target.copy(p);this.camera.position.set(p.x+11,15,p.z+11);this.ui?.toast(`${id==='furnace'?'Headquarters':'Division'} selected`)}
 rebuildCity(){this.city?.removeFromParent();this.city=buildCity4X(this.assets,this.state);this.scene.add(this.city);this.city.visible=this.mode==='city';this.addWorkers()}
 resetGame(){this.audio?.stopAmbient();this.state=resetState();localStorage.removeItem('achu_story_guide_v2');location.reload()}
 toggleAudio(){const enabled=this.audio.toggle();this.ui?.toast(enabled?'Music and sound on':'Music and sound off');return enabled}
 upgradeBuilding(id){const before=this.state.construction;super.upgradeBuilding(id);if(!before&&this.state.construction)this.audio.build()}
 research(id){const before=this.state.researchJob;super.research(id);if(!before&&this.state.researchJob)this.audio.research()}
 dispatch(type,id,cost={}){
  if(type!=='attack'){const ok=super.dispatch(type,id,cost);if(ok)this.audio.dispatch(type);return ok}
  const w=this.state.world,d=worldTile(...parseTile(id))
  if(w.marches.length>=this.marchCapacity()){this.ui.toast('All field teams are already committed');return false}
  if(w.marches.some(m=>m.target===id)){this.ui.toast('A field operation is already active here');return false}
  if(!canPay(this.state.resources,cost)){this.ui.toast('Not enough Cash or business resources');return false}
  const capability=this.companyCapability()
  if(capability<(d.requiredCapability??d.strength??0)){this.ui.toast(`This tender needs ${Math.round(d.requiredCapability??d.strength).toLocaleString()} capability`);return false}
  const troops=this.detachment('attack');if(Object.values(troops).reduce((a,n)=>a+n,0)<1){this.ui.toast('No cleaners are available for the bid team');return false}
  pay(this.state.resources,cost)
  const now=Date.now(),travel=this.travelMs(id)
  w.marches.push({id:`bid${now}${Math.floor(Math.random()*99)}`,type:'attack',businessAction:'contract-bid',target:id,phase:'outbound',phaseStartedAt:now,arriveAt:now+travel,travelMs:travel,troops,bidCapability:capability,cargo:null})
  saveState(this.state);this.world.refreshMarches();this.ui.refresh();this.ui.toast('Commercial bid submitted');this.audio.dispatch('attack');return true
 }
 scoutTile(id){const w=this.state.world;if(w.scouted.includes(id)||!adjacentTo(id,w.scouted))return;this.dispatch('scout',id,{meat:35})}
 claimTile(id){
  const w=this.state.world,d=worldTile(...parseTile(id));if(w.owned.includes(id)||!w.scouted.includes(id)||['tender','framework'].includes(d.businessType)||!adjacentTo(id,w.owned))return
  this.dispatch('claim',id,{meat:d.coverageCost??90,wood:Math.max(8,Math.round((d.coverageCost??90)*.12))})
 }
 gatherTile(id){
  const w=this.state.world,d=worldTile(...parseTile(id));if(d.businessType!=='lead'||!w.owned.includes(id)||Date.now()<(w.nodeReady?.[id]??0))return
  this.dispatch('gather',id,{wood:d.supplyCost??Math.max(8,Math.round((d.crewHours??2)*5)),meat:d.travelCost??Math.max(4,Math.round((d.travelMins??10)*.45))})
 }
 attackTile(id){
  const w=this.state.world,d=worldTile(...parseTile(id));if(!['tender','framework'].includes(d.businessType)||!w.scouted.includes(id))return
  if(w.defeated.includes(id)){this.ui.toast('ACHU already holds this contract');return}
  this.dispatch('attack',id,{meat:d.proposalCost??Math.max(55,Math.round((d.monthlyValue??500)*.06))})
 }
 trainTroops(type){
  const w=this.state.world;if(w.trainingJob){this.ui.toast('Recruitment queue is busy');return}
  const hub=HIRING_HUB[type],lvl=this.state.buildings[hub]??0;if(lvl<1){this.ui.toast(`Open ${BUILDINGS[hub].name} first`);return}
  const amount=8+lvl*4,cost={meat:amount*8,wood:amount*2,iron:Math.max(1,Math.ceil(amount*.25))}
  if(!canPay(this.state.resources,cost)){this.ui.toast('You need more Cash, Supplies or candidates');return}
  pay(this.state.resources,cost);w.trainingJob={type,amount,finishAt:Date.now()+7000};saveState(this.state);this.ui.toast(`Hiring ${amount} ${HIRING_LABEL[type]}`);this.ui.refresh();this.audio.build()
 }
 tickMarches(now){
  const completed=(this.state.world.marches??[]).filter(m=>m.type==='gather'&&m.phase==='returning'&&now>=m.arriveAt).map(m=>m.target)
  const changed=super.tickMarches(now)
  for(const target of completed){const d=worldTile(...parseTile(target)),rep=d.reviewReward??Math.max(1,Math.round((d.quote??d.yield??0)/40));this.state.resources.coal=(this.state.resources.coal??0)+rep;this.state.power+=rep*2;this.ui?.toast(`Job complete · £${Math.round(d.quote??d.yield??0)} paid · +${rep} Reputation`)}
  return changed||completed.length>0
 }
 finishOutbound(m,now){
  if(m.type!=='attack'){const type=m.type;super.finishOutbound(m,now);if(type==='scout'||type==='claim')this.audio.success();return}
  const w=this.state.world,d=worldTile(...parseTile(m.target)),need=d.requiredCapability??d.strength??0,score=m.bidCapability??this.companyCapability(),won=score>=need
  if(won){if(!w.defeated.includes(m.target))w.defeated.push(m.target);for(const [k,v] of Object.entries(d.reward??{}))this.state.resources[k]=(this.state.resources[k]??0)+v;this.state.power+=Math.round((d.monthlyValue??0)*.04);this.ui.toast(`Contract won · £${Math.round(d.monthlyValue??0).toLocaleString()}/month`);this.audio.success()}
  else{this.ui.toast('Bid unsuccessful · improve the operation and try again');this.audio.fail()}
  w.battleReports.unshift({at:now,target:m.target,name:d.client??d.name,requiredCapability:need,capability:score,win:won,type:'commercial-bid'});w.battleReports=w.battleReports.slice(0,12)
  m.phase='returning';m.phaseStartedAt=now;m.arriveAt=now+m.travelMs
 }
}
