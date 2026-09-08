import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,WORLD_CENTER,FACTIONS } from '../data/world.js'

const SIZE=21,TILE=1.48
const key=(x,y)=>`${x},${y}`
const toWorld=(x,y)=>new THREE.Vector3((x-WORLD_CENTER)*TILE,0,(y-WORLD_CENTER)*TILE)
const material=(color,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness:.94,transparent:opacity<1,opacity,depthWrite:opacity>.08})

function disk(parent,r,color,opacity=.2,y=-.02){const m=new THREE.Mesh(new THREE.CircleGeometry(r,28),material(color,opacity));m.rotation.x=-Math.PI/2;m.position.y=y;m.receiveShadow=true;parent.add(m);return m}
function asset(bank,parent,name,x=0,y=0,z=0,rot=0,s=1){const o=bank.clone(name);o.position.set(x,y,z);o.rotation.y=rot;o.scale.setScalar(s);parent.add(o);return o}
function tint(root,color){root.traverse(o=>{if(!o.isMesh||!o.material)return;const mats=Array.isArray(o.material)?o.material:[o.material];o.material=Array.isArray(o.material)?mats.map(m=>m?.clone?.()??m):(o.material.clone?.()??o.material);const out=Array.isArray(o.material)?o.material:[o.material];out.forEach(m=>m?.color?.multiply(new THREE.Color(color)))})}

function miniOffice(bank,parent,{tier=1,color=null,hq=false}={}){
 const g=new THREE.Group(),floors=Math.min(2,1+Math.floor((tier-1)/3)),style=hq?'B':tier%2?'A':'B'
 const door=style==='B'?'wallBDoor':'wallADoor',win=style==='B'?'wallBWindow':'wallAWindow',roof=style==='B'?'wallBRoof':'wallARoof'
 for(let f=0;f<floors;f++){
  asset(bank,g,f===0?door:win,-.5,f,.5,0,.72);asset(bank,g,win,.5,f,.5,0,.72)
  asset(bank,g,win,-.5,f,-.5,Math.PI,.72);asset(bank,g,win,.5,f,-.5,Math.PI,.72)
  asset(bank,g,win,-1,f,0,Math.PI/2,.72);asset(bank,g,win,1,f,0,-Math.PI/2,.72)
 }
 asset(bank,g,roof,-.5,floors,-.5,0,.72);asset(bank,g,roof,.5,floors,-.5,0,.72);asset(bank,g,roof,-.5,floors,.5,0,.72);asset(bank,g,roof,.5,floors,.5,0,.72)
 if(color)tint(g,color)
 g.scale.setScalar(hq?1.05:.78+(tier??1)*.035);parent.add(g);return g
}

function opportunity(bank,parent,resource){
 const g=new THREE.Group();disk(g,.58,{meat:0x54d39b,wood:0x62b8ff,coal:0xf3b95f,iron:0xc89cff}[resource]??0x8aa6ad,.18)
 if(resource==='meat'){
  asset(bank,g,'truckGreen',-.05,0,.05,.5,.28);asset(bank,g,'wallADoor',.32,0,-.25,-.7,.22)
 }else if(resource==='wood'){
  asset(bank,g,'truckGrey',-.18,0,.1,.6,.25);asset(bank,g,'dumpster',.3,0,-.2,-.4,.23);asset(bank,g,'barrier',.25,0,.32,.4,.18)
 }else if(resource==='coal'){
  asset(bank,g,'wallAWindow',0,0,-.08,0,.3);asset(bank,g,'wallARoof',0,.3,-.08,0,.3);asset(bank,g,'truckGreen',.28,0,.25,-.7,.2)
 }else{
  asset(bank,g,'wallBWindow',-.08,0,-.08,0,.3);asset(bank,g,'wallBRoof',-.08,.3,-.08,0,.3);asset(bank,g,'scaffold',.28,0,.12,.25,.2)
 }
 parent.add(g);return g
}

