import * as THREE from 'three'
import { BUILDINGS } from '../data/buildings.js'

const LAYOUT={
 furnace:[0,0],shelter:[-6,4.5],sawmill:[6,5],huntersHut:[7,0],coalMine:[5.5,-5],ironMine:[9,4],storehouse:[0,8],infirmary:[-7,-1],embassy:[-5.5,-6],infantryCamp:[1,-7.5],lancerCamp:[6,-8],marksmanCamp:[9,-3.5],researchCenter:[-9,3],
}

const CFG={
 furnace:{body:0x0f2f3d,accent:0x64e5ba,glass:0x75cfff,w:3.6,d:3.6,h:4.9},
 shelter:{body:0xf5f7f8,accent:0x54d39b,glass:0x85cfff,w:2.8,d:2.4,h:2.0},
 sawmill:{body:0x2d3942,accent:0x62b8ff,glass:0x7db8dc,w:3.4,d:2.8,h:1.9},
 huntersHut:{body:0xf2f4f6,accent:0xf3b95f,glass:0x7fd4ff,w:2.6,d:2.4,h:2.8},
 coalMine:{body:0x2d2634,accent:0xe98fd9,glass:0xbb8aff,w:2.8,d:2.5,h:2.6},
 storehouse:{body:0x3a4148,accent:0x86c7ff,glass:0x7eaac4,w:4.0,d:2.8,h:1.9},
 infantryCamp:{body:0x20383a,accent:0x54d39b,glass:0x76c8bd,w:3.2,d:2.5,h:2.3},
 infirmary:{body:0xf7f9fb,accent:0x58d5cf,glass:0x87dce7,w:2.7,d:2.5,h:2.6},
 ironMine:{body:0x332f42,accent:0xc89cff,glass:0xb8a6ff,w:2.7,d:2.4,h:3.0},
 lancerCamp:{body:0x313b43,accent:0x62b8ff,glass:0x73bce8,w:3.8,d:2.8,h:1.7},
 embassy:{body:0xf4f1ea,accent:0xf3b95f,glass:0x9fd5e5,w:3.0,d:2.6,h:2.8},
 marksmanCamp:{body:0x202934,accent:0xff8f7f,glass:0x6fa8d9,w:2.7,d:2.4,h:3.5},
 researchCenter:{body:0x142d3b,accent:0x6ce2ff,glass:0x67d9ff,w:3.3,d:2.8,h:3.1},
}

const mat=(color,opts={})=>new THREE.MeshStandardMaterial({color,roughness:opts.roughness??.62,metalness:opts.metalness??.12,transparent:!!opts.transparent,opacity:opts.opacity??1,emissive:opts.emissive??0x000000,emissiveIntensity:opts.emissiveIntensity??0})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=true;o.receiveShadow=true;return o}
const cyl=(r,h,m,segments=20)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),m);o.castShadow=true;o.receiveShadow=true;return o}

function labelSprite(text,color=0xffffff){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,512,128);ctx.fillStyle='rgba(5,18,25,.86)';ctx.roundRect(14,18,484,92,20);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=`#${color.toString(16).padStart(6,'0')}`;ctx.font='800 34px Inter, Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text.toUpperCase(),256,64);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(4.8,1.2,1);return s
}

function windows(group,c,w,h,d){
 const glass=mat(c.glass,{roughness:.22,metalness:.28,emissive:c.glass,emissiveIntensity:.08})
 const rows=Math.max(1,Math.floor(h/.9));for(let r=0;r<rows;r++){
  const y=.65+r*.82;if(y>h-.3)continue
  for(const side of [-1,1]){const strip=box(w*.7,.26,.055,glass);strip.position.set(0,y,side*(d/2+.031));group.add(strip)}
 }
}

function baseBuilding(id,level){
 const c=CFG[id]??CFG.shelter,g=new THREE.Group(),pod=box(c.w+.45,.18,c.d+.45,mat(0x59636a,{roughness:.95}));pod.position.y=.09;g.add(pod)
 const body=box(c.w,c.h,c.d,mat(c.body,{roughness:.48,metalness:.16}));body.position.y=c.h/2+.18;g.add(body);windows(g,c,c.w,c.h,c.d)
 const accent=box(c.w+.08,.16,c.d+.08,mat(c.accent,{roughness:.35,metalness:.28,emissive:c.accent,emissiveIntensity:.12}));accent.position.y=c.h+.26;g.add(accent)
 const door=box(.58,.88,.09,mat(0x172a33,{roughness:.28,metalness:.35}));door.position.set(0,.62,c.d/2+.05);g.add(door)
 const sign=labelSprite(BUILDINGS[id]?.name??id,c.accent);sign.position.set(0,c.h+1.05,0);g.add(sign)
 g.scale.multiplyScalar(1+Math.min(.12,(level-1)*.012));return g
}

