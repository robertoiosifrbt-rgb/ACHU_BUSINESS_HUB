import * as THREE from 'three'
import { BUILDINGS } from '../data/buildings.js'

const LAYOUT={
 furnace:[0,0],shelter:[-6,4.5],sawmill:[6,5],huntersHut:[7,0],coalMine:[5.5,-5],
 ironMine:[9,4],storehouse:[0,8],infirmary:[-7,-1],embassy:[-5.5,-6],infantryCamp:[1,-7.5],
 lancerCamp:[6,-8],marksmanCamp:[9,-3.5],researchCenter:[-9,3]
}

const CFG={
 furnace:{style:'b',w:3,d:3,baseFloors:2,maxFloors:4,accent:0x64e5ba,scale:1.08},
 shelter:{style:'a',w:2,d:2,baseFloors:1,maxFloors:2,accent:0x54d39b},
 sawmill:{style:'industrial',w:3,d:2,baseFloors:1,maxFloors:1,accent:0x62b8ff,garage:true},
 huntersHut:{style:'a',w:2,d:2,baseFloors:1,maxFloors:3,accent:0xf3b95f},
 coalMine:{style:'b',w:2,d:2,baseFloors:2,maxFloors:3,accent:0xe98fd9},
 storehouse:{style:'industrial',w:3,d:2,baseFloors:1,maxFloors:1,accent:0x86c7ff,garage:true},
 infantryCamp:{style:'b',w:3,d:2,baseFloors:1,maxFloors:2,accent:0x54d39b},
 infirmary:{style:'a',w:2,d:2,baseFloors:1,maxFloors:2,accent:0x58d5cf},
 ironMine:{style:'b',w:2,d:2,baseFloors:2,maxFloors:3,accent:0xc89cff},
 lancerCamp:{style:'industrial',w:3,d:2,baseFloors:1,maxFloors:1,accent:0x62b8ff,garage:true},
 embassy:{style:'a',w:3,d:2,baseFloors:1,maxFloors:3,accent:0xf3b95f},
 marksmanCamp:{style:'b',w:2,d:2,baseFloors:2,maxFloors:3,accent:0xff8f7f},
 researchCenter:{style:'b',w:3,d:2,baseFloors:2,maxFloors:4,accent:0x6ce2ff}
}

const mat=(color,roughness=.92)=>new THREE.MeshStandardMaterial({color,roughness,metalness:.04})
function module(bank,group,name,x,y,z,rot=0,s=1){const m=bank.clone(name);m.position.set(x,y,z);m.rotation.y=rot;m.scale.setScalar(s);group.add(m);return m}
function tag(root,id){root.userData.buildingId=id;root.traverse(o=>o.userData.buildingId=id);return root}

function labelSprite(text,color=0xffffff,wide=false){
 const canvas=document.createElement('canvas');canvas.width=wide?768:640;canvas.height=128
 const ctx=canvas.getContext('2d'),w=canvas.width
 ctx.clearRect(0,0,w,128);ctx.fillStyle='rgba(8,25,31,.88)';ctx.roundRect(14,17,w-28,94,20);ctx.fill()
 ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=`#${color.toString(16).padStart(6,'0')}`
 ctx.font='800 32px Inter,Arial,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text.toUpperCase(),w/2,64,w-58)
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(wide?5.8:4.8,1,1);return s
}

function floorsFor(id,level){
 const c=CFG[id],stage=Math.max(0,Math.min(2,Math.floor((Math.max(1,level)-1)/4)))
 return Math.min(c.maxFloors,c.baseFloors+stage)
}

function wallNames(style){
 const useB=style==='b'||style==='industrial'
 return useB?{wall:'wallB',window:'wallBWindow',door:'wallBDoor',roof:'wallBRoof'}:{wall:'wallA',window:'wallAWindow',door:'wallADoor',roof:'wallARoof'}
}

