import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,WORLD_CENTER,FACTIONS } from '../data/world.js'

const SIZE=21,TILE=1.72
const key=(x,y)=>`${x},${y}`
const hash=(x,y,s=0)=>Math.abs(Math.sin(x*91.17+y*47.31+s*17.71)*43758.5453)%1
const toWorld=(x,y)=>new THREE.Vector3((x-WORLD_CENTER)*TILE,0,(y-WORLD_CENTER)*TILE)
const material=(color,rough=.78,metal=.03)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})
const transparent=(color,opacity)=>new THREE.MeshStandardMaterial({color,roughness:.9,transparent:true,opacity,depthWrite:false})

function add(parent,mesh,x=0,y=0,z=0,rot=0){mesh.position.set(x,y,z);mesh.rotation.y=rot;parent.add(mesh);return mesh}
function box(w,h,d,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.castShadow=true;m.receiveShadow=true;return m}
function disk(parent,r,color,opacity=.14,y=.015){const m=new THREE.Mesh(new THREE.CircleGeometry(r,48),transparent(color,opacity));m.rotation.x=-Math.PI/2;m.position.y=y;parent.add(m);return m}
function ring(parent,r,color,opacity=.5){const m=new THREE.Mesh(new THREE.RingGeometry(r*.78,r,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.055;parent.add(m);return m}

function labelSprite(text,color=0xffffff,small=false){
 const c=document.createElement('canvas');c.width=small?512:768;c.height=128;const x=c.getContext('2d')
 x.fillStyle='rgba(12,25,23,.78)';x.roundRect(10,16,c.width-20,96,24);x.fill();x.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;x.lineWidth=3;x.stroke()
 x.fillStyle='#fff';x.font=`800 ${small?27:31}px Inter,Arial`;x.textAlign='center';x.textBaseline='middle';x.fillText(text.toUpperCase(),c.width/2,64,c.width-54)
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(small?3.7:5.2,small?.92:1.05,1);return s
}
function glow(color){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),h=`#${color.toString(16).padStart(6,'0')}`,g=x.createRadialGradient(64,64,4,64,64,60);g.addColorStop(0,'white');g.addColorStop(.16,h);g.addColorStop(.5,`${h}99`);g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));s.userData.pulse=Math.random()*6;return s}

function modernBuilding(parent,x,z,{w=2,d=2,h=4,color=0xc9c8c1,glass=0x406a72,accent=0x53c7a0,rot=0}={}){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot
 const base=box(w,h,d,material(color,.7,.04));base.position.y=h/2;g.add(base)
 const plinth=box(w*1.06,.18,d*1.06,material(0x555d59,.9,.02));plinth.position.y=.09;g.add(plinth)
 const glassMat=new THREE.MeshStandardMaterial({color:glass,roughness:.2,metalness:.22,emissive:glass,emissiveIntensity:.035})
 const rows=Math.max(2,Math.floor(h/.7));for(let i=0;i<rows;i++){
  const y=.45+i*(h-.7)/(rows-1)
  const front=box(w*.72,.12,.025,glassMat);front.position.set(0,y,d/2+.014);g.add(front)
  const side=box(.025,.12,d*.64,glassMat);side.position.set(w/2+.014,y,0);g.add(side)
 }
 const cap=box(w*.86,.15,d*.86,material(accent,.5,.14));cap.position.y=h+.075;g.add(cap)
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});parent.add(g);return g
}
function lowCommercial(parent,x,z,accent=0x53c7a0,rot=0){return modernBuilding(parent,x,z,{w:2.35,d:1.8,h:1.65,color:0xd8d6ce,glass:0x3c6269,accent,rot})}
function tree(parent,x,z,s=1){const g=new THREE.Group();const trunk=box(.13,.7,.13,material(0x624836,1));trunk.position.y=.35;g.add(trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.52*s,1),material(0x4c8064,.95));crown.scale.y=1.35;crown.position.y=1.02*s;g.add(crown);g.position.set(x,0,z);parent.add(g);return g}
function vehicle(parent,x,z,color=0x3aa37c,rot=0,s=1){const g=new THREE.Group();const body=box(.88*s,.33*s,.43*s,material(color,.42,.12));body.position.y=.29*s;g.add(body);const cab=box(.35*s,.28*s,.39*s,material(0xd8e4e1,.25,.05));cab.position.set(.21*s,.52*s,0);g.add(cab);for(const dx of[-.27,.27])for(const dz of[-.2,.2]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.09*s,.09*s,.06*s,12),material(0x1f2423,.95));wheel.rotation.x=Math.PI/2;wheel.position.set(dx*s,.16*s,dz*s);g.add(wheel)}g.position.set(x,0,z);g.rotation.y=rot;parent.add(g);return g}