function addVan(group,x,z,color=0x54d39b,rot=0){const g=new THREE.Group(),body=box(1.15,.48,.58,mat(color,{roughness:.5,metalness:.18}));body.position.y=.38;g.add(body);const cab=box(.42,.42,.58,mat(0xe9f2f5,{roughness:.28,metalness:.25}));cab.position.set(.38,.68,0);g.add(cab);for(const dz of [-.27,.27])for(const dx of [-.38,.38]){const w=cyl(.12,.12,mat(0x11161a),12);w.rotation.x=Math.PI/2;w.position.set(dx,.17,dz);g.add(w)}g.position.set(x,0,z);g.rotation.y=rot;group.add(g)}

function decorateBuilding(g,id,level){
 const c=CFG[id]
 if(id==='furnace'){
  const tower=box(2.25,2.6,2.25,mat(0x173f50,{roughness:.3,metalness:.28}));tower.position.y=c.h+1.55;g.add(tower);windows(g,{...c,w:2.25,d:2.25,h:2.4},2.25,2.4,2.25)
  const crown=new THREE.Mesh(new THREE.TorusGeometry(1.15,.09,10,48),mat(c.accent,{emissive:c.accent,emissiveIntensity:.35,roughness:.25}));crown.rotation.x=Math.PI/2;crown.position.y=c.h+2.9;g.add(crown)
  const logo=labelSprite('ACHU',0x64e5ba);logo.position.set(0,c.h+3.85,0);logo.scale.set(5.4,1.35,1);g.add(logo)
 }else if(id==='sawmill'||id==='storehouse'){
  for(let i=-1;i<=1;i++){const dock=box(.65,.75,.08,mat(0x1b242a));dock.position.set(i*.9,.55,c.d/2+.05);g.add(dock)}
  const crates=box(1,.45,.8,mat(0xb88955));crates.position.set(c.w/2+.65,.23,.35);g.add(crates)
 }else if(id==='huntersHut'){
  const board=box(1.9,.85,.12,mat(0xf3b95f,{emissive:0xf3b95f,emissiveIntensity:.18}));board.position.set(0,c.h+.8,c.d/2+.14);g.add(board)
 }else if(id==='coalMine'){
  const board=box(2.05,1.1,.12,mat(0xe98fd9,{emissive:0xe98fd9,emissiveIntensity:.25}));board.position.set(0,c.h+.85,c.d/2+.14);g.add(board)
  const light=new THREE.PointLight(0xe98fd9,6,7,2);light.position.set(0,c.h+1.1,1.5);g.add(light)
 }else if(id==='infantryCamp'){
  const yard=box(3.4,.05,2.2,mat(0x335b55,{roughness:1}));yard.position.set(0,.04,-c.d/2-1.4);g.add(yard);for(let i=-2;i<=2;i++){const marker=cyl(.08,.35,mat(0x64e5ba),10);marker.position.set(i*.55,.2,-c.d/2-1.4);g.add(marker)}
 }else if(id==='infirmary'){
  const crossV=box(.22,.8,.09,mat(0x58d5cf,{emissive:0x58d5cf,emissiveIntensity:.25})),crossH=box(.7,.22,.09,mat(0x58d5cf,{emissive:0x58d5cf,emissiveIntensity:.25}));crossV.position.set(0,c.h+.65,c.d/2+.13);crossH.position.copy(crossV.position);g.add(crossV,crossH)
 }else if(id==='ironMine'){
  for(let i=0;i<3;i++){const p=cyl(.18,.55,mat(0xc89cff,{emissive:0xc89cff,emissiveIntensity:.14}),16);p.position.set(-.65+i*.65,c.h+.58,0);g.add(p)}
 }else if(id==='lancerCamp'){
  const canopy=box(4.5,.14,2.2,mat(0x62b8ff,{metalness:.4,roughness:.3}));canopy.position.set(0,1.6,-2.4);g.add(canopy);for(const x of [-1.8,1.8]){const p=box(.12,1.6,.12,mat(0x5b6870));p.position.set(x,.8,-2.4);g.add(p)}addVan(g,-1,-2.35,0x54d39b,0);addVan(g,1,-2.35,0x62b8ff,0)
 }else if(id==='embassy'){
  for(const x of [-1.05,1.05]){const p=cyl(.16,2.2,mat(0xd7c69a,{roughness:.55}),20);p.position.set(x,1.1,c.d/2+.35);g.add(p)}
 }else if(id==='marksmanCamp'){
  const beacon=new THREE.PointLight(0xff8f7f,7,8,2);beacon.position.set(0,c.h+1.1,0);g.add(beacon);const mast=box(.11,1.7,.11,mat(0xff8f7f,{emissive:0xff8f7f,emissiveIntensity:.3}));mast.position.set(0,c.h+.9,0);g.add(mast)
 }else if(id==='researchCenter'){
  const dome=new THREE.Mesh(new THREE.SphereGeometry(1.05,28,16,0,Math.PI*2,0,Math.PI/2),mat(0x67d9ff,{transparent:true,opacity:.42,roughness:.15,metalness:.1,emissive:0x2ebde9,emissiveIntensity:.15}));dome.position.set(0,c.h+.25,0);g.add(dome)
 }
 if(level>=8){const beacon=new THREE.PointLight(c.accent,2.5,5,2);beacon.position.set(0,c.h+1.6,0);g.add(beacon)}
}