function contractSite(bank,parent,level=1){
 const g=new THREE.Group();disk(g,.63,level>=5?0x8a5753:0x806a4b,.22)
 asset(bank,g,level>=5?'truckGrey':'truckGreen',-.08,0,.02,.55,.31)
 asset(bank,g,'scaffold',.31,0,-.18,-.35,.26)
 for(const [x,z,r] of [[.38,.28,.15],[-.35,.32,-.35],[.3,-.3,.72]])asset(bank,g,'barrier',x,0,z,r,.22)
 parent.add(g);return g
}

function addTree(bank,parent,name,x,z,s){const t=bank.clone(name);t.position.set(x,0,z);t.rotation.y=x*7+z*11;t.scale.setScalar(s);parent.add(t)}
function regionColor(region){return({crown:0x48675f,north:0x475d70,east:0x655963,south:0x5d6b54,west:0x685f50}[region]??0x52636a)}

function addWorldDetail(bank,parent,span){
 for(let i=0;i<42;i++){const a=i*2.399,r=span*.23+(i%7)*1.7,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<2&&Math.abs(z)<2)continue;addTree(bank,parent,i%4?'pineSmall':'pineLarge',x,z,.2+(i%3)*.04)}
}

export class World3D extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.build()}
 build(){
  this.clear();this.tiles.clear();this.marchObjects.clear();const span=SIZE*TILE
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(span+8,span+8),material(0x26383e));ground.rotation.x=-Math.PI/2;ground.position.y=-.24;ground.receiveShadow=true;this.add(ground);addWorldDetail(this.bank,this,span)
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const def=worldTile(x,y),id=key(x,y),scouted=this.state.world.scouted.includes(id),owned=this.state.world.owned.includes(id),p=toWorld(x,y),c=new THREE.Group();c.position.copy(p);c.userData.tileId=id
   const base=regionColor(def.region),tileColor=!scouted?0x18252b:owned?0x3d7c69:def.faction?0x635866:base
   const hit=new THREE.Mesh(new THREE.BoxGeometry(TILE*.93,.08,TILE*.93),material(tileColor,scouted?1:.8));hit.position.y=-.08;hit.userData.tileId=id;c.add(hit)
   if(owned)disk(c,TILE*.39,0x65ba91,.13,-.025)
   if(scouted){
    if(id===BASE_TILE){const m=miniOffice(this.bank,c,{tier:Math.max(1,Math.floor((this.state.buildings.furnace??1)/2)),color:0x74d7bd,hq:true});m.traverse(o=>o.userData.tileId=id)}
    else if(def.kind==='settlement'){const m=miniOffice(this.bank,c,{tier:def.tier??1,color:FACTIONS[def.tag]?.color??null});m.traverse(o=>o.userData.tileId=id)}
    else if(def.kind==='camp'&&!this.state.world.defeated.includes(id))contractSite(this.bank,c,def.level)
    else if(def.kind==='resource')opportunity(this.bank,c,def.resource)
    else if(def.kind==='wild'&&(x*5+y*3)%5===0)addTree(this.bank,c,(x+y)%2?'pineSmall':'pineLarge',0,0,.2)
   }
   c.traverse(o=>o.userData.tileId=id);this.add(c);this.tiles.set(id,c)
  }
  this.refreshMarches()
 }
 refresh(){this.build()}
 refreshMarches(){
  for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear()
  for(const m of this.state.world.marches??[]){const name=(m.type==='attack'||m.type==='compete')?'truckGrey':'truckGreen',obj=this.bank.clone(name);obj.scale.setScalar(.24);obj.position.y=.04;this.add(obj);this.marchObjects.set(m.id,obj)}
  this.updateMarches(Date.now())
 }
 updateMarches(now){
  const base=toWorld(WORLD_CENTER,WORLD_CENTER)
  for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;const [x,y]=parseTile(m.target),target=toWorld(x,y);let p=1;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning')p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));o.position.x=base.x+(target.x-base.x)*p;o.position.z=base.z+(target.z-base.z)*p;o.position.y=.04;o.rotation.y=Math.atan2(target.x-base.x,target.z-base.z)}
 }
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
