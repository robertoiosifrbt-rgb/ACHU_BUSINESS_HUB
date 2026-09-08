import * as THREE from 'three'
import { BUILDINGS } from '../data/buildings.js'

const LAYOUT={
 furnace:[0,-1],shelter:[-6.8,3.6],sawmill:[7.5,5.2],huntersHut:[5.8,-6.4],coalMine:[-7.4,-5.8],
 ironMine:[10.5,-1.2],storehouse:[11.5,6.7],infirmary:[-11,1],embassy:[-2.7,8.6],infantryCamp:[2.8,-9.4],
 lancerCamp:[9.6,-8.5],marksmanCamp:[-9.8,-9],researchCenter:[4.4,8.9]
}

const ACCENT={furnace:0x55e0b5,shelter:0x76d6ff,sawmill:0xffb95a,huntersHut:0xff8e78,coalMine:0xffcf62,storehouse:0x8bc6ff,infantryCamp:0x6ee5a3,infirmary:0x69d9d0,ironMine:0xd3a0ff,lancerCamp:0x66bfff,embassy:0xffd37a,marksmanCamp:0xff8fb4,researchCenter:0x7eeeff}
const MODEL={furnace:'downtownLarge',shelter:'downtownSmall',huntersHut:'downtownMedium',coalMine:'downtownMedium',ironMine:'downtownMedium',infirmary:'downtownSmall',embassy:'downtownMedium',infantryCamp:'downtownSmall',marksmanCamp:'downtownMedium',researchCenter:'downtownLarge'}
const INDUSTRIAL=new Set(['sawmill','storehouse','lancerCamp'])
const mat=(color,rough=.88,metal=.04)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})

function clone(bank,name,x=0,y=0,z=0,rot=0,s=1,parent=null){const o=bank.clone(name);o.position.set(x,y,z);o.rotation.y=rot;o.scale.setScalar(s);if(parent)parent.add(o);return o}
function tag(root,id){root.userData.buildingId=id;root.traverse(o=>o.userData.buildingId=id);return root}
function levelScale(level){return .74+Math.min(12,level)*.026}

function signSprite(text,color=0xffffff,small=false){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;const c=canvas.getContext('2d')
 c.clearRect(0,0,768,160);c.fillStyle='rgba(7,19,23,.82)';c.roundRect(20,24,728,112,30);c.fill();c.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;c.lineWidth=4;c.stroke()
 c.fillStyle='#f7fbfa';c.font=`900 ${small?30:36}px Inter,Arial,sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(text.toUpperCase(),384,80,680)
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(small?4.5:5.6,1.15,1);return s
}

function pulseMarker(color){
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const c=canvas.getContext('2d'),g=c.createRadialGradient(64,64,6,64,64,60)
 const hex=`#${color.toString(16).padStart(6,'0')}`;g.addColorStop(0,'#ffffff');g.addColorStop(.18,hex);g.addColorStop(.42,`${hex}aa`);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(0,0,128,128)
 const tex=new THREE.CanvasTexture(canvas),s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.set(1.15,1.15,1)
 const phase=Math.random()*6;s.onBeforeRender=()=>{const p=1+Math.sin(performance.now()*.003+phase)*.14;s.scale.setScalar(p)};return s
}

