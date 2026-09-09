import * as THREE from 'three'
import { BASE_TILE,parseTile } from '../data/world.js'
import { fourXFlow } from './fourXFlow.js'
import { worldVisualPositionV17 } from './worldCityV17.js'

export const WORLD_VISUAL_SCALE=1
const point=(id,objective=false)=>{const [x,y]=parseTile(id),p=worldVisualPositionV17(x,y);if(objective){p.x+=p.x<0?.48:-.48;p.z+=.48}p.y=.11;return p}
function label(text,color=0xffffff){const c=document.createElement('canvas');c.width=420;c.height=88;const x=c.getContext('2d');x.fillStyle='rgba(15,30,27,.92)';x.roundRect(8,10,404,68,18);x.fill();x.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;x.lineWidth=3;x.stroke();x.fillStyle='#e7eadf';x.font='900 22px Inter,Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(text,210,44,360);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(1.9,.4,1);return s}
function marker(parent,p,text,color=0x53d2a0){const g=new THREE.Group();g.position.copy(p);const ring=new THREE.Mesh(new THREE.RingGeometry(.24,.33,32),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;g.add(ring);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.018,.03,.38,9),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.34,depthWrite:false}));beam.position.y=.19;g.add(beam);const l=label(text,color);l.position.y=.58;g.add(l);parent.add(g);return g}
export class WorldClarityOverlay extends THREE.Group{
 constructor(state){super();this.state=state;this.name='world-clarity-v17';this.objectiveId=null;this.baseMarker=null;this.objective=null;this.buildBase();this.sync(state,true)}
 buildBase(){this.baseMarker=marker(this,point(BASE_TILE),'ACHU HQ',0x53d2a0);this.baseMarker.scale.setScalar(.68)}
 sync(state,force=false){this.state=state;const flow=fourXFlow(state),id=flow.target??null;if(!force&&id===this.objectiveId)return;this.objective?.removeFromParent();this.objective=null;this.objectiveId=id;if(!id)return;this.objective=marker(this,point(id,true),'NEXT',0xe0b85a)}
 animate(now){if(!this.objective)return;const s=1+Math.sin(now*.004)*.035;this.objective.scale.setScalar(s)}
 objectivePoint(){return this.objectiveId?point(this.objectiveId,true):point(BASE_TILE)}
 basePoint(){return point(BASE_TILE)}
}
