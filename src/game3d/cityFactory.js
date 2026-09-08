import * as THREE from 'three'
import { BUILDINGS } from '../data/buildings.js'

const LAYOUT={
 furnace:[0,0],shelter:[-5,4],sawmill:[5,4],huntersHut:[7,0],coalMine:[5,-5],ironMine:[9,4],storehouse:[0,7],infirmary:[-7,-1],embassy:[-5,-6],infantryCamp:[1,-7],lancerCamp:[6,-8],marksmanCamp:[9,-4],researchCenter:[-8,3],
}
const cfg={
 furnace:{style:'industrial',w:3,d:3,scale:1.15},shelter:{style:'a',w:2,d:2},sawmill:{style:'industrial',w:2,d:2},huntersHut:{style:'a',w:2,d:2},
 coalMine:{style:'industrial',w:2,d:2},ironMine:{style:'industrial',w:2,d:2},storehouse:{style:'industrial',w:3,d:2},infirmary:{style:'a',w:2,d:2},
 embassy:{style:'b',w:2,d:2},infantryCamp:{style:'military',w:2,d:2},lancerCamp:{style:'military',w:2,d:2},marksmanCamp:{style:'military',w:2,d:2},researchCenter:{style:'b',w:3,d:2},
}
function module(bank,group,name,x,y,z,rot=0,s=1){const m=bank.clone(name);m.position.set(x,y,z);m.rotation.y=rot;m.scale.setScalar(s);group.add(m);return m}
function compoundBuilding(bank,id,level){
 const c=cfg[id]??{style:'a',w:2,d:2},g=new THREE.Group(),useB=c.style==='b'||c.style==='industrial'||c.style==='military'
 const frontDoor=useB?'wallBDoor':'wallADoor',frontWindow=useB?'wallBWindow':'wallAWindow',wall=useB?'wallB':'wallA',roof=useB?'wallBRoof':'wallARoof',w=c.w,d=c.d
 for(let x=0;x<w;x++){const px=x-(w-1)/2;module(bank,g,x===0?frontDoor:frontWindow,px,0,d/2)}
 for(let x=0;x<w;x++){const px=x-(w-1)/2;module(bank,g,wall,px,0,-d/2,Math.PI)}
 for(let z=0;z<d;z++){const pz=z-(d-1)/2;module(bank,g,wall,-w/2,0,pz,Math.PI/2);module(bank,g,wall,w/2,0,pz,-Math.PI/2)}
 for(let x=0;x<w;x++)for(let z=0;z<d;z++)module(bank,g,c.style==='industrial'?'metalRoof':roof,x-(w-1)/2,1,z-(d-1)/2)
 if(id==='furnace'){
  module(bank,g,'garage',0,0,d/2+.02,0,1.02);module(bank,g,'scaffold',-2.1,0,-.6,0,.9);module(bank,g,'truckGreen',2.6,0,1.6,-Math.PI/2,.9)
  const stack=new THREE.Mesh(new THREE.CylinderGeometry(.24,.34,3.4,10),new THREE.MeshStandardMaterial({color:0x30373b,roughness:.85}));stack.position.set(1.2,2.4,-.8);stack.castShadow=true;g.add(stack)
  const glow=new THREE.PointLight(0xff7b2f,level>=8?25:14,10,2);glow.position.set(0,1.3,.9);g.add(glow)
 }else if(c.style==='industrial'){module(bank,g,'dumpster',w/2+1,0,.4,0,.9);module(bank,g,'barrier',-w/2-1,0,1,0,.8)}
 else if(c.style==='military'){module(bank,g,'barrier',-w/2-.5,0,d/2+.5,0,.85);module(bank,g,'barrier',w/2+.5,0,d/2+.5,Math.PI,.85)}
 if(level>=8)g.scale.multiplyScalar(1.04);g.scale.multiplyScalar(c.scale??1)
 g.userData.buildingId=id;g.traverse(o=>o.userData.buildingId=id);return g
}
function roadGrid(bank,root){
 const mat=new THREE.MeshStandardMaterial({color:0x353d3f,roughness:.96,metalness:.02}),edge=new THREE.MeshStandardMaterial({color:0x666b66,roughness:1})
 for(const [w,d] of [[21,2.15],[2.15,21]]){const r=new THREE.Mesh(new THREE.BoxGeometry(w,.07,d),mat);r.position.y=.025;r.receiveShadow=true;root.add(r)}
 for(const [w,d,x,z] of [[21,.16,0,-1.16],[21,.16,0,1.16],[.16,21,-1.16,0],[.16,21,1.16,0]]){const e=new THREE.Mesh(new THREE.BoxGeometry(w,.09,d),edge);e.position.set(x,.04,z);e.receiveShadow=true;root.add(e)}
}
function addTrees(bank,root,level){const count=18+Math.min(20,level*2);for(let i=0;i<count;i++){const a=(i/count)*Math.PI*2,r=11+(i%4)*1.6,t=bank.clone(i%3?'pineSmall':'pineLarge');t.position.set(Math.cos(a)*r,0,Math.sin(a)*r);t.rotation.y=a*1.7;t.scale.setScalar(.8+(i%4)*.08);root.add(t)}}
function addFoliage(bank,root){for(let i=0;i<14;i++){const a=(i/14)*Math.PI*2,r=14+(i%3)*1.35,t=bank.clone(i%2?'pineSmall':'pineLarge');t.position.set(Math.cos(a)*r,0,Math.sin(a)*r);t.rotation.y=a;t.scale.setScalar(.45+(i%3)*.08);root.add(t)}}
export function buildCity(bank,state){
 const root=new THREE.Group();root.name='cityRoot'
 const ground=new THREE.Mesh(new THREE.CircleGeometry(22,64),new THREE.MeshStandardMaterial({color:0x9fb4b2,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;root.add(ground)
 const inner=new THREE.Mesh(new THREE.CircleGeometry(10,48),new THREE.MeshStandardMaterial({color:0x73807c,roughness:1}));inner.rotation.x=-Math.PI/2;inner.position.y=.006;inner.receiveShadow=true;root.add(inner)
 roadGrid(bank,root);const furnace=state.buildings.furnace??1;addTrees(bank,root,furnace);addFoliage(bank,root)
 for(const id of Object.keys(BUILDINGS)){const level=state.buildings[id]??0;if(id!=='furnace'&&level<1)continue;const b=compoundBuilding(bank,id,Math.max(1,level)),[x,z]=LAYOUT[id]??[0,0];b.position.set(x,0,z);root.add(b)}
 for(let i=0;i<6;i++){const t=bank.clone(i%2?'truckGrey':'truckGreen');t.position.set(-7+i*2.7,0,9+(i%2)*1.6);t.rotation.y=Math.PI/2;t.scale.setScalar(.85);root.add(t)}
 return root
}
export function buildingPosition(id){const [x,z]=LAYOUT[id]??[0,0];return new THREE.Vector3(x,0,z)}
