import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,WORLD_CENTER,FACTIONS } from '../data/world.js'

const SIZE=21,TILE=1.62
const key=(x,y)=>`${x},${y}`
const hash=(x,y)=>Math.abs(Math.sin(x*91.17+y*47.31)*43758.5453)%1
const toWorld=(x,y)=>new THREE.Vector3((x-WORLD_CENTER)*TILE,0,(y-WORLD_CENTER)*TILE)
const mat=(color,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness:.95,transparent:opacity<1,opacity,depthWrite:opacity>.12})
function asset(bank,parent,name,x=0,y=0,z=0,rot=0,s=1){const o=bank.clone(name);o.position.set(x,y,z);o.rotation.y=rot;o.scale.setScalar(s);parent.add(o);return o}
function disk(parent,r,color,opacity=.2,y=.02){const m=new THREE.Mesh(new THREE.CircleGeometry(r,28),mat(color,opacity));m.rotation.x=-Math.PI/2;m.position.y=y;parent.add(m);return m}
function tint(root,color){root.traverse(o=>{if(!o.isMesh||!o.material)return;const mats=Array.isArray(o.material)?o.material:[o.material];o.material=Array.isArray(o.material)?mats.map(m=>m?.clone?.()??m):(o.material.clone?.()??o.material);for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m?.color)m.color.multiply(new THREE.Color(color))})}
function marker(color){const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d'),g=x.createRadialGradient(48,48,4,48,48,44),h=`#${color.toString(16).padStart(6,'0')}`;g.addColorStop(0,'white');g.addColorStop(.2,h);g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,96,96);const t=new THREE.CanvasTexture(c),s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})),p=Math.random()*6;s.onBeforeRender=()=>s.scale.setScalar(.68+Math.sin(performance.now()*.004+p)*.1);return s}

function premium(bank,parent,size='small',tier=1,color=null,rot=0){const n=size==='large'?'downtownLarge':size==='medium'?'downtownMedium':'downtownSmall',b=asset(bank,parent,n,0,0,0,rot,.18+Math.min(8,tier)*.008);b.traverse(o=>{if(o.isMesh)o.castShadow=false});if(color)tint(b,color);return b}
function lightweightOffice(bank,parent,x,y){const g=new THREE.Group(),b=(x+y)%2?'B':'A',door=`wall${b}Door`,win=`wall${b}Window`,roof=`wall${b}Roof`;asset(bank,g,door,-.4,0,.42,0,.55);asset(bank,g,win,.4,0,.42,0,.55);asset(bank,g,win,-.4,0,-.42,Math.PI,.55);asset(bank,g,win,.4,0,-.42,Math.PI,.55);asset(bank,g,roof,-.4,.56,0,0,.55);asset(bank,g,roof,.4,.56,0,0,.55);g.scale.setScalar(.78);parent.add(g);return g}
function opportunity(bank,parent,resource,x,y){const colors={meat:0x55dfa7,wood:0x65b9ff,coal:0xffc65d,iron:0xce9eff},c=colors[resource]??0x8bcfc0,g=new THREE.Group();disk(g,.56,c,.16);lightweightOffice(bank,g,x,y);if(hash(x,y)>.45)asset(bank,g,hash(x,y)>.7?'truckGreen':'truckGrey',-.3,.02,.38,.3,.15);const m=marker(c);m.position.set(.34,1.05,.1);g.add(m);parent.add(g)}
function contract(bank,parent,level=1){const g=new THREE.Group(),c=level>=5?0xff7f6f:0xffb85d;disk(g,.61,c,.17);asset(bank,g,'scaffold',0,0,0,.2,.23);asset(bank,g,'truckGrey',-.32,.02,.28,.45,.16);const m=marker(c);m.position.set(.3,.92,.1);g.add(m);parent.add(g)}
function road(parent,x,z,w,d){const curb=new THREE.Mesh(new THREE.BoxGeometry(w+.12,.04,d+.12),mat(0xb4b0a4));curb.position.set(x,-.015,z);parent.add(curb);const r=new THREE.Mesh(new THREE.BoxGeometry(w,.05,d),mat(0x404646));r.position.set(x,.01,z);r.receiveShadow=true;parent.add(r)}
function roads(parent,span){for(const i of[-9,-3,3,9]){road(parent,i*TILE,0,1.0,span);road(parent,0,i*TILE,span,1.0)}}
function detail(bank,parent,span){for(let i=0;i<32;i++){const a=i*2.399,r=span*.24+(i%6)*1.3,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<1.1||Math.abs(z)<1.1)continue;asset(bank,parent,i%7===0?'downtownTreeA':'pineSmall',x,0,z,a,i%7===0?.18:.28)}for(const [x,z,r,n] of[[-10,-.55,Math.PI/2,'truckGreen'],[-4,.55,-Math.PI/2,'truckGrey'],[2,-4.3,0,'truckGreen'],[9,5.1,Math.PI,'truckGrey']])asset(bank,parent,n,x,.04,z,r,.18)}

