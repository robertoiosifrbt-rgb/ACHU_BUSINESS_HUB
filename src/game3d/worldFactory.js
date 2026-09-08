import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,WORLD_CENTER,FACTIONS } from '../data/world.js'

const SIZE=21,TILE=1.45
const key=(x,y)=>`${x},${y}`
const toWorld=(x,y)=>new THREE.Vector3((x-WORLD_CENTER)*TILE,0,(y-WORLD_CENTER)*TILE)
function material(color,opacity=1,metalness=0){return new THREE.MeshStandardMaterial({color,roughness:metalness?.58:.94,metalness,transparent:opacity<1,opacity,depthWrite:opacity>.05})}
function disk(parent,r,color,opacity=.22,y=-.015){const m=new THREE.Mesh(new THREE.CircleGeometry(r,28),material(color,opacity));m.rotation.x=-Math.PI/2;m.position.y=y;m.receiveShadow=true;parent.add(m);return m}
function addMiniCity(bank,parent,def){
 const g=new THREE.Group(),wall=bank.clone(def.tag==='ASH'?'wallB':'wallA');wall.scale.setScalar(.7);g.add(wall)
 const roof=bank.clone(def.tag==='ASH'?'wallBRoof':'wallARoof');roof.position.y=.7;roof.scale.setScalar(.7);g.add(roof)
 const light=new THREE.PointLight(def.tag==='ASH'?0xc86a5c:0xe9bd67,4.5,3.2,2);light.position.set(0,.9,.25);g.add(light)
 g.scale.setScalar(1.2+(def.tier??1)*.05);parent.add(g);return g
}
function addTree(bank,parent,name,x,z,s){const t=bank.clone(name);t.position.set(x,0,z);t.rotation.y=(x*7+z*11);t.scale.setScalar(s);parent.add(t)}
function ore(parent,color,metalness,x,z,s=.17){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),material(color,1,metalness));rock.position.set(x,s*.75,z);rock.rotation.set(x*3,z*2,x-z);rock.castShadow=true;parent.add(rock)}
function addResource(bank,parent,def){
 const g=new THREE.Group();disk(g,.58,def.resource==='wood'?0x55765f:def.resource==='meat'?0x75684f:def.resource==='coal'?0x3c4548:0x687d82,.32)
 if(def.resource==='wood'){
  addTree(bank,g,'pineLarge',-.22,.08,.31);addTree(bank,g,'pineSmall',.22,.18,.27);addTree(bank,g,'pineSmall',-.05,-.24,.24);addTree(bank,g,'pineSmall',.32,-.18,.20)
 }else if(def.resource==='meat'){
  addTree(bank,g,'pineSmall',-.34,-.18,.22);addTree(bank,g,'pineSmall',.35,-.22,.19);const truck=bank.clone('truckGreen');truck.position.set(0,.02,.08);truck.rotation.y=.45;truck.scale.setScalar(.25);g.add(truck);const b=bank.clone('barrier');b.position.set(.25,0,.34);b.rotation.y=-.6;b.scale.setScalar(.22);g.add(b)
 }else if(def.resource==='coal'){
  [[-.28,.04,.18],[.02,.18,.21],[.28,.02,.16],[-.08,-.22,.19],[.25,-.22,.14]].forEach(([x,z,s])=>ore(g,0x202a2d,.12,x,z,s));const d=bank.clone('dumpster');d.position.set(-.34,0,.3);d.scale.setScalar(.22);g.add(d)
 }else{
  [[-.3,.04,.18],[0,.2,.21],[.3,.02,.17],[-.09,-.23,.19],[.25,-.2,.15]].forEach(([x,z,s])=>ore(g,0x8ea3a8,.72,x,z,s));const truck=bank.clone('truckGrey');truck.position.set(-.27,.01,.31);truck.rotation.y=.75;truck.scale.setScalar(.22);g.add(truck)
 }
 const beacon=new THREE.PointLight(def.resource==='coal'?0xe1a45a:def.resource==='iron'?0xa9d9e9:0xd4b56a,2.2,2.3,2);beacon.position.set(0,.45,0);g.add(beacon);parent.add(g);return g
}
function addCamp(bank,parent){const g=new THREE.Group();disk(g,.62,0x735c4d,.3);const truck=bank.clone('truckGrey');truck.scale.setScalar(.35);truck.rotation.y=.6;truck.position.set(-.12,0,.05);g.add(truck);for(const [x,z,r] of [[.38,.25,.2],[-.35,.33,-.35],[.32,-.28,.7]]){const barrier=bank.clone('barrier');barrier.scale.setScalar(.27);barrier.position.set(x,0,z);barrier.rotation.y=r;g.add(barrier)}const fire=new THREE.PointLight(0xff8b42,5,2.5,2);fire.position.set(.15,.32,-.08);g.add(fire);parent.add(g);return g}
function terrainDisk(radius,color,y=-.16){const m=new THREE.Mesh(new THREE.CircleGeometry(radius,96),material(color));m.rotation.x=-Math.PI/2;m.position.y=y;m.receiveShadow=true;return m}
function addWorldDetail(bank,parent,span){
 for(let i=0;i<38;i++){const a=i*2.399,r=span*.23+(i%7)*1.75,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<2&&Math.abs(z)<2)continue;addTree(bank,parent,i%4?'pineSmall':'pineLarge',x,z,.22+(i%3)*.045)}
 for(let i=0;i<13;i++){const p=new THREE.Mesh(new THREE.CircleGeometry(1.4+(i%4)*.48,28),material(i%2?0x617875:0x506965,.13));p.rotation.x=-Math.PI/2;p.position.set(Math.cos(i*1.73)*(5+(i%5)*2.4),-.18,Math.sin(i*1.73)*(5+(i%4)*2.8));p.scale.y=.72;p.receiveShadow=true;parent.add(p)}
}

