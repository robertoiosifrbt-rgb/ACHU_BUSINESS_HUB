import * as THREE from 'three'
import { BASE_TILE,parseTile,WORLD_CENTER } from '../data/world.js'
import { fourXFlow } from './fourXFlow.js'

export const WORLD_VISUAL_SCALE=.78
const TILE=1.72
const point=id=>{const [x,y]=parseTile(id);return new THREE.Vector3((x-WORLD_CENTER)*TILE*WORLD_VISUAL_SCALE,.09,(y-WORLD_CENTER)*TILE*WORLD_VISUAL_SCALE)}
function label(text,color=0xffffff){
 const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(17,31,28,.9)';x.roundRect(8,15,496,98,24);x.fill();x.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;x.lineWidth=4;x.stroke();x.fillStyle='#e7eadf';x.font='900 30px Inter,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,64,450);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(4.2,1.05,1);return s
}
function districtBadge(parent,x,z,name,color){const l=label(name,color);l.scale.multiplyScalar(.58);l.material.opacity=.82;l.position.set(x,.42,z);parent.add(l)}
function routeLine(parent,a,b){const mid=new THREE.Vector3(b.x,a.y,a.z),path=new THREE.CurvePath();path.add(new THREE.LineCurve3(a,mid));path.add(new THREE.LineCurve3(mid,b));const geo=new THREE.TubeGeometry(path,30,.055,6,false),m=new THREE.MeshBasicMaterial({color:0x53d2a0,transparent:true,opacity:.76,depthWrite:false});const line=new THREE.Mesh(geo,m);line.position.y=.05;parent.add(line)}
function marker(parent,p,text,color=0x53d2a0){const g=new THREE.Group();g.position.copy(p);const ring=new THREE.Mesh(new THREE.RingGeometry(.58,.82,40),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;g.add(ring);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.045,.08,1.5,10),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.46,depthWrite:false}));beam.position.y=.75;g.add(beam);const l=label(text,color);l.position.y=1.72;l.scale.multiplyScalar(.72);g.add(l);parent.add(g);return g}

export class WorldClarityOverlay extends THREE.Group{
 constructor(state){super();this.state=state;this.name='world-clarity-v7';this.objectiveId=null;this.buildBase();this.sync(state,true)}
 buildBase(){
  // Labels only. The old giant coloured district slabs obscured the rebuilt city.
  districtBadge(this,-8.8,-8.8,'RIVERSIDE',0x5fb08a)
  districtBadge(this,8.8,-8.8,'BUSINESS PARK',0x78a7d4)
  districtBadge(this,-8.8,8.8,'WEST END',0xc49a6c)
  districtBadge(this,8.8,8.8,'CENTRAL',0x9d84c7)
  const base=point(BASE_TILE);marker(this,base,'ACHU HQ',0x53d2a0)
 }
 sync(state,force=false){this.state=state;const flow=fourXFlow(state),id=flow.target??null;if(!force&&id===this.objectiveId)return;this.objective?.removeFromParent();this.route?.removeFromParent();this.objective=null;this.route=null;this.objectiveId=id;if(!id)return;const target=point(id),base=point(BASE_TILE),holder=new THREE.Group();routeLine(holder,base,target);this.route=holder;this.add(holder);this.objective=marker(this,target,`NEXT · ${flow.label}`,0xe0b85a)}
 animate(now){if(!this.objective)return;const s=1+Math.sin(now*.004)*.07;this.objective.scale.setScalar(s)}
 objectivePoint(){return this.objectiveId?point(this.objectiveId):point(BASE_TILE)}
}
