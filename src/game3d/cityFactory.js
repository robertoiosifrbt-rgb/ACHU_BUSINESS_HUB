import * as THREE from 'three'
import { BUILDINGS } from '../data/buildings.js'

const LAYOUT={furnace:[0,0],shelter:[-5,4],sawmill:[5,4],huntersHut:[7,0],coalMine:[5,-5],ironMine:[9,4],storehouse:[0,7],infirmary:[-7,-1],embassy:[-5,-6],infantryCamp:[1,-7],lancerCamp:[6,-8],marksmanCamp:[9,-4],researchCenter:[-8,3]}
const cfg={furnace:{style:'industrial',w:3,d:3,scale:1.15},shelter:{style:'a',w:2,d:2},sawmill:{style:'industrial',w:2,d:2},huntersHut:{style:'a',w:2,d:2},coalMine:{style:'industrial',w:2,d:2},ironMine:{style:'industrial',w:2,d:2},storehouse:{style:'industrial',w:3,d:2},infirmary:{style:'a',w:2,d:2},embassy:{style:'b',w:2,d:2},infantryCamp:{style:'military',w:2,d:2},lancerCamp:{style:'military',w:2,d:2},marksmanCamp:{style:'military',w:2,d:2},researchCenter:{style:'b',w:3,d:2}}
function module(bank,group,name,x,y,z,rot=0,s=1){const m=bank.clone(name);m.position.set(x,y,z);m.rotation.y=rot;m.scale.setScalar(s);group.add(m);return m}
function tagBuilding(root,id){root.userData.buildingId=id;root.traverse(o=>o.userData.buildingId=id);return root}
function compoundBuilding(bank,id,level){
 const c=cfg[id]??{style:'a',w:2,d:2},g=new THREE.Group(),useB=c.style==='b'||c.style==='industrial'||c.style==='military',frontDoor=useB?'wallBDoor':'wallADoor',frontWindow=useB?'wallBWindow':'wallAWindow',wall=useB?'wallB':'wallA',roof=useB?'wallBRoof':'wallARoof',w=c.w,d=c.d
 for(let x=0;x<w;x++){const px=x-(w-1)/2;module(bank,g,x===0?frontDoor:frontWindow,px,0,d/2)}for(let x=0;x<w;x++){const px=x-(w-1)/2;module(bank,g,wall,px,0,-d/2,Math.PI)}for(let z=0;z<d;z++){const pz=z-(d-1)/2;module(bank,g,wall,-w/2,0,pz,Math.PI/2);module(bank,g,wall,w/2,0,pz,-Math.PI/2)}for(let x=0;x<w;x++)for(let z=0;z<d;z++)module(bank,g,c.style==='industrial'?'metalRoof':roof,x-(w-1)/2,1,z-(d-1)/2)
 if(id==='furnace'){module(bank,g,'garage',0,0,d/2+.02,0,1.02);module(bank,g,'scaffold',-2.05,0,-.55,0,.86);const stack=new THREE.Mesh(new THREE.CylinderGeometry(.24,.34,3.4,10),new THREE.MeshStandardMaterial({color:0x2b3031,roughness:.78,metalness:.3}));stack.position.set(1.2,2.4,-.8);stack.castShadow=true;g.add(stack);const glow=new THREE.PointLight(0xff792d,level>=8?30:18,12,2);glow.position.set(0,1.35,.9);g.add(glow)}
 else if(c.style==='industrial'){module(bank,g,'dumpster',w/2+.72,0,.2,0,.72)}else if(c.style==='military'){module(bank,g,'barrier',-w/2-.42,0,d/2+.38,0,.72);module(bank,g,'barrier',w/2+.42,0,d/2+.38,Math.PI,.72)}
 if(level>=8)g.scale.multiplyScalar(1.04);g.scale.multiplyScalar(c.scale??1);return tagBuilding(g,id)
}
function constructionPlot(bank,id,active=false){
 const c=cfg[id]??{w:2,d:2},g=new THREE.Group(),w=c.w+1.05,d=c.d+1.05,base=new THREE.Mesh(new THREE.BoxGeometry(w,.14,d),new THREE.MeshStandardMaterial({color:active?0x695b43:0x536965,roughness:1}));base.position.y=.055;base.receiveShadow=true;g.add(base)
 const inner=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.5,w-.38),.05,Math.max(.5,d-.38)),new THREE.MeshStandardMaterial({color:active?0x9a763f:0x6f827c,roughness:1}));inner.position.y=.13;inner.receiveShadow=true;g.add(inner)
 const marker=new THREE.Mesh(new THREE.TorusGeometry(.42,.075,8,28),new THREE.MeshStandardMaterial({color:active?0xffb84d:0xe8c66f,emissive:active?0x7a3a08:0x382d0a,emissiveIntensity:active?1.1:.5,roughness:.65}));marker.rotation.x=Math.PI/2;marker.position.y=.22;g.add(marker)
 if(active){module(bank,g,'scaffold',0,.14,0,0,.82);const light=new THREE.PointLight(0xffa33b,10,5,2);light.position.set(0,1.2,0);g.add(light)}else{const post=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,.8,8),new THREE.MeshStandardMaterial({color:0x334244,roughness:.9}));post.position.set(0,.5,0);g.add(post);const cap=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),new THREE.MeshStandardMaterial({color:0xe8c66c,emissive:0x4c3908,emissiveIntensity:.45}));cap.position.set(0,.92,0);g.add(cap)}return tagBuilding(g,id)
}
function decorateConstruction(bank,root,id){module(bank,root,'scaffold',0,.05,0,0,.92);const light=new THREE.PointLight(0xffa33b,11,6,2);light.position.set(0,1.4,0);root.add(light);const c=cfg[id]??{w:2,d:2};for(const x of[-1,1]){const b=bank.clone('barrier');b.position.set(x*(c.w/2+.45),0,c.d/2+.5);b.scale.setScalar(.75);root.add(b)}}
function roadSegment(root,x,z,w,d){const shoulder=new THREE.Mesh(new THREE.BoxGeometry(w+.34,.045,d+.34),new THREE.MeshStandardMaterial({color:0x7f918c,roughness:1}));shoulder.position.set(x,.006,z);shoulder.receiveShadow=true;root.add(shoulder);const road=new THREE.Mesh(new THREE.BoxGeometry(w,.065,d),new THREE.MeshStandardMaterial({color:0x333c3e,roughness:.9,metalness:.02}));road.position.set(x,.045,z);road.receiveShadow=true;root.add(road)}
function laneMarks(root,horizontal,length){const mat=new THREE.MeshStandardMaterial({color:0xd0c7a2,roughness:.9});for(let i=-Math.floor(length/4);i<=Math.floor(length/4);i++){const m=new THREE.Mesh(new THREE.BoxGeometry(horizontal?1:.055,.018,horizontal?.055:1),mat);m.position.set(horizontal?i*2:0,.087,horizontal?0:i*2);root.add(m)}}
function addRoads(root){roadSegment(root,0,0,22,1.6);roadSegment(root,0,0,1.6,22);laneMarks(root,true,20);laneMarks(root,false,20);roadSegment(root,5.6,4.8,8.5,1.25);roadSegment(root,-5.6,-2.7,8.6,1.25);roadSegment(root,5.7,-6.2,8.9,1.22)}
function addTree(bank,root,name,x,z,s=.6){const t=bank.clone(name);t.position.set(x,0,z);t.rotation.y=(x*7+z*5);t.scale.setScalar(s);root.add(t)}
function addTrees(bank,root,level){const count=13+Math.min(13,level);for(let i=0;i<count;i++){const a=i*2.399,r=12.4+(i%5)*1.25;addTree(bank,root,i%3?'pineSmall':'pineLarge',Math.cos(a)*r,Math.sin(a)*r,.55+(i%4)*.08)}}
function addFoliage(bank,root){for(const [x,z,s] of [[-10,7,.42],[-9,9,.35],[10,-9,.43],[11,-6,.34],[-12,-6,.39],[12,5,.36]])addTree(bank,root,'pineSmall',x,z,s)}
function addTerrain(root){
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(44,44),new THREE.MeshStandardMaterial({color:0x708985,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.06;ground.receiveShadow=true;root.add(ground)
 const packed=new THREE.Mesh(new THREE.CircleGeometry(12.8,80),new THREE.MeshStandardMaterial({color:0x617773,roughness:1}));packed.rotation.x=-Math.PI/2;packed.position.y=-.025;packed.receiveShadow=true;root.add(packed)
 const plaza=new THREE.Mesh(new THREE.CylinderGeometry(4.35,4.35,.08,48),new THREE.MeshStandardMaterial({color:0x4a5655,roughness:.9}));plaza.position.y=.015;plaza.receiveShadow=true;root.add(plaza)
 const ring=new THREE.Mesh(new THREE.TorusGeometry(4.1,.09,6,48),new THREE.MeshStandardMaterial({color:0xa9a68e,roughness:.9}));ring.rotation.x=Math.PI/2;ring.position.y=.07;root.add(ring)
 for(let i=0;i<18;i++){const a=i*1.61,r=5+(i%6)*2.15,p=new THREE.Mesh(new THREE.CircleGeometry(1.15+(i%4)*.42,26),new THREE.MeshStandardMaterial({color:i%3?0x91a5a0:0xa4b4b0,roughness:1,transparent:true,opacity:.28}));p.rotation.x=-Math.PI/2;p.position.set(Math.cos(a)*r,-.012,Math.sin(a)*r);p.scale.y=.6+(i%3)*.12;root.add(p)}
}
function addSettlementProps(bank,root){
 const props=[['truckGreen',-3.6,6.7,.4,.72],['truckGrey',6.8,7.1,-.8,.68],['truckGreen',-7.8,-4.6,1.1,.64],['dumpster',3.8,-3.4,.2,.62],['barrier',2.5,5.3,.9,.58],['barrier',-4.2,-5.2,-.5,.58]]
 for(const [name,x,z,r,s] of props){const p=bank.clone(name);p.position.set(x,0,z);p.rotation.y=r;p.scale.setScalar(s);root.add(p)}
 for(const [x,z] of [[-2.2,-2.3],[2.5,-2.5],[-2.5,2.4],[2.4,2.6]]){const lamp=new THREE.PointLight(0xffb35d,5.5,5.2,2);lamp.position.set(x,1.35,z);root.add(lamp);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,1.25,7),new THREE.MeshStandardMaterial({color:0x303a3b,roughness:.8,metalness:.3}));pole.position.set(x,.62,z);root.add(pole)}
}
function unlocked(state,id){if(id==='furnace')return true;return(state.buildings.furnace??1)>=(BUILDINGS[id]?.unlockFurnace??1)}
export function buildCity(bank,state){
 const root=new THREE.Group();root.name='cityRoot';addTerrain(root);addRoads(root);const furnace=state.buildings.furnace??1;addTrees(bank,root,furnace);addFoliage(bank,root);addSettlementProps(bank,root)
 for(const id of Object.keys(BUILDINGS)){const level=state.buildings[id]??0,[x,z]=LAYOUT[id]??[0,0],active=state.construction?.id===id;if(level>0||id==='furnace'){const b=compoundBuilding(bank,id,Math.max(1,level));if(active)decorateConstruction(bank,b,id);b.position.set(x,0,z);root.add(b);continue}if(unlocked(state,id)){const plot=constructionPlot(bank,id,active);plot.position.set(x,0,z);root.add(plot)}}return root
}
export function buildingPosition(id){const [x,z]=LAYOUT[id]??[0,0];return new THREE.Vector3(x,0,z)}
