import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,WORLD_CENTER,FACTIONS } from '../data/world.js'

const SIZE=21,TILE=1.48
const key=(x,y)=>`${x},${y}`
const toWorld=(x,y)=>new THREE.Vector3((x-WORLD_CENTER)*TILE,0,(y-WORLD_CENTER)*TILE)
const mat=(color,opts={})=>new THREE.MeshStandardMaterial({color,roughness:opts.roughness??.86,metalness:opts.metalness??.08,transparent:!!opts.transparent,opacity:opts.opacity??1,emissive:opts.emissive??0x000000,emissiveIntensity:opts.emissiveIntensity??0})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=true;o.receiveShadow=true;return o}
const cyl=(r,h,m,n=16)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,n),m);o.castShadow=true;o.receiveShadow=true;return o}

function miniTower(color=0x62b8ff,tier=1){
 const g=new THREE.Group(),base=box(.7,.18,.7,mat(0x4c585f));base.position.y=.09;g.add(base)
 const h=.55+Math.min(.55,tier*.09),body=box(.5,h,.5,mat(0x233846,{roughness:.45,metalness:.2}));body.position.y=.18+h/2;g.add(body)
 const glass=box(.52,.18,.03,mat(color,{roughness:.2,metalness:.25,emissive:color,emissiveIntensity:.12}));glass.position.set(0,.32+h*.35,.265);g.add(glass)
 const roof=box(.58,.08,.58,mat(color,{emissive:color,emissiveIntensity:.2}));roof.position.y=.22+h;g.add(roof);return g
}
function contractMarker(level=1){
 const g=new THREE.Group(),ped=cyl(.32,.12,mat(0x55616a),18);ped.position.y=.06;g.add(ped)
 const card=box(.48,.55,.08,mat(level>=5?0xff8f7f:0xf3b95f,{emissive:level>=5?0xff8f7f:0xf3b95f,emissiveIntensity:.15}));card.position.y=.45;card.rotation.y=-.35;g.add(card)
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.42,.045,8,24),mat(0xffffff,{emissive:0xffffff,emissiveIntensity:.2}));ring.rotation.x=Math.PI/2;ring.position.y=.06;g.add(ring);return g
}
function opportunity(resource){
 const colors={meat:0x54d39b,wood:0x62b8ff,coal:0xf3b95f,iron:0xc89cff},c=colors[resource]??0xffffff,g=new THREE.Group(),p=cyl(.28,.16,mat(0x4b565c),16);p.position.y=.08;g.add(p)
 if(resource==='meat'){const coin=cyl(.24,.08,mat(c,{metalness:.45,roughness:.28,emissive:c,emissiveIntensity:.08}),24);coin.rotation.x=Math.PI/2;coin.position.y=.43;g.add(coin)}
 else if(resource==='wood'){for(let i=0;i<3;i++){const crate=box(.26,.26,.26,mat(c));crate.position.set((i-1)*.23,.28+(i%2)*.2,0);g.add(crate)}}
 else if(resource==='coal'){const star=new THREE.Mesh(new THREE.OctahedronGeometry(.28,0),mat(c,{emissive:c,emissiveIntensity:.18}));star.position.y=.45;g.add(star)}
 else{for(let i=0;i<3;i++){const person=cyl(.08,.3,mat(c),12);person.position.set((i-1)*.2,.28,0);const head=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),mat(0xf0c8a5));head.position.set((i-1)*.2,.5,0);g.add(person,head)}}
 return g
}
function van(color=0x54d39b){const g=new THREE.Group(),body=box(.52,.24,.3,mat(color,{roughness:.5,metalness:.16}));body.position.y=.2;g.add(body);const cab=box(.18,.19,.3,mat(0xe8f1f3,{roughness:.28}));cab.position.set(.18,.39,0);g.add(cab);for(const x of [-.18,.18])for(const z of [-.14,.14]){const w=cyl(.055,.06,mat(0x11161a),10);w.rotation.x=Math.PI/2;w.position.set(x,.08,z);g.add(w)}return g}
function microDistrict(seed){const g=new THREE.Group(),count=1+(seed%3);for(let i=0;i<count;i++){const h=.22+(seed+i)%4*.08,b=box(.24,h,.22,mat(i%2?0x60727c:0x7b8a91,{roughness:.75}));b.position.set((i-(count-1)/2)*.25,h/2,0);g.add(b)}return g}

const regionTint=region=>({crown:0x3b6b63,north:0x425d76,east:0x685a67,south:0x5e6f54,west:0x6a604e}[region]??0x52636a)

export class World3D extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.build()}
 build(){
  this.clear();this.tiles.clear();this.marchObjects.clear()
  const basePlane=box(SIZE*TILE+4,.18,SIZE*TILE+4,mat(0x101a20,{roughness:1}));basePlane.position.y=-.35;this.add(basePlane)
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const def=worldTile(x,y),id=key(x,y),scouted=this.state.world.scouted.includes(id),owned=this.state.world.owned.includes(id),p=toWorld(x,y),c=new THREE.Group();c.position.copy(p);c.userData.tileId=id
   const base=regionTint(def.region),color=!scouted?0x17242a:owned?0x2f826c:def.faction?0x635866:base
   const tile=box(TILE*.91,.11,TILE*.91,mat(color,{roughness:.94,transparent:!scouted,opacity:scouted?1:.82}));tile.position.y=-.06;tile.userData.tileId=id;c.add(tile)
   if(owned){const line=box(TILE*.76,.018,.045,mat(0x64e5ba,{emissive:0x64e5ba,emissiveIntensity:.22}));line.position.set(0,.01,TILE*.39);c.add(line)}
   if(scouted){
    if(id===BASE_TILE){const m=miniTower(0x64e5ba,Math.max(1,Math.floor((this.state.buildings.furnace??1)/2)));m.scale.setScalar(1.45);c.add(m)}
    else if(def.kind==='settlement'){const fc=FACTIONS[def.tag]?.color??0xff8f7f,m=miniTower(fc,def.tier??1);m.scale.setScalar(1.1);c.add(m)}
    else if(def.kind==='camp'&&!this.state.world.defeated.includes(id))c.add(contractMarker(def.level))
    else if(def.kind==='resource')c.add(opportunity(def.resource))
    else if(def.kind==='wild'&&(x*5+y*3)%4===0)c.add(microDistrict(x*13+y*17))
   }
   c.traverse(o=>o.userData.tileId=id);this.add(c);this.tiles.set(id,c)
  }
  this.refreshMarches()
 }
 refresh(){this.build()}
 refreshMarches(){
  for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear()
  const colors={scout:0x62b8ff,claim:0x54d39b,gather:0xf3b95f,attack:0xff8f7f,rally:0xc89cff}
  for(const m of this.state.world.marches??[]){const obj=van(colors[m.type]??0xffffff);obj.scale.setScalar(.75);obj.position.y=.1;this.add(obj);this.marchObjects.set(m.id,obj)}
  this.updateMarches(Date.now())
 }
 updateMarches(now){const base=toWorld(WORLD_CENTER,WORLD_CENTER);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;const [x,y]=parseTile(m.target),target=toWorld(x,y);let p=1;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning')p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));o.position.x=base.x+(target.x-base.x)*p;o.position.z=base.z+(target.z-base.z)*p;o.position.y=.12;o.rotation.y=Math.atan2(target.x-base.x,target.z-base.z)}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