function ribbon(parent,pts,width,color,y=.012){
 const curve=new THREE.CatmullRomCurve3(pts.map(([x,z])=>new THREE.Vector3(x,y,z))),seg=72,v=[],idx=[]
 for(let i=0;i<=seg;i++){const p=curve.getPoint(i/seg),tan=curve.getTangent(i/seg),n=new THREE.Vector3(-tan.z,0,tan.x).normalize().multiplyScalar(width/2);v.push(p.x+n.x,p.y,p.z+n.z,p.x-n.x,p.y,p.z-n.z);if(i<seg){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.setIndex(idx);geo.computeVertexNormals();const m=new THREE.Mesh(geo,material(color,.96));m.receiveShadow=true;parent.add(m);return curve
}
function roadNetwork(parent){return[
 ribbon(parent,[[-22,-14],[-14,-9],[-7,-4],[0,-1],[8,2],[15,8],[22,14]],1.7,0x4b514f),
 ribbon(parent,[[-22,8],[-14,7],[-6,4],[0,-1],[4,-9],[8,-16],[12,-22]],1.55,0x4a504e),
 ribbon(parent,[[-18,18],[-10,12],[-2,9],[6,9],[14,11],[21,17]],1.45,0x4c5250),
 ribbon(parent,[[-18,-20],[-12,-13],[-7,-7],[0,-1],[-2,7],[-6,15],[-10,22]],1.4,0x4a504e)
]}
function district(parent,x,z,r,name,color){disk(parent,r,color,.095,.006);const s=labelSprite(name,color,true);s.position.set(x,.48,z);parent.add(s)}
function cityBackdrop(parent){
 district(parent,-11,-9,7.4,'Riverside',0x5fb08a);district(parent,10,-9,7.2,'Business Park',0x78a7d4);district(parent,-10,10,7,'West End',0xc49a6c);district(parent,10,10,7.3,'Central',0x9d84c7)
 const blocks=[[-16,-12,3.2,1.8,4.5],[-12,-14,2.2,2.5,3.4],[-8,-11,2.5,2.2,5.2],[-15,8,2.4,2,4],[-11,13,2.8,2.4,5.6],[-6,11,2.2,2.1,3.8],[8,13,2.7,2.4,5.5],[13,11,2.3,2.1,3.4],[16,7,2.5,2.2,4.8],[8,-13,2.7,2.2,4.3],[13,-10,2.5,2.4,5.8],[16,-14,2.2,2.0,3.6]]
 blocks.forEach(([x,z,w,d,h],i)=>modernBuilding(parent,x,z,{w,d,h,color:i%2?0xceccc4:0xbfc6c2,glass:i%3?0x45676c:0x4b596d,accent:i%4===0?0x56caa2:0xa6b1ac,rot:(i%4)*Math.PI/2}))
 for(let i=0;i<26;i++){const a=i*2.399,r=14+(i%5)*1.45;tree(parent,Math.cos(a)*r,Math.sin(a)*r,.7+(i%3)*.08)}
}
function opportunity(parent,resource,x,y,featured){
 const colors={meat:0x4bd39e,wood:0x62aee8,coal:0xf2b956,iron:0xb98be5},c=colors[resource]??0x8bcfc0
 if(!featured){if(hash(x,y)<.08)tree(parent,0,0,.48);return}
 ring(parent,.72,c,.5);const pin=glow(c);pin.position.set(.28,.95,.05);parent.add(pin)
 if(resource==='meat'){lowCommercial(parent,-.08,.02,c,.2);vehicle(parent,.5,.38,0x3aa37c,-.4,.6)}
 else if(resource==='wood'){const depot=box(1.25,.72,.95,material(0xb8b9b4,.86));depot.position.y=.36;parent.add(depot);vehicle(parent,.4,.35,0x6e7c83,-.5,.6)}
 else if(resource==='coal'){const board=box(1.15,.72,.08,material(0x263b37,.48,.1));board.position.set(0,.65,0);parent.add(board);const stripe=box(.86,.08,.09,material(c,.4,.15));stripe.position.set(0,.67,.05);parent.add(stripe)}
 else {modernBuilding(parent,0,0,{w:1.15,d:1.05,h:1.25,color:0xd3cddb,glass:0x4d6078,accent:c});}
}
function contract(parent,level=1){const c=level>=5?0xef7767:0xf0a64d;ring(parent,.78,c,.58);lowCommercial(parent,0,0,c,.25);const pin=glow(c);pin.position.set(.32,1.45,.08);parent.add(pin);const l=labelSprite(level>=5?'PREMIUM TENDER':'CONTRACT',c,true);l.scale.multiplyScalar(.55);l.position.set(0,1.65,0);parent.add(l)}
function rival(parent,tier,color,name){modernBuilding(parent,0,0,{w:1.45,d:1.25,h:1.5+Math.min(5,tier)*.34,color:0xb8bec0,glass:0x45545e,accent:color,rot:.25});ring(parent,.84,color,.48);const l=labelSprite(name??'RIVAL',color,true);l.scale.multiplyScalar(.55);l.position.set(0,2.2,0);parent.add(l)}
function hitPlane(parent,id){const h=new THREE.Mesh(new THREE.PlaneGeometry(TILE*.94,TILE*.94),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));h.rotation.x=-Math.PI/2;h.position.y=.07;h.userData.tileId=id;parent.add(h)}
function addTraffic(parent,curves){const traffic=[];for(let i=0;i<7;i++){const v=vehicle(parent,0,0,i%2?0x3b9f7b:0x69777d,0,.72);traffic.push({view:v,curve:curves[i%curves.length],offset:i*.143,speed:.000012+i*.0000015})}return traffic}
function moveTraffic(traffic,now){for(const t of traffic??[]){const p=(t.offset+now*t.speed)%1,pos=t.curve.getPoint(p),tan=t.curve.getTangent(p);t.view.position.set(pos.x,.03,pos.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)}}

export class World3D4X extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.traffic=[];this.build()}
 build(){
  this.clear();this.tiles.clear();this.marchObjects.clear();const span=SIZE*TILE+14
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(span,span),material(0xaebbb2,1));ground.rotation.x=-Math.PI/2;ground.position.y=-.09;ground.receiveShadow=true;this.add(ground)
  const curves=roadNetwork(this);cityBackdrop(this);this.traffic=addTraffic(this,curves)
  const owned=new Set(this.state.world.owned??[]),scouted=new Set(this.state.world.scouted??[])
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const def=worldTile(x,y),id=key(x,y),known=scouted.has(id),ours=owned.has(id),p=toWorld(x,y),g=new THREE.Group();g.position.copy(p);g.userData.tileId=id;hitPlane(g,id)
   const adjacentOwned=[`${x+1},${y}`,`${x-1},${y}`,`${x},${y+1}`,`${x},${y-1}`].some(n=>owned.has(n))
   if(ours){disk(g,.76,0x45c996,.13,.026);ring(g,.74,0x4ed6a0,.24)}
   if(known){
    if(id===BASE_TILE){modernBuilding(g,0,0,{w:1.7,d:1.5,h:3.05,color:0xd8dad5,glass:0x355c61,accent:0x4fd4a1,rot:.15});ring(g,1.05,0x52d9a6,.66);const l=labelSprite('ACHU HQ',0x52d9a6,true);l.scale.multiplyScalar(.65);l.position.set(0,3.35,0);g.add(l)}
    else if(def.kind==='settlement')rival(g,def.tier??1,FACTIONS[def.tag]?.color??0xc397d3,FACTIONS[def.tag]?.name??'Competitor')
    else if(def.kind==='camp'&&!this.state.world.defeated.includes(id))contract(g,def.level)
    else if(def.kind==='resource')opportunity(g,def.resource,x,y,ours||adjacentOwned)
    else if(hash(x,y)<.11)tree(g,0,0,.48)
   }else if(adjacentOwned){const p=glow(0xa5e4cd);p.material.opacity=.42;p.position.set(0,.35,0);p.scale.setScalar(.32);g.add(p)}
   g.traverse(o=>{o.userData.tileId=id});this.add(g);this.tiles.set(id,g)
  }
  this.refreshMarches();moveTraffic(this.traffic,Date.now())
 }
 refresh(){this.build()}
 refreshMarches(){for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear();for(const m of this.state.world.marches??[]){const o=vehicle(this,0,0,m.type==='attack'?0x74828a:0x3ba47f,0,.82);this.marchObjects.set(m.id,o)}this.updateMarches(Date.now())}
 updateMarches(now){moveTraffic(this.traffic,now);const base=toWorld(WORLD_CENTER,WORLD_CENTER);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;const [x,y]=parseTile(m.target),target=toWorld(x,y);let p=1;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning')p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));const bend=Math.sin(p*Math.PI)*.55;o.position.set(base.x+(target.x-base.x)*p+bend,.03,base.z+(target.z-base.z)*p-bend);o.rotation.y=Math.atan2(target.x-base.x,target.z-base.z)}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