function ring(parent,r,color,y=.025){const m=new THREE.Mesh(new THREE.RingGeometry(r*.84,r,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=y;parent.add(m);return m}
function disk(parent,r,color,y=.01,opacity=1){const m=new THREE.Mesh(new THREE.CircleGeometry(r,48),new THREE.MeshStandardMaterial({color,roughness:1,transparent:opacity<1,opacity}));m.rotation.x=-Math.PI/2;m.position.y=y;m.receiveShadow=true;parent.add(m);return m}

function downtownBuilding(bank,id,level){
 const g=new THREE.Group(),accent=ACCENT[id],name=MODEL[id]??'downtownMedium',main=clone(bank,name,0,0,0,(id.charCodeAt(0)%4)*Math.PI/2,levelScale(level),g)
 if(id==='furnace'){
  const wing=clone(bank,'downtownMedium',2.55,0,.65,-Math.PI/2,.6+level*.018,g);wing.position.x+=Math.min(1.3,level*.06)
  const ac=clone(bank,'downtownAC',-.8,0,1.2,0,.55,g);ac.position.y=.03
 }
 ring(g,id==='furnace'?3.25:2.3,accent)
 const label=signSprite(id==='furnace'?'ACHU HQ':BUILDINGS[id]?.name??id,accent,(BUILDINGS[id]?.name??'').length>18);label.position.set(0,id==='furnace'?5.9:4.2,0);g.add(label)
 const pulse=pulseMarker(accent);pulse.position.set(id==='furnace'?2.8:1.75,id==='furnace'?4.8:3.3,.2);g.add(pulse)
 return tag(g,id)
}

function industrialBuilding(bank,id,level){
 const g=new THREE.Group(),accent=ACCENT[id],w=id==='storehouse'?4:3
 disk(g,w*.78,0xa2a29a,.005)
 for(let x=0;x<w;x++){
  const px=x-(w-1)/2,front=x===Math.floor(w/2)?'garage':'wallBWindow'
  clone(bank,front,px,0,1,0,1,g);clone(bank,'wallB',px,0,-1,Math.PI,1,g);clone(bank,'metalRoof',px,1,-.5,0,1,g);clone(bank,'metalRoof',px,1,.5,0,1,g)
 }
 clone(bank,'wallB',-w/2,0,0,Math.PI/2,1,g);clone(bank,'wallB',w/2,0,0,-Math.PI/2,1,g)
 ring(g,w*.72,accent)
 const sign=signSprite(BUILDINGS[id]?.name??id,accent);sign.position.set(0,2.15,-.2);g.add(sign)
 if(id==='lancerCamp'){clone(bank,'truckGreen',-1.4,.03,2.05,Math.PI,.68,g);clone(bank,'truckGrey',1.35,.03,2.05,Math.PI,.68,g)}
 if(id==='storehouse'){clone(bank,'truckGrey',1.6,.03,2.05,Math.PI,.64,g);clone(bank,'dumpster',-2.1,.03,.6,.2,.62,g)}
 if(id==='sawmill'){clone(bank,'truckGreen',-1.45,.03,2.05,Math.PI,.64,g);clone(bank,'scaffold',2.05,.02,-.1,0,.62,g)}
 const pulse=pulseMarker(accent);pulse.position.set(w*.5,2.75,.4);g.add(pulse)
 g.scale.multiplyScalar(.92+Math.min(12,level)*.012);return tag(g,id)
}

function constructionPlot(bank,id,active=false){
 const g=new THREE.Group(),accent=ACCENT[id]??0x65d3b5;disk(g,2.2,active?0x70624c:0x8a9590,.01);ring(g,2.05,accent)
 if(active){clone(bank,'scaffold',0,.02,0,0,1.05,g);for(const [x,z,r] of [[-1.6,1.45,0],[0,1.65,0],[1.6,1.45,0]])clone(bank,'barrier',x,.02,z,r,.58,g)}
 const sign=signSprite(active?'COMING TO LIFE':BUILDINGS[id]?.name??id,accent,true);sign.position.set(0,active?2.45:1.45,0);g.add(sign);return tag(g,id)
}

function ribbon(parent,pts,width,color,y=.015){
 const curve=new THREE.CatmullRomCurve3(pts.map(([x,z])=>new THREE.Vector3(x,y,z))),segs=80,verts=[],uv=[],idx=[]
 for(let i=0;i<=segs;i++){
  const t=i/segs,p=curve.getPoint(t),tan=curve.getTangent(t),n=new THREE.Vector3(-tan.z,0,tan.x).normalize().multiplyScalar(width/2)
  verts.push(p.x+n.x,p.y,p.z+n.z,p.x-n.x,p.y,p.z-n.z);uv.push(0,t,1,t);if(i<segs){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals()
 const m=new THREE.Mesh(geo,mat(color,.98));m.receiveShadow=true;parent.add(m);return curve
}

function roads(root){
 ribbon(root,[[-20,2],[-12,1],[-5,-1],[1,-.5],[8,1],[20,-1]],2.7,0x343d40,.03)
 ribbon(root,[[-13,-18],[-10,-10],[-6,-3],[-3,4],[-1,17]],2.55,0x353d40,.035)
 ribbon(root,[[0,-18],[2,-11],[5,-5],[8,1],[11,9],[15,17]],2.25,0x353d40,.032)
 ribbon(root,[[-18,10],[-10,8],[-3,8],[4,10],[12,10],[19,7]],2.2,0x353d40,.034)
}

function plaza(bank,root){
 disk(root,5.5,0xb8b5a6,.018);ring(root,5.25,0xe7ddbb,.035)
 const pool=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.25,.22,48),mat(0x7b8988,.95));pool.position.y=.08;root.add(pool);const water=new THREE.Mesh(new THREE.CircleGeometry(1.92,48),new THREE.MeshPhysicalMaterial({color:0x77c7d8,roughness:.18,metalness:.02,transparent:true,opacity:.84}));water.rotation.x=-Math.PI/2;water.position.y=.205;root.add(water)
 const spray=new THREE.Mesh(new THREE.CylinderGeometry(.08,.14,1.15,12),new THREE.MeshPhysicalMaterial({color:0xbfefff,transparent:true,opacity:.55,roughness:.1}));spray.position.y=.78;root.add(spray)
 for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*4.2,z=Math.sin(a)*4.2;clone(bank,i%2?'downtownTreeA':'downtownTreeB',x,0,z,-a,.5,root)}
}

function backdrop(bank,root){
 const spots=[[-18,-12,'downtownLarge',.78],[-14,15,'downtownMedium',.75],[-5,19,'downtownLarge',.68],[5,19,'downtownMedium',.8],[17,14,'downtownLarge',.72],[19,4,'downtownSmall',.85],[18,-12,'downtownLarge',.7],[12,-18,'downtownMedium',.76],[-7,-19,'downtownSmall',.86],[-18,-5,'downtownMedium',.74],[-21,8,'downtownSmall',.8]]
 spots.forEach(([x,z,name,s],i)=>{const b=clone(bank,name,x,0,z,(i%4)*Math.PI/2,s,root);b.traverse(o=>{if(o.isMesh){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)if(m){m.transparent=true;m.opacity=.9}}})})
 for(let i=0;i<34;i++){const a=i*2.399,r=17+(i%5)*1.35,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<4&&Math.abs(z)<4)continue;clone(bank,i%3===0?'downtownTreeC':i%2?'downtownTreeA':'downtownTreeB',x,0,z,a,.36+(i%4)*.055,root)}
}

