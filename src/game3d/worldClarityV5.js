import * as THREE from 'three'
import { BASE_TILE,parseTile } from '../data/world.js'
import { fourXFlow } from './fourXFlow.js'
import { worldVisualPosition } from './worldFactory4x.js'

export const WORLD_VISUAL_SCALE=.62
const point=id=>{const [x,y]=parseTile(id),p=worldVisualPosition(x,y).multiplyScalar(WORLD_VISUAL_SCALE);p.y=.09;return p}
function label(text,color=0xffffff){
 const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(17,31,28,.9)';x.roundRect(8,15,496,98,24);x.fill();x.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;x.lineWidth=4;x.stroke();x.fillStyle='#e7eadf';x.font='900 30px Inter,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,64,450);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(4.2,1.05,1);return s
}
function districtBadge(parent,x,z,name,color){const l=label(name,color);l.scale.multiplyScalar(.58);l.material.opacity=.82;l.position.set(x,.42,z);parent.add(l)}
function marker(parent,p,text,color=0x53d2a0){const g=new THREE.Group();g.position.copy(p);const ring=new THREE.Mesh(new THREE.RingGeometry(.5,.72,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;g.add(ring);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.04,.07,1.25,10),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.46,depthWrite:false}));beam.position.y=.62;g.add(beam);const l=label(text,color);l.position.y=1.48;l.scale.multiplyScalar(.62);g.add(l);parent.add(g);return g}

export class WorldClarityOverlay extends THREE.Group{
 constructor(state){super();this.state=state;this.name='world-clarity-v8';this.objectiveId=null;this.buildBase();this.sync(state,true)}
 buildBase(){
  districtBadge(this,-8.8,-8.8,'RIVERSIDE',0x5fb08a);districtBadge(this,8.8,-8.8,'BUSINESS PARK',0x78a7d4)
  districtBadge(this,-8.8,8.8,'WEST END',0xc49a6c);districtBadge(this,8.8,8.8,'CENTRAL',0x9d84c7)
  marker(this,point(BASE_TILE),'ACHU HQ',0x53d2a0)
 }
 sync(state,force=false){
  this.state=state;const flow=fourXFlow(state),id=flow.target??null;if(!force&&id===this.objectiveId)return
  this.objective?.removeFromParent();this.objective=null;this.objectiveId=id;if(!id)return
  // The objective marker now uses exactly the same lot transform as the city.
  // It cannot drift onto a road while the researched property sits elsewhere.
  this.objective=marker(this,point(id),`NEXT · ${flow.label}`,0xe0b85a)
 }
 animate(now){if(!this.objective)return;const s=1+Math.sin(now*.004)*.07;this.objective.scale.setScalar(s)}
 objectivePoint(){return this.objectiveId?point(this.objectiveId):point(BASE_TILE)}
}