export class World3D extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.build()}
 build(){
  this.clear();this.tiles.clear();this.marchObjects.clear();const span=SIZE*TILE+8,ground=new THREE.Mesh(new THREE.PlaneGeometry(span,span),mat(0x8b9989));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;this.add(ground);roads(this,span);detail(this.bank,this,span)
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const def=worldTile(x,y),id=key(x,y),scouted=this.state.world.scouted.includes(id),owned=this.state.world.owned.includes(id),c=new THREE.Group();c.position.copy(toWorld(x,y));c.userData.tileId=id
   const hit=new THREE.Mesh(new THREE.BoxGeometry(TILE*.87,.028,TILE*.87),mat(scouted?(owned?0x62b18b:0xa4a89d):0x56635f,scouted?.09:.14));hit.position.y=.018;hit.userData.tileId=id;c.add(hit);if(owned)disk(c,.59,0x65dfad,.12,.035)
   if(scouted){
    if(id===BASE_TILE){const b=premium(this.bank,c,'large',4,0x9dffe1,Math.PI/2);const m=marker(0x55dfa7);m.position.set(.32,1.7,.1);c.add(m)}
    else if(def.kind==='settlement'){premium(this.bank,c,(def.tier??1)>4?'medium':'small',def.tier??1,FACTIONS[def.tag]?.color??0xcaa9d2,(x+y)%4*Math.PI/2);const m=marker(FACTIONS[def.tag]?.color??0xd0a2df);m.position.set(.3,1.32,.1);c.add(m)}
    else if(def.kind==='camp'&&!this.state.world.defeated.includes(id))contract(this.bank,c,def.level)
    else if(def.kind==='resource')opportunity(this.bank,c,def.resource,x,y)
    else if(hash(x,y)>.84)lightweightOffice(this.bank,c,x,y)
    else if(hash(x,y)<.13)asset(this.bank,c,'pineSmall',0,0,0,hash(x,y)*6,.22)
   }
   c.traverse(o=>o.userData.tileId=id);this.add(c);this.tiles.set(id,c)
  }
  this.refreshMarches()
 }
 refresh(){this.build()}
 refreshMarches(){for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear();for(const m of this.state.world.marches??[]){const o=this.bank.clone((m.type==='attack'||m.type==='compete')?'truckGrey':'truckGreen');o.scale.setScalar(.19);o.position.y=.05;this.add(o);this.marchObjects.set(m.id,o)}this.updateMarches(Date.now())}
 updateMarches(now){const base=toWorld(WORLD_CENTER,WORLD_CENTER);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;const [x,y]=parseTile(m.target),target=toWorld(x,y);let p=1;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning')p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));const bend=Math.sin(p*Math.PI)*.42;o.position.x=base.x+(target.x-base.x)*p+bend;o.position.z=base.z+(target.z-base.z)*p-bend;o.position.y=.05;o.rotation.y=Math.atan2(target.x-base.x,target.z-base.z)}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