function modernBuilding(id,level){const g=baseBuilding(id,level);decorateBuilding(g,id,level);g.userData.buildingId=id;g.traverse(o=>o.userData.buildingId=id);return g}

function addRoad(root,w,d,x,z){const road=box(w,.08,d,mat(0x202a31,{roughness:.98}));road.position.set(x,.035,z);road.receiveShadow=true;root.add(road)}
function addLane(root,w,d,x,z){const lane=box(w,.018,d,mat(0xe7e1c8,{roughness:.92}));lane.position.set(x,.082,z);root.add(lane)}
function roads(root){addRoad(root,31,2.4,0,0);addRoad(root,2.4,31,0,0);addRoad(root,22,2.1,0,8);addRoad(root,22,2.1,0,-8);addLane(root,31,.08,0,0);addLane(root,.08,31,0,0);addLane(root,22,.07,0,8);addLane(root,22,.07,0,-8)}

function tree(root,x,z,s=1){const trunk=cyl(.14,.9,mat(0x6b4b34),10);trunk.position.set(x,.45,z);const crown=new THREE.Mesh(new THREE.SphereGeometry(.62*s,14,10),mat(0x2e765d,{roughness:1}));crown.position.set(x,1.15,z);crown.castShadow=true;root.add(trunk,crown)}
function landscaping(root){for(let i=0;i<34;i++){const a=i/34*Math.PI*2,r=14.5+(i%3)*1.4;tree(root,Math.cos(a)*r,Math.sin(a)*r,.8+(i%4)*.06)}for(const [x,z] of [[-4,2],[4,-2],[-3,-4],[3,4],[-10,7],[10,-7]])tree(root,x,z,.72)}
function parking(root){const lot=box(11,.045,4.8,mat(0x303941,{roughness:1}));lot.position.set(0,.03,13.2);root.add(lot);for(let i=-4;i<=4;i++){const mark=box(.06,.02,3.7,mat(0xdce7e8));mark.position.set(i*1.08,.06,13.2);root.add(mark)}for(let i=0;i<6;i++)addVan(root,-4.3+i*1.7,13.2,i%2?0x62b8ff:0x54d39b,Math.PI/2)}

export function buildCity(bank,state){
 const root=new THREE.Group();root.name='businessCampus'
 const ground=new THREE.Mesh(new THREE.CircleGeometry(23,72),mat(0x89a99b,{roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;root.add(ground)
 const district=new THREE.Mesh(new THREE.CircleGeometry(17.3,72),mat(0x728e83,{roughness:1}));district.rotation.x=-Math.PI/2;district.position.y=.006;district.receiveShadow=true;root.add(district)
 const plaza=new THREE.Mesh(new THREE.CircleGeometry(5.2,48),mat(0x8d969a,{roughness:.95}));plaza.rotation.x=-Math.PI/2;plaza.position.y=.015;root.add(plaza)
 roads(root);parking(root);landscaping(root)
 for(const id of Object.keys(BUILDINGS)){const level=state.buildings[id]??0;if(id!=='furnace'&&level<1)continue;const b=modernBuilding(id,Math.max(1,level)),[x,z]=LAYOUT[id]??[0,0];b.position.set(x,0,z);root.add(b)}
 return root
}

export function buildingPosition(id){const [x,z]=LAYOUT[id]??[0,0];return new THREE.Vector3(x,0,z)}