export class World3D extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.build()}
 build(){
  this.clear();this.tiles.clear();this.marchObjects.clear();const span=SIZE*TILE
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(span+9,span+9),material(0x304b4b));ground.rotation.x=-Math.PI/2;ground.position.y=-.22;ground.receiveShadow=true;this.add(ground)
  this.add(terrainDisk(span*.54,0x48615d,-.205),terrainDisk(span*.37,0x526b64,-.195));addWorldDetail(this.bank,this,span)
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
   const def=worldTile(x,y),id=key(x,y),scouted=this.state.world.scouted.includes(id),owned=this.state.world.owned.includes(id),p=toWorld(x,y),c=new THREE.Group();c.position.copy(p);c.userData.tileId=id
   const hit=new THREE.Mesh(new THREE.BoxGeometry(TILE*.98,.08,TILE*.98),material(0xffffff,0));hit.position.y=-.03;hit.userData.tileId=id;c.add(hit)
   if(scouted&&owned)disk(c,TILE*.43,0x78a987,.12,-.012)
   if(scouted){
    if(id===BASE_TILE){const m=addMiniCity(this.bank,c,{tag:'YOU',tier:Math.max(1,Math.floor((this.state.buildings.furnace??1)/3))});m.traverse(o=>o.userData.tileId=id)}
    else if(def.kind==='settlement'){const m=addMiniCity(this.bank,c,def),fc=FACTIONS[def.tag]?.color;if(fc)m.traverse(o=>{o.userData.tileId=id;if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.multiply(new THREE.Color(fc))}})}
    else if(def.kind==='camp'&&!this.state.world.defeated.includes(id))addCamp(this.bank,c)
    else if(def.kind==='resource')addResource(this.bank,c,def)
    else if(def.kind==='wild'&&(x*5+y*3)%5===0){addTree(this.bank,c,(x+y)%2?'pineSmall':'pineLarge',0,0,.22)}
   }
   c.traverse(o=>o.userData.tileId=id);this.add(c);this.tiles.set(id,c)
  }
  this.refreshMarches()
 }
 refresh(){this.build()}
 refreshMarches(){
  for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear()
  for(const m of this.state.world.marches??[]){let obj=this.bank.cloneCharacter();if(!obj){obj=new THREE.Mesh(new THREE.ConeGeometry(.18,.55,6),material(m.type==='attack'?0xd25b53:0xe0b04b));obj.position.y=.3}else{obj.scale.setScalar(.0065);obj.rotation.y=Math.PI;obj.position.y=.02}this.add(obj);this.marchObjects.set(m.id,obj)}this.updateMarches(Date.now())
 }
 updateMarches(now){const base=toWorld(WORLD_CENTER,WORLD_CENTER);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;const [x,y]=parseTile(m.target),target=toWorld(x,y);let p=1;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning')p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));o.position.x=base.x+(target.x-base.x)*p;o.position.z=base.z+(target.z-base.z)*p;o.position.y=.18}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
