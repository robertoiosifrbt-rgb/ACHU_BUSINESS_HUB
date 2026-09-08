import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,WORLD_CENTER,FACTIONS } from '../data/world.js'

const SIZE=21,TILE=1.62
const key=(x,y)=>`${x},${y}`
const hash=(x,y)=>Math.abs(Math.sin(x*91.17+y*47.31)*43758.5453)%1
const toWorld=(x,y)=>new THREE.Vector3((x-WORLD_CENTER)*TILE,0,(y-WORLD_CENTER)*TILE)
const mat=(color,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness:.95,transparent:opacity<1,opacity,depthWrite:opacity>.1})
function asset(bank,parent,name,x=0,y=0,z=0,rot=0,s=1){const o=bank.clone(name);o.position.set(x,y,z);o.rotation.y=rot;o.scale.setScalar(s);parent.add(o);return o}
function disk(parent,r,color,opacity=.2,y=.02){const m=new THREE.Mesh(new THREE.CircleGeometry(r,40),mat(color,opacity));m.rotation.x=-Math.PI/2;m.position.y=y;parent.add(m);return m}
function ring(parent,r,color,opacity=.28){const m=new THREE.Mesh(new THREE.RingGeometry(r*.78,r,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.032;parent.add(m);return m}
function tint(root,color){root.traverse(o=>{if(!o.isMesh||!o.material)return;const a=Array.isArray(o.material)?o.material:[o.material];o.material=Array.isArray(o.material)?a.map(m=>m?.clone?.()??m):(o.material.clone?.()??o.material);for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m?.color)m.color.multiply(new THREE.Color(color))})}

function glowPin(color){const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d'),h=`#${color.toString(16).padStart(6,'0')}`,g=x.createRadialGradient(48,48,5,48,48,43);g.addColorStop(0,'white');g.addColorStop(.18,h);g.addColorStop(.52,`${h}99`);g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,96,96);const t=new THREE.CanvasTexture(c),s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})),p=Math.random()*6;s.onBeforeRender=()=>s.scale.setScalar(.62+Math.sin(performance.now()*.004+p)*.09);return s}
function premium(bank,parent,size='small',tier=1,color=null,rot=0,scaleBoost=1){const n=size==='large'?'downtownLarge':size==='medium'?'downtownMedium':'downtownSmall',b=asset(bank,parent,n,0,0,0,rot,(.135+Math.min(8,tier)*.0055)*scaleBoost);b.traverse(o=>{if(o.isMesh)o.castShadow=false});if(color)tint(b,color);return b}
function smallOffice(bank,parent,variant=0,scale=.72){const g=new THREE.Group(),b=variant%2?'B':'A',door=`wall${b}Door`,win=`wall${b}Window`,roof=`wall${b}Roof`;asset(bank,g,door,-.38,0,.4,0,.5);asset(bank,g,win,.38,0,.4,0,.5);asset(bank,g,win,-.38,0,-.4,Math.PI,.5);asset(bank,g,win,.38,0,-.4,Math.PI,.5);asset(bank,g,roof,-.38,.51,0,0,.5);asset(bank,g,roof,.38,.51,0,0,.5);g.scale.setScalar(scale);parent.add(g);return g}

function ribbon(parent,pts,width,color,opacity=1,y=.012){const curve=new THREE.CatmullRomCurve3(pts.map(([x,z])=>new THREE.Vector3(x,y,z))),seg=56,v=[],idx=[];for(let i=0;i<=seg;i++){const t=i/seg,p=curve.getPoint(t),tan=curve.getTangent(t),n=new THREE.Vector3(-tan.z,0,tan.x).normalize().multiplyScalar(width/2);v.push(p.x+n.x,p.y,p.z+n.z,p.x-n.x,p.y,p.z-n.z);if(i<seg){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();const material=mat(color,opacity);material.side=THREE.DoubleSide;const m=new THREE.Mesh(geo,material);m.receiveShadow=true;parent.add(m);return curve}
function roadNetwork(parent){return[
 ribbon(parent,[[-19,-13],[-12,-8],[-7,-3],[-1,-1],[7,1],[15,6],[20,12]],1.55,0x444a49),
 ribbon(parent,[[-20,8],[-12,6],[-5,4],[0,-1],[3,-8],[7,-15],[10,-20]],1.45,0x454b4a),
 ribbon(parent,[[-17,17],[-10,12],[-3,9],[5,8],[12,10],[19,15]],1.35,0x454b4a),
 ribbon(parent,[[-17,-18],[-11,-12],[-6,-7],[-1,-1],[-2,6],[-5,13],[-8,19]],1.3,0x454b4a),
 ribbon(parent,[[-3,-20],[0,-12],[4,-6],[8,1],[12,7],[14,15]],1.2,0x454b4a)
]}
function park(bank,parent,x,z,r=2.3){const g=new THREE.Group();g.position.set(x,0,z);disk(g,r,0x73977b,1,.006);for(let i=0;i<7;i++){const a=i*2.399,rr=r*.3+(i%3)*.48;asset(bank,g,i%3===0?'downtownTreeA':'pineSmall',Math.cos(a)*rr,0,Math.sin(a)*rr,a,i%3===0?.16:.25)}parent.add(g)}
function landmark(bank,parent,x,z,size,rot,variant=0){const g=new THREE.Group();g.position.set(x,0,z);premium(bank,g,size,variant+1,null,rot,size==='medium'?1.04:.96);if(variant%2===0)asset(bank,g,'downtownTreeA',1.3,0,-.9,.3,.16);if(variant%3===0)asset(bank,g,'pineSmall',-1.1,0,.9,-.2,.22);parent.add(g)}
function tinyBlock(bank,parent,x,z,variant=0){const g=new THREE.Group();g.position.set(x,0,z);smallOffice(bank,g,variant,.62);if(variant%2){const b=smallOffice(bank,g,variant+1,.52);b.position.set(1.05,0,.55)}if(variant%3===0)asset(bank,g,'pineSmall',-.9,0,-.55,.2,.2);parent.add(g)}
function cityBackdrop(bank,parent){
 disk(parent,7.5,0x879b8c,.16,.004);disk(parent,5.1,0xb2a983,.12,.006)
 const landmarks=[[-15,-9,'medium',.35,1],[-12,12,'small',1.2,2],[13,12,'medium',-1.0,3],[16,-8,'small',2.4,4],[3,16,'small',-.5,5],[-4,-15,'medium',.8,6]]
 landmarks.forEach(v=>landmark(bank,parent,...v))
 const blocks=[[-15,4,1],[-8,13,2],[8,-13,3],[14,3,4],[-11,-13,5],[-7,7,6],[9,7,7]]
 blocks.forEach(v=>tinyBlock(bank,parent,...v))
 park(bank,parent,-13,-2,2.5);park(bank,parent,12,-2,2.25);park(bank,parent,1,12,2.05)
}
function opportunityMoment(bank,parent,resource,x,y,featured){
 const colors={meat:0x55dfa7,wood:0x65b9ff,coal:0xffc65d,iron:0xce9eff},c=colors[resource]??0x8bcfc0
 if(!featured){if(hash(x,y)<.1)asset(bank,parent,'pineSmall',0,0,0,hash(x,y)*6,.18);return}
 ring(parent,.68,c,.38);const m=glowPin(c);m.position.set(.3,.84,.08);parent.add(m)
 if(resource==='meat'){asset(bank,parent,'truckGreen',-.1,.02,.15,.45,.17);asset(bank,parent,'barrier',.38,.01,-.2,-.3,.14)}
 else if(resource==='wood'){asset(bank,parent,'truckGrey',-.22,.02,.2,.3,.16);asset(bank,parent,'dumpster',.28,.01,-.2,-.2,.14)}
 else if(resource==='coal'){const o=smallOffice(bank,parent,(x+y)%4,.52);o.position.set(-.05,0,-.05);asset(bank,parent,'truckGreen',.34,.02,.35,-.55,.12)}
 else {const o=smallOffice(bank,parent,(x+y+1)%4,.5);o.position.set(-.1,0,-.05);asset(bank,parent,'downtownAC',.35,.01,.28,.2,.2)}
}
function contract(bank,parent,level=1){const c=level>=5?0xff7f6f:0xffb85d;ring(parent,.72,c,.46);if(level>=5)premium(bank,parent,'small',level,null,.25,.72);else asset(bank,parent,'scaffold',0,0,0,.2,.22);asset(bank,parent,'truckGrey',-.32,.02,.3,.45,.15);const m=glowPin(c);m.position.set(.32,1.0,.1);parent.add(m)}
function invisibleHit(parent,id){const h=new THREE.Mesh(new THREE.PlaneGeometry(TILE*.94,TILE*.94),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,depthWrite:false,side:THREE.DoubleSide}));h.rotation.x=-Math.PI/2;h.position.y=.05;h.userData.tileId=id;parent.add(h)}

function addAmbientTraffic(bank,parent,curves){const traffic=[];for(let i=0;i<5;i++){const o=bank.clone(i%3?'truckGreen':'truckGrey');o.scale.setScalar(.16+(i%2)*.015);o.position.y=.05;parent.add(o);traffic.push({view:o,curve:curves[i%curves.length],offset:i*.19,speed:.000018+i*.000002})}return traffic}
function updateAmbientTraffic(traffic,now){for(const t of traffic??[]){const p=(t.offset+now*t.speed)%1,pos=t.curve.getPoint(p),tan=t.curve.getTangent(p);t.view.position.set(pos.x,.05,pos.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)}}

export class World3D extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.traffic=[];this.build()}
 build(){
  this.clear();this.tiles.clear();this.marchObjects.clear();this.traffic=[];const span=SIZE*TILE+12,ground=new THREE.Mesh(new THREE.PlaneGeometry(span,span),mat(0x9ba999));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;this.add(ground)
  const curves=roadNetwork(this);cityBackdrop(this.bank,this);this.traffic=addAmbientTraffic(this.bank,this,curves)
  const ownedSet=new Set(this.state.world.owned),scoutedSet=new Set(this.state.world.scouted)
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const def=worldTile(x,y),id=key(x,y),scouted=scoutedSet.has(id),owned=ownedSet.has(id),p=toWorld(x,y),c=new THREE.Group();c.position.copy(p);c.userData.tileId=id;invisibleHit(c,id)
   const adjacentOwned=[`${x+1},${y}`,`${x-1},${y}`,`${x},${y+1}`,`${x},${y-1}`].some(n=>ownedSet.has(n))
   if(owned){disk(c,.74,0x55c794,.10,.022);ring(c,.73,0x57d7a4,.18)}
   if(scouted){
    if(id===BASE_TILE){premium(this.bank,c,'large',5,0x9dffe1,Math.PI/2,.92);ring(c,1.05,0x55dfa7,.42);const m=glowPin(0x55dfa7);m.position.set(.42,1.75,.1);c.add(m)}
    else if(def.kind==='settlement'){premium(this.bank,c,(def.tier??1)>4?'medium':'small',def.tier??1,FACTIONS[def.tag]?.color??0xcaa9d2,(x+y)%4*Math.PI/2,.9);ring(c,.78,FACTIONS[def.tag]?.color??0xd0a2df,.34);const m=glowPin(FACTIONS[def.tag]?.color??0xd0a2df);m.position.set(.32,1.2,.1);c.add(m)}
    else if(def.kind==='camp'&&!this.state.world.defeated.includes(id))contract(this.bank,c,def.level)
    else if(def.kind==='resource')opportunityMoment(this.bank,c,def.resource,x,y,owned||adjacentOwned)
    else if(hash(x,y)<.12)asset(this.bank,c,'pineSmall',0,0,0,hash(x,y)*6,.18)
   }else if(adjacentOwned){const m=glowPin(0x9bd9c3);m.material.opacity=.38;m.position.set(0,.34,0);m.scale.setScalar(.25);c.add(m)}
   c.traverse(o=>{if(o.userData)o.userData.tileId=id});this.add(c);this.tiles.set(id,c)
  }
  this.refreshMarches();updateAmbientTraffic(this.traffic,Date.now())
 }
 refresh(){this.build()}
 refreshMarches(){for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear();for(const m of this.state.world.marches??[]){const o=this.bank.clone((m.type==='attack'||m.type==='compete')?'truckGrey':'truckGreen');o.scale.setScalar(.19);o.position.y=.05;this.add(o);this.marchObjects.set(m.id,o)}this.updateMarches(Date.now())}
 updateMarches(now){updateAmbientTraffic(this.traffic,now);const base=toWorld(WORLD_CENTER,WORLD_CENTER);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;const [x,y]=parseTile(m.target),target=toWorld(x,y);let p=1;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning')p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));const bend=Math.sin(p*Math.PI)*.45;o.position.x=base.x+(target.x-base.x)*p+bend;o.position.z=base.z+(target.z-base.z)*p-bend;o.position.y=.05;o.rotation.y=Math.atan2(target.x-base.x,target.z-base.z)}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
