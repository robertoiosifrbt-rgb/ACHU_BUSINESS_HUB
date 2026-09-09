import * as THREE from 'three'
import { BUILDINGS } from '../data/buildings.js'

const LAYOUT={furnace:[0,-.8],shelter:[-6.7,3.6],sawmill:[7.2,5.1],huntersHut:[5.9,-6],coalMine:[-7,-5.8],ironMine:[10.2,-1.1],storehouse:[11.2,6.5],infirmary:[-10.5,1.1],embassy:[-2.8,8.2],infantryCamp:[2.8,-9],lancerCamp:[9.2,-8.1],marksmanCamp:[-9.2,-8.8],researchCenter:[4.4,8.5]}
const ACCENT={furnace:0x50d4a1,shelter:0x67b9e8,sawmill:0xe9aa54,huntersHut:0xe88170,coalMine:0xe6c159,storehouse:0x76aee3,infantryCamp:0x62d99b,infirmary:0x61cfc6,ironMine:0xb991e5,lancerCamp:0x5fa8e0,embassy:0xe9c06a,marksmanCamp:0xe486ad,researchCenter:0x69d5df}
const INDUSTRIAL=new Set(['sawmill','storehouse','lancerCamp','infantryCamp'])
const mat=(c,r=.76,m=.03)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m})
function box(w,h,d,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=true;o.receiveShadow=true;return o}
function tag(root,id){root.userData.buildingId=id;root.traverse(o=>o.userData.buildingId=id);return root}
function ring(parent,r,c,opacity=.35){const o=new THREE.Mesh(new THREE.RingGeometry(r*.82,r,48),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));o.rotation.x=-Math.PI/2;o.position.y=.04;parent.add(o)}
function disk(parent,r,c,opacity=1,y=.01){const o=new THREE.Mesh(new THREE.CircleGeometry(r,48),new THREE.MeshStandardMaterial({color:c,roughness:1,transparent:opacity<1,opacity}));o.rotation.x=-Math.PI/2;o.position.y=y;o.receiveShadow=true;parent.add(o)}
function sign(text,c){const cv=document.createElement('canvas');cv.width=640;cv.height=128;const x=cv.getContext('2d');x.fillStyle='rgba(13,27,24,.88)';x.roundRect(12,17,616,94,22);x.fill();x.strokeStyle=`#${c.toString(16).padStart(6,'0')}`;x.lineWidth=3;x.stroke();x.fillStyle='#e7eadf';x.font='800 29px Inter,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text.toUpperCase(),320,64,560);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(4.25,.86,1);return s}
function tree(parent,x,z,s=.7){const g=new THREE.Group();const trunk=box(.13,.65,.13,mat(0x4c382e,1));trunk.position.y=.325;g.add(trunk);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.54*s,1),mat(0x356b50,.95));crown.scale.y=1.35;crown.position.y=.94;g.add(crown);g.position.set(x,0,z);parent.add(g)}
function modernOffice(id,lvl){const g=new THREE.Group(),c=ACCENT[id]??0x50d4a1,h=id==='furnace'?2.8+lvl*.17:1.55+Math.min(12,lvl)*.14,w=id==='furnace'?2.5:1.9,d=id==='furnace'?2.1:1.65;base(g,w,h,d,c,id==='furnace'?0x879990:0x778982);ring(g,id==='furnace'?1.8:1.45,c,.38);const s=sign(id==='furnace'?'ACHU HQ':BUILDINGS[id]?.name??id,c);s.position.set(0,h+.65,0);g.add(s);return tag(g,id)}
function base(g,w,h,d,c,wall){const shell=box(w,h,d,mat(wall,.7,.04));shell.position.y=h/2;g.add(shell);const glass=mat(0x2b4d51,.18,.22);glass.emissive=new THREE.Color(0x183335);glass.emissiveIntensity=.05;const rows=Math.max(2,Math.floor(h/.65));for(let i=0;i<rows;i++){const y=.45+i*(h-.75)/Math.max(1,rows-1);const f=box(w*.7,.11,.03,glass);f.position.set(0,y,d/2+.02);g.add(f);const side=box(.03,.11,d*.62,glass);side.position.set(w/2+.02,y,0);g.add(side)}const cap=box(w*.86,.14,d*.86,mat(c,.42,.14));cap.position.y=h+.07;g.add(cap)}
function industrial(id,lvl){const g=new THREE.Group(),c=ACCENT[id]??0x6f8790,w=id==='storehouse'?3.5:2.8,h=1.15+Math.min(12,lvl)*.07;disk(g,w*.7,0x5f6964);const shell=box(w,h,2.2,mat(0x737d77,.84,.04));shell.position.y=h/2;g.add(shell);const door=box(w*.34,h*.62,.05,mat(0x334e51,.32,.15));door.position.set(0,h*.36,1.12);g.add(door);for(const x of[-w*.32,w*.32]){const win=box(w*.18,.22,.05,mat(0x34585d,.22,.18));win.position.set(x,h*.62,1.12);g.add(win)}const roof=box(w*.94,.15,2.05,mat(0x414d50,.72,.16));roof.position.y=h+.07;g.add(roof);ring(g,w*.62,c,.36);const s=sign(BUILDINGS[id]?.name??id,c);s.position.set(0,h+.72,0);g.add(s);return tag(g,id)}
function plot(id,active){const g=new THREE.Group(),c=ACCENT[id]??0x50d4a1;disk(g,1.45,active?0x8f794f:0x647169);ring(g,1.42,c,.42);for(let i=0;i<4;i++){const p=box(.08,active?1.15:.55,.08,mat(0x4c5b56,.85,.12));p.position.set(i<2?-.9:.9,(active?1.15:.55)/2,i%2?-.75:.75);g.add(p)}const s=sign(active?'BUILDING...':BUILDINGS[id]?.name??id,c);s.position.set(0,active?1.65:1.08,0);g.add(s);return tag(g,id)}
function unlocked(state,id){return id==='furnace'||(state.buildings.furnace??1)>=(BUILDINGS[id]?.unlockFurnace??1)}

export function buildCity4X(_bank,state){
 const root=new THREE.Group();root.name='achuModernBase'
 const ground=new THREE.Mesh(new THREE.CircleGeometry(28,72),mat(0x4f695e,1));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;root.add(ground)
 const campus=new THREE.Mesh(new THREE.CircleGeometry(22.5,72),mat(0x667d72,1));campus.rotation.x=-Math.PI/2;campus.position.y=-.055;campus.receiveShadow=true;root.add(campus)
 const plaza=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.6,.16,48),mat(0x78847d,.96));plaza.position.y=.02;root.add(plaza);ring(root,2.1,0x50d4a1,.18)
 for(let i=0;i<22;i++){const a=i*2.399,r=13+(i%4)*1.55;tree(root,Math.cos(a)*r,Math.sin(a)*r,.68+(i%3)*.07)}
 for(const id of Object.keys(BUILDINGS)){const lvl=state.buildings[id]??0,[x,z]=LAYOUT[id]??[0,0],active=state.construction?.id===id;let b=null;if(lvl>0||id==='furnace')b=INDUSTRIAL.has(id)?industrial(id,Math.max(1,lvl)):modernOffice(id,Math.max(1,lvl));else if(unlocked(state,id))b=plot(id,active);if(b){b.position.set(x,0,z);root.add(b)}}
 return root
}
export function buildingPosition4X(id){const [x,z]=LAYOUT[id]??[0,0];return new THREE.Vector3(x,0,z)}
