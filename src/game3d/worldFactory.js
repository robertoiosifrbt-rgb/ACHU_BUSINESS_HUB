import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,WORLD_CENTER,FACTIONS } from '../data/world.js'

const SIZE=21,TILE=1.45
const key=(x,y)=>`${x},${y}`
const toWorld=(x,y)=>new THREE.Vector3((x-WORLD_CENTER)*TILE,0,(y-WORLD_CENTER)*TILE)
function material(color,opacity=1){return new THREE.MeshStandardMaterial({color,roughness:.92,transparent:opacity<1,opacity})}
function addMiniCity(bank,parent,def){
 const g=new THREE.Group(),wall=bank.clone(def.tag==='ASH'?'wallB':'wallA');wall.scale.setScalar(.7);g.add(wall)
 const roof=bank.clone(def.tag==='ASH'?'wallBRoof':'wallARoof');roof.position.y=.7;roof.scale.setScalar(.7);g.add(roof)
 g.scale.setScalar(1.2+(def.tier??1)*.05);parent.add(g);return g
}
function addResource(bank,parent,def){const map={wood:'pineLarge',meat:'pineSmall',coal:'dumpster',iron:'barrier'},a=bank.clone(map[def.resource]??'pineSmall');a.scale.setScalar(def.resource==='wood'?.45:.55);parent.add(a)}
function addCamp(bank,parent){const truck=bank.clone('truckGrey');truck.scale.setScalar(.45);truck.rotation.y=.6;parent.add(truck);const barrier=bank.clone('barrier');barrier.scale.setScalar(.48);barrier.position.set(.45,0,.32);parent.add(barrier)}

export class World3D extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.build()}
 build(){
  this.clear();this.tiles.clear();this.marchObjects.clear()
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const def=worldTile(x,y),id=key(x,y),scouted=this.state.world.scouted.includes(id),owned=this.state.world.owned.includes(id),p=toWorld(x,y)
   const c=new THREE.Group();c.position.copy(p);c.userData.tileId=id
   const tint=!scouted?0x16282d:owned?0x587d67:def.faction?0x6e5d5b:0x536669
   const tile=new THREE.Mesh(new THREE.BoxGeometry(TILE*.95,.12,TILE*.95),material(tint,scouted?1:.78));tile.position.y=-.08;tile.receiveShadow=true;tile.userData.tileId=id;c.add(tile)
   if(scouted){
    if(id===BASE_TILE){const m=addMiniCity(this.bank,c,{tag:'YOU',tier:Math.max(1,Math.floor((this.state.buildings.furnace??1)/3))});m.traverse(o=>o.userData.tileId=id)}
    else if(def.kind==='settlement'){const m=addMiniCity(this.bank,c,def),fc=FACTIONS[def.tag]?.color;if(fc)m.traverse(o=>{o.userData.tileId=id;if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.multiply(new THREE.Color(fc))}})}
    else if(def.kind==='camp'&&!this.state.world.defeated.includes(id))addCamp(this.bank,c)
    else if(def.kind==='resource')addResource(this.bank,c,def)
    else if(def.kind==='wild'&&(x*5+y*3)%4===0){const tree=this.bank.clone((x+y)%2?'pineSmall':'pineLarge');tree.scale.setScalar(.32);c.add(tree)}
   }
   c.traverse(o=>o.userData.tileId=id);this.add(c);this.tiles.set(id,c)
  }
  const frame=new THREE.Mesh(new THREE.BoxGeometry(SIZE*TILE+3,.25,SIZE*TILE+3),material(0x0b171c));frame.position.y=-.34;this.add(frame);frame.renderOrder=-2
  this.refreshMarches()
 }
 refresh(){this.build()}
 refreshMarches(){
  for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear()
  for(const m of this.state.world.marches??[]){let obj=this.bank.cloneCharacter();if(!obj){obj=new THREE.Mesh(new THREE.ConeGeometry(.18,.55,6),material(m.type==='attack'?0xd25b53:0xe0b04b));obj.position.y=.3}else{obj.scale.setScalar(.0065);obj.rotation.y=Math.PI;obj.position.y=.02}this.add(obj);this.marchObjects.set(m.id,obj)}
  this.updateMarches(Date.now())
 }
 updateMarches(now){const base=toWorld(WORLD_CENTER,WORLD_CENTER);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;const [x,y]=parseTile(m.target),target=toWorld(x,y);let p=1;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning')p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));o.position.x=base.x+(target.x-base.x)*p;o.position.z=base.z+(target.z-base.z)*p;o.position.y=.18}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
