import * as THREE from 'three'
import { BASE_TILE,parseTile,WORLD_CENTER } from '../data/world.js'
import { fourXFlow } from './fourXFlow.js'

export const WORLD_VISUAL_SCALE=.64
const TILE=1.72
const mat=(color,opacity=1)=>new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false})
const point=id=>{const [x,y]=parseTile(id);return new THREE.Vector3((x-WORLD_CENTER)*TILE*WORLD_VISUAL_SCALE,.075,(y-WORLD_CENTER)*TILE*WORLD_VISUAL_SCALE)}
const box=(w,d,color,opacity=.9)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat(color,opacity));m.rotation.x=-Math.PI/2;return m}

function label(text,color=0xffffff){
 const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(15,27,25,.88)';x.roundRect(8,15,496,98,24);x.fill();x.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;x.lineWidth=4;x.stroke();x.fillStyle='#fff';x.font='900 30px Inter,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,64,450);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(4.2,1.05,1);return s
}

function road(parent,x,z,w,d){const r=box(w,d,0x343d40,.82);r.position.set(x,.018,z);parent.add(r);const edge=box(w,d*.06,0xe3e2d7,.55);edge.position.set(x,.026,z);parent.add(edge)}
function district(parent,x,z,w,d,name,color){const p=box(w,d,color,.08);p.position.set(x,.008,z);parent.add(p);const l=label(name,color);l.scale.multiplyScalar(.78);l.position.set(x,.55,z);parent.add(l)}

function routeLine(parent,a,b){
 const pts=[a,new THREE.Vector3(b.x,a.y,a.z),new THREE.Vector3(b.x,a.y,b.z)],curve=new THREE.CatmullRomCurve3(pts,false),geo=new THREE.TubeGeometry(curve,24,.055,6,false),m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x54e3ae,transparent:true,opacity:.82,depthWrite:false}));m.position.y=.04;parent.add(m)
}

function marker(parent,p,text,color=0x54e3ae){
 const g=new THREE.Group();g.position.copy(p)
 const ring=new THREE.Mesh(new THREE.RingGeometry(.58,.82,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;g.add(ring)
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(.045,.08,1.5,10),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.5,depthWrite:false}));beam.position.y=.75;g.add(beam)
 const l=label(text,color);l.position.y=1.72;l.scale.multiplyScalar(.72);g.add(l);g.userData.pulse=true;parent.add(g);return g
}

export class WorldClarityOverlay extends THREE.Group{
 constructor(state){super();this.state=state;this.name='world-clarity-v5';this.objectiveId=null;this.pulseAt=0;this.buildBase();this.sync(state,true)}
 buildBase(){
  const span=24.4
  district(this,-6.1,-6.1,11.7,11.7,'RIVERSIDE',0x64b78f)
  district(this,6.1,-6.1,11.7,11.7,'BUSINESS PARK',0x6fa6d5)
  district(this,-6.1,6.1,11.7,11.7,'WEST END',0xd2a26c)
  district(this,6.1,6.1,11.7,11.7,'CENTRAL',0xa289c7)
  ;[-8.2,-4.1,0,4.1,8.2].forEach(x=>road(this,x,0,.34,span))
  ;[-8.2,-4.1,0,4.1,8.2].forEach(z=>road(this,0,z,span,.34))
  const base=point(BASE_TILE);marker(this,base,'ACHU HQ',0x54e3ae)
 }
 sync(state,force=false){
  this.state=state;const flow=fourXFlow(state),id=flow.target??null
  if(!force&&id===this.objectiveId)return
  this.objective?.removeFromParent();this.route?.removeFromParent();this.objective=null;this.route=null;this.objectiveId=id
  if(!id)return
  const target=point(id),base=point(BASE_TILE),holder=new THREE.Group();routeLine(holder,base,target);this.route=holder;this.add(holder);this.objective=marker(this,target,`NEXT · ${flow.label}`,0xf3c864)
 }
 animate(now){if(!this.objective)return;const s=1+Math.sin(now*.004)*.08;this.objective.scale.setScalar(s)}
 objectivePoint(){return this.objectiveId?point(this.objectiveId):point(BASE_TILE)}
}