function shell(bank,id,level){
 const c=CFG[id],names=wallNames(c.style),g=new THREE.Group(),floors=floorsFor(id,level),w=c.w,d=c.d
 for(let floor=0;floor<floors;floor++){
  for(let x=0;x<w;x++){
   const px=x-(w-1)/2,center=x===Math.floor(w/2)
   let front=names.window
   if(floor===0&&center)front=c.garage?'garage':names.door
   module(bank,g,front,px,floor,d/2)
   module(bank,g,names.window,px,floor,-d/2,Math.PI)
  }
  for(let z=0;z<d;z++){
   const pz=z-(d-1)/2
   module(bank,g,names.window,-w/2,floor,pz,Math.PI/2)
   module(bank,g,names.window,w/2,floor,pz,-Math.PI/2)
  }
 }
 const roofName=c.style==='industrial'?'metalRoof':names.roof
 for(let x=0;x<w;x++)for(let z=0;z<d;z++)module(bank,g,roofName,x-(w-1)/2,floors,z-(d-1)/2)
 g.scale.multiplyScalar(c.scale??1)
 return {g,floors}
}

function addBuildingProps(bank,g,id,floors){
 const c=CFG[id]
 if(id==='furnace'){
  module(bank,g,'scaffold',-2.2,0,-.6,0,.72)
  module(bank,g,'barrier',-1.7,0,2.1,.15,.58);module(bank,g,'barrier',1.7,0,2.1,-.15,.58)
  const achu=labelSprite('ACHU HQ',c.accent,true);achu.position.set(0,floors+1.05,0);g.add(achu)
 }else{
  const name=BUILDINGS[id]?.name??id,sign=labelSprite(name,c.accent,name.length>16);sign.position.set(0,floors+.95,0);g.add(sign)
 }
 if(id==='sawmill'){
  module(bank,g,'dumpster',2.05,0,.35,.15,.62);module(bank,g,'truckGrey',-1.1,0,2.35,Math.PI,.62)
 }else if(id==='storehouse'){
  module(bank,g,'dumpster',2.25,0,-.5,.3,.65);module(bank,g,'truckGrey',1.25,0,2.4,Math.PI,.66);module(bank,g,'truckGreen',-1.25,0,2.4,Math.PI,.66)
 }else if(id==='lancerCamp'){
  module(bank,g,'truckGreen',-1.25,0,2.4,Math.PI,.72);module(bank,g,'truckGrey',1.15,0,2.4,Math.PI,.72)
  module(bank,g,'barrier',-2.05,0,1.5,.15,.55);module(bank,g,'barrier',2.05,0,1.5,-.15,.55)
 }else if(id==='infantryCamp'){
  for(const x of[-1.6,0,1.6])module(bank,g,'barrier',x,0,2.15,0,.54)
 }else if(id==='researchCenter'){
  module(bank,g,'scaffold',2.25,0,-.5,0,.68)
 }else if(id==='coalMine'){
  module(bank,g,'scaffold',-1.7,0,-.55,0,.55)
 }else if(id==='huntersHut'){
  module(bank,g,'truckGreen',1.6,0,1.7,-Math.PI/2,.55)
 }else if(id==='marksmanCamp'){
  module(bank,g,'truckGrey',1.55,0,1.7,-Math.PI/2,.55)
 }
}

function businessBuilding(bank,id,level){const {g,floors}=shell(bank,id,level);addBuildingProps(bank,g,id,floors);return tag(g,id)}

function constructionPlot(bank,id,active=false){
 const c=CFG[id]??{w:2,d:2},g=new THREE.Group(),w=c.w+1,d=c.d+1
 const base=new THREE.Mesh(new THREE.BoxGeometry(w,.12,d),mat(active?0x745d3e:0x687b76));base.position.y=.05;base.receiveShadow=true;g.add(base)
 if(active){module(bank,g,'scaffold',0,.08,0,0,.9);module(bank,g,'barrier',-w/2+.45,.08,d/2-.2,0,.62);module(bank,g,'barrier',w/2-.45,.08,d/2-.2,0,.62)}
 const name=active?'BUILDING':BUILDINGS[id]?.name??id,sign=labelSprite(name,active?0xffc36b:0xc7d8d5,true);sign.position.set(0,active?2.2:1.15,0);sign.scale.multiplyScalar(.78);g.add(sign)
 return tag(g,id)
}

