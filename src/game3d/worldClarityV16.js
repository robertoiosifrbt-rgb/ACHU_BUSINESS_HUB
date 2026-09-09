import * as THREE from 'three'
import { BASE_TILE,parseTile } from '../data/world.js'
import { fourXFlow } from './fourXFlow.js'
import { worldVisualPositionV16 } from './worldCityV16.js'

export const WORLD_VISUAL_SCALE=1
const point=id=>{const [x,y]=parseTile(id),p=worldVisualPositionV16(x,y).multiplyScalar(WORLD_VISUAL_SCALE);p.y=.11;return p}
function label(text,color=0xffffff){const c=document.createElement('canvas');c.width=300;c.height=76;const x=c.getContext('2d');x.fillStyle='rgba(12,27,24,.92)';x.roundRect(7,8,286,60,15);x.fill();x.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;x.lineWidth=3;x.stroke();x.fillStyle='#eef1e9';x.font='900 18px Inter,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,150,38,255);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(1.35,.34,1);return s}
function marker(parent,p,color=0x53d2a0,text=null){const g=new THREE.Group();g.position.copy(p);const ring=new THREE.Mesh(new THREE.RingGeometry(.20,.28,28),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;g.add(ring);const stem=new THREE.Mesh(new THREE.CylinderGeometry(.016,.025,.32,8),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.32,depthWrite:false}));stem.position.y=.16;g.add(stem);if(text){const l=label(text,color);l.position.y=.49;g.add(l)}parent.add(g);return g}
export class WorldClarityOverlay extends THREE.Group{
 constructor(state){super();this.state=state;this.name='world-clarity-v16-districts';this.objectiveId=null;this.baseMarker=null;this.objective=null;this.buildBase();this.sync(state,true)}
 buildBase(){this.baseMarker=marker(this,point(BASE_TILE),0x53d2a0);this.baseMarker.scale.setScalar(.72)}
 sync(state,force=false){this.state=state;const flow=fourXFlow(state),id=flow.target??null;if(!force&&id===this.objectiveId)return;this.objective?.removeFromParent();this.objective=null;this.objectiveId=id;if(!id)return;this.objective=marker(this,point(id),0xe0b85a,'NEXT')}
 animate(now){if(!this.objective)return;const s=1+Math.sin(now*.004)*.035;this.objective.scale.setScalar(s)}
 objectivePoint(){return this.objectiveId?point(this.objectiveId):point(BASE_TILE)}
 basePoint(){return point(BASE_TILE)}
}