function streetLife(bank,root){
 const cars=[[-8,1.1,0,'truckGreen'],[-2,-1.1,Math.PI,'truckGrey'],[6,1.0,0,'truckGreen'],[-7,7.4,Math.PI/2,'truckGrey'],[8.5,9.2,-Math.PI/2,'truckGreen'],[2,-10.2,0,'truckGrey']]
 cars.forEach(([x,z,r,n])=>clone(bank,n,x,.05,z,r,.48,root))
 for(const [x,z] of [[-4,5],[3,5],[-12,5],[12,4],[-6,-12],[6,-13]])clone(bank,'downtownBush',x,0,z,0,.42,root)
}

function unlocked(state,id){if(id==='furnace')return true;return(state.buildings.furnace??1)>=(BUILDINGS[id]?.unlockFurnace??1)}

export function buildCity(bank,state){
 const root=new THREE.Group();root.name='livingBusinessDistrict'
 const ground=new THREE.Mesh(new THREE.CircleGeometry(28,96),mat(0x7f9b84,1));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;ground.receiveShadow=true;root.add(ground)
 const cityPad=new THREE.Mesh(new THREE.CircleGeometry(22.8,96),mat(0xa8aa9b,1));cityPad.rotation.x=-Math.PI/2;cityPad.position.y=-.055;cityPad.receiveShadow=true;root.add(cityPad)
 roads(root);plaza(bank,root);backdrop(bank,root);streetLife(bank,root)
 for(const id of Object.keys(BUILDINGS)){
  const level=state.buildings[id]??0,[x,z]=LAYOUT[id]??[0,0],active=state.construction?.id===id
  let b=null
  if(level>0||id==='furnace')b=INDUSTRIAL.has(id)?industrialBuilding(bank,id,Math.max(1,level)):downtownBuilding(bank,id,Math.max(1,level))
  else if(unlocked(state,id))b=constructionPlot(bank,id,active)
  if(b){b.position.set(x,0,z);root.add(b);if(active)clone(bank,'scaffold',0,.02,0,0,.78,b)}
 }
 return root
}

export function buildingPosition(id){const [x,z]=LAYOUT[id]??[0,0];return new THREE.Vector3(x,0,z)}