function road(root,x,z,w,d){const shoulder=new THREE.Mesh(new THREE.BoxGeometry(w+.32,.045,d+.32),mat(0x7d8b89));shoulder.position.set(x,.006,z);root.add(shoulder);const r=new THREE.Mesh(new THREE.BoxGeometry(w,.065,d),mat(0x333b3e,.96));r.position.set(x,.045,z);r.receiveShadow=true;root.add(r)}
function lane(root,x,z,w,d){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.018,d),mat(0xe1dcc5));m.position.set(x,.086,z);root.add(m)}
function roads(root){road(root,0,0,27,1.8);road(root,0,0,1.8,28);road(root,0,8,22,1.45);road(root,0,-8,22,1.45);lane(root,0,0,27,.055);lane(root,0,0,.055,28);lane(root,0,8,22,.045);lane(root,0,-8,22,.045)}

function addTree(bank,root,name,x,z,s=.55){const t=bank.clone(name);t.position.set(x,0,z);t.rotation.y=x*7+z*5;t.scale.setScalar(s);root.add(t)}
function landscaping(bank,root,level){
 const count=22+Math.min(12,level)
 for(let i=0;i<count;i++){const a=i*2.399,r=14.6+(i%4)*1.15;addTree(bank,root,i%3?'pineSmall':'pineLarge',Math.cos(a)*r,Math.sin(a)*r,.48+(i%4)*.07)}
 for(const [x,z,s] of [[-4,2,.38],[4,-2,.4],[-3,-4,.36],[3,4,.37],[-10,7,.42],[10,-7,.42],[-10,-7,.36],[10,7,.36]])addTree(bank,root,'pineSmall',x,z,s)
}

function parking(bank,root){
 const lot=new THREE.Mesh(new THREE.BoxGeometry(11,.045,4.6),mat(0x363e42));lot.position.set(0,.03,13.1);root.add(lot)
 for(let i=-4;i<=4;i++)lane(root,i*1.1,13.1,.045,3.55)
 for(const [name,x] of [['truckGreen',-3.8],['truckGrey',-1.8],['truckGreen',.2],['truckGrey',2.2],['truckGreen',4.1]])module(bank,root,name,x,.06,13.1,Math.PI/2,.62)
}

function unlocked(state,id){if(id==='furnace')return true;return(state.buildings.furnace??1)>=(BUILDINGS[id]?.unlockFurnace??1)}

export function buildCity(bank,state){
 const root=new THREE.Group();root.name='businessCampus'
 const ground=new THREE.Mesh(new THREE.CircleGeometry(23,72),mat(0x78928a));ground.rotation.x=-Math.PI/2;ground.position.y=-.06;ground.receiveShadow=true;root.add(ground)
 const inner=new THREE.Mesh(new THREE.CircleGeometry(17.6,72),mat(0x879b94));inner.rotation.x=-Math.PI/2;inner.position.y=-.045;inner.receiveShadow=true;root.add(inner)
 roads(root);parking(bank,root);landscaping(bank,root,state.buildings.furnace??1)
 for(const id of Object.keys(BUILDINGS)){
  const level=state.buildings[id]??0,[x,z]=LAYOUT[id]??[0,0],active=state.construction?.id===id
  if(level>0||id==='furnace'){
   const b=businessBuilding(bank,id,Math.max(1,level));b.position.set(x,0,z);root.add(b);if(active)module(bank,b,'scaffold',0,.04,0,0,.82)
  }else if(unlocked(state,id)){
   const plot=constructionPlot(bank,id,active);plot.position.set(x,0,z);root.add(plot)
  }
 }
 return root
}

export function buildingPosition(id){const [x,z]=LAYOUT[id]??[0,0];return new THREE.Vector3(x,0,z)}
