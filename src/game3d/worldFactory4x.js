import * as THREE from 'three'
import { worldTile,BASE_TILE,parseTile,WORLD_CENTER,FACTIONS } from '../data/world.js'

const SIZE=21
const BLOCK=6
const LOT_STEP=1.35
const ROAD_UNIT=2
const key=(x,y)=>`${x},${y}`
const cellKey=(x,z)=>`${x},${z}`
const hash=(x,y,s=0)=>Math.abs(Math.sin(x*91.17+y*47.31+s*17.71)*43758.5453)%1
const material=(color,rough=.78,metal=.03)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})
const transparent=(color,opacity)=>new THREE.MeshStandardMaterial({color,roughness:.9,transparent:true,opacity,depthWrite:false})
const box=(w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.castShadow=true;o.receiveShadow=true;return o}
const DIRS={N:[0,ROAD_UNIT],E:[ROAD_UNIT,0],S:[0,-ROAD_UNIT],W:[-ROAD_UNIT,0]}

function logicalCoord(i){const group=Math.floor(i/3),slot=i%3;return(group-3)*BLOCK+(slot-1)*LOT_STEP}
export function worldVisualPosition(x,y){return new THREE.Vector3(logicalCoord(x),0,logicalCoord(y))}
function disk(parent,r,color,opacity=.14,y=.015){const m=new THREE.Mesh(new THREE.CircleGeometry(r,48),transparent(color,opacity));m.rotation.x=-Math.PI/2;m.position.y=y;parent.add(m);return m}
function ring(parent,r,color,opacity=.5){const m=new THREE.Mesh(new THREE.RingGeometry(r*.78,r,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.055;parent.add(m);return m}
function labelSprite(text,color=0xffffff,small=false){const c=document.createElement('canvas');c.width=small?512:768;c.height=128;const x=c.getContext('2d');x.fillStyle='rgba(12,25,23,.82)';x.roundRect(10,16,c.width-20,96,24);x.fill();x.strokeStyle=`#${color.toString(16).padStart(6,'0')}`;x.lineWidth=3;x.stroke();x.fillStyle='#fff';x.font=`800 ${small?27:31}px Inter,Arial`;x.textAlign='center';x.textBaseline='middle';x.fillText(text.toUpperCase(),c.width/2,64,c.width-54);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(small?3.7:5.2,small?.92:1.05,1);return s}
function glow(color){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),h=`#${color.toString(16).padStart(6,'0')}`,g=x.createRadialGradient(64,64,4,64,64,60);g.addColorStop(0,'white');g.addColorStop(.16,h);g.addColorStop(.5,`${h}99`);g.addColorStop(1,'transparent');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));s.userData.pulse=Math.random()*6;return s}
function fitModel(view,{w=2,h=3,d=2}){view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),scale=Math.min(w/Math.max(.001,s.x),h/Math.max(.001,s.y),d/Math.max(.001,s.z));view.scale.multiplyScalar(scale);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function building(parent,bank,keyName,x,z,{w=1.05,h=1.5,d=1.0,rot=0}={}){const v=fitModel(bank?.clone?.(keyName)??new THREE.Group(),{w,h,d});v.position.set(x,0,z);v.rotation.y=rot;parent.add(v);return v}
function tree(parent,bank,x,z,s=1,i=0){const v=bank?.cloneTree?.(i,1.15*s);if(v){v.position.set(x,0,z);v.rotation.y=hash(i,3)*Math.PI*2;parent.add(v);return v}return null}
function fitCar(view,target=1.15){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),longX=s.x>s.z*1.08;const sc=target/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;view.userData.forwardOffset=longX?Math.PI/2:Math.PI;return view}
function car(parent,bank,index=0,target=1.15){const v=fitCar(bank?.cloneCar?.(index)??bank?.clone?.('carSedan')??new THREE.Group(),target);parent.add(v);return v}
function fitRoad(view,size=ROAD_UNIT){view.rotation.set(0,0,0);view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3()),sc=size/Math.max(.001,Math.max(s.x,s.z));view.scale.multiplyScalar(sc);view.updateMatrixWorld(true);b=new THREE.Box3().setFromObject(view);view.position.x-=(b.min.x+b.max.x)/2;view.position.z-=(b.min.z+b.max.z)/2;view.position.y-=b.min.y;return view}
function roadTile(parent,bank,keyName,x,z,rot=0,size=ROAD_UNIT,y=.02){const src=bank?.models?.[keyName]?bank.clone(keyName):bank?.clone?.('roadStraight')??new THREE.Group(),v=fitRoad(src,size);v.position.set(x,y,z);v.rotation.y=rot;parent.add(v);return v}

function addSegment(cells,a,b){let [x,z]=a,[tx,tz]=b;cells.add(cellKey(x,z));while(x!==tx||z!==tz){if(x!==tx)x+=Math.sign(tx-x)*ROAD_UNIT;else z+=Math.sign(tz-z)*ROAD_UNIT;cells.add(cellKey(x,z))}}
function addRoute(cells,points){for(let i=0;i<points.length-1;i++)addSegment(cells,points[i],points[i+1])}
function buildRoadCells(){
 const cells=new Set()
 // Hand-built city: winding distributor roads, short branches and two river crossings.
 addRoute(cells,[[-21,-15],[-15,-15],[-15,-9],[-9,-9],[-9,-3],[-3,-3],[3,-3],[3,3],[9,3],[9,9],[15,9],[15,15],[21,15]])
 addRoute(cells,[[-3,-21],[-3,-15],[3,-15],[3,-9],[3,-3],[3,3],[3,9],[-3,9],[-3,15],[-9,15],[-9,21]])
 addRoute(cells,[[9,-21],[9,-15],[15,-15],[15,-9],[9,-9],[9,-3],[15,-3],[21,-3]])
 addRoute(cells,[[-21,9],[-15,9],[-15,3],[-9,3],[-9,9],[-3,9]])
 addRoute(cells,[[-21,-3],[-15,-3],[-15,-9]])
 addRoute(cells,[[15,15],[21,15],[21,9]])
 return cells
}
const ROAD_CELLS=buildRoadCells()
function connections(cells,x,z){return Object.entries(DIRS).filter(([,d])=>cells.has(cellKey(x+d[0],z+d[1]))).map(([n])=>n)}
function roadSpec(c){const has=n=>c.includes(n),n=c.length;if(n>=4)return['roadCrossroad',0];if(n===3){if(!has('S'))return['roadIntersectionPath',0];if(!has('W'))return['roadIntersectionPath',Math.PI/2];if(!has('N'))return['roadIntersectionPath',Math.PI];return['roadIntersectionPath',-Math.PI/2]}if(n===2){if(has('E')&&has('W'))return['roadStraight',0];if(has('N')&&has('S'))return['roadStraight',Math.PI/2];if(has('N')&&has('W'))return['roadBendSidewalk',0];if(has('N')&&has('E'))return['roadBendSidewalk',Math.PI/2];if(has('S')&&has('E'))return['roadBendSidewalk',Math.PI];return['roadBendSidewalk',-Math.PI/2]}if(n===1){if(has('E'))return['roadEndRound',0];if(has('S'))return['roadEndRound',Math.PI/2];if(has('W'))return['roadEndRound',Math.PI];return['roadEndRound',-Math.PI/2]}return['roadStraight',0]}
function bridgeOverride(x,z,c){
 // Canal is centred at z=-12. Two roads rise above it instead of cutting through water.
 if((x===-15||x===9)&&z===-15)return['roadSlantHigh',Math.PI/2]
 if((x===-15||x===9)&&(z===-13||z===-11))return['roadBridge',Math.PI/2]
 if((x===-15||x===9)&&z===-9)return['roadSlantHigh',-Math.PI/2]
 if(x===3&&z===3)return['roadRoundabout',0,3.35]
 return null
}
function bridgePillar(parent,bank,x,z){if(!bank?.models?.bridgePillarWide)return;const p=fitModel(bank.clone('bridgePillarWide'),{w:.72,h:1.05,d:.72});p.position.set(x,-.02,z);parent.add(p)}
function buildCanal(parent,bank){
 const water=box(46,.035,3.4,new THREE.MeshStandardMaterial({color:0x4d8b91,roughness:.42,metalness:.05,transparent:true,opacity:.88}));water.position.set(0,-.045,-12);water.castShadow=false;parent.add(water)
 const bankMat=material(0x6c7d70,.98);for(const z of[-10.15,-13.85]){const bank=box(46,.12,.55,bankMat);bank.position.set(0,-.015,z);bank.castShadow=false;parent.add(bank)}
 for(const x of[-15,9])for(const z of[-13,-11])bridgePillar(parent,bank,x,z)
 for(let i=0;i<18;i++){const x=-20+i*2.35;if(Math.abs(x+15)<2.2||Math.abs(x-9)<2.2)continue;tree(parent,bank,x,-9.55,.62+(i%3)*.08,80+i);tree(parent,bank,x,-14.45,.58+((i+1)%3)*.08,120+i)}
}
function buildCityRoads(parent,bank){
 buildCanal(parent,bank)
 for(const k of ROAD_CELLS){const [x,z]=k.split(',').map(Number),c=connections(ROAD_CELLS,x,z),special=bridgeOverride(x,z,c);if(special){roadTile(parent,bank,special[0],x,z,special[1],special[2]??ROAD_UNIT);continue}const [asset,rot]=roadSpec(c);roadTile(parent,bank,asset,x,z,rot)}
 // A couple of proper driveways and roadside details stop the city reading like a tile demo.
 roadTile(parent,bank,'roadDrivewayDouble',-11,-3,0);roadTile(parent,bank,'roadDrivewaySingle',13,9,Math.PI)
 ;[[-7,-3,0],[7,3,Math.PI],[-15,7,Math.PI/2],[15,-5,-Math.PI/2]].forEach(([x,z,r],i)=>{const l=bank?.models?.roadLightCurved?fitModel(bank.clone('roadLightCurved'),{w:.22,h:1.55,d:.22}):null;if(l){l.position.set(x,.02,z);l.rotation.y=r;parent.add(l)}if(i%2===0&&bank?.models?.roadSignStreet){const s=fitModel(bank.clone('roadSignStreet'),{w:.34,h:.75,d:.2});s.position.set(x+.55,.02,z+.35);s.rotation.y=r;parent.add(s)}})
}
function sidewalkTrees(parent,bank){let i=0;for(let gy=-3;gy<=3;gy++)for(let gx=-3;gx<=3;gx++){const cx=gx*BLOCK,cz=gy*BLOCK,spots=[[-2.05,-2.05],[2.05,-2.05],[-2.05,2.05],[2.05,2.05]];for(const [ox,oz] of spots){const px=cx+ox,pz=cz+oz;if(Math.abs(pz+12)<2.4)continue;if(hash(gx,gy,i++)<.42)tree(parent,bank,px,pz,.62+hash(i,2)*.16,i)}}}

function routeCurve(points,closed=true){const pts=points.map(p=>new THREE.Vector3(p[0],p[1]??0,p[2]??p[1]??0));return new THREE.CatmullRomCurve3(pts,closed,'centripetal',.22)}
function trafficNetwork(parent,bank){
 const riverLoop=routeCurve([[-15,.05,-15],[-15,1.05,-12],[-15,.05,-9],[-9,.05,-9],[-9,.05,-3],[-3,.05,-3],[3,.05,-3],[3,.05,3],[9,.05,3],[9,.05,9],[15,.05,9],[15,.05,15],[21,.05,15],[15,.05,15],[15,.05,9],[9,.05,9],[9,.05,3],[3,.05,3],[3,.05,-3],[-3,.05,-3],[-9,.05,-3],[-9,.05,-9]],true)
 const eastLoop=routeCurve([[9,.05,-21],[9,.05,-15],[9,1.05,-12],[9,.05,-9],[15,.05,-9],[15,.05,-3],[9,.05,-3],[9,.05,3],[3,.05,3],[3,.05,-3],[3,.05,-9],[3,.05,-15],[9,.05,-15]],true)
 const westLoop=routeCurve([[-21,.05,9],[-15,.05,9],[-15,.05,3],[-9,.05,3],[-9,.05,9],[-3,.05,9],[-3,.05,15],[-9,.05,15],[-9,.05,21],[-9,.05,15],[-3,.05,15],[-3,.05,9]],true)
 const routes=[riverLoop,eastLoop,westLoop],traffic=[]
 for(let i=0;i<12;i++){const v=car(parent,bank,i,1.0+(i%3)*.08);traffic.push({view:v,curve:routes[i%routes.length],offset:i*.079,speed:.0000068+(i%4)*.0000008})}
 return traffic
}
function moveTraffic(traffic,now){for(const t of traffic??[]){const u=(t.offset+now*t.speed)%1,pos=t.curve.getPointAt(u),tan=t.curve.getTangentAt(u).normalize();t.view.position.set(pos.x,pos.y+.075,pos.z);t.view.rotation.y=Math.atan2(tan.x,tan.z)+(t.view.userData.forwardOffset??0)}}

function opportunity(parent,bank,resource,x,y,featured){const colors={meat:0x4bd39e,wood:0x62aee8,coal:0xf2b956,iron:0xb98be5},c=colors[resource]??0x8bcfc0;if(!featured){if(hash(x,y)<.12)tree(parent,bank,0,0,.48,x+y);return}ring(parent,.56,c,.55);const pin=glow(c);pin.position.set(.22,.78,.03);pin.scale.setScalar(.78);parent.add(pin);if(resource==='meat'){building(parent,bank,'achuClient',0,0,{w:.95,h:1.05,d:.9,rot:.2});const v=car(parent,bank,x+y,.54);v.position.set(.38,.04,.34);v.rotation.y=-.35+(v.userData.forwardOffset??0)}else if(resource==='wood')building(parent,bank,'achuDepot',0,0,{w:1.0,h:.78,d:.9});else if(resource==='coal'){const board=box(.9,.58,.07,material(0x263b37,.48,.1));board.position.set(0,.52,0);parent.add(board)}else building(parent,bank,'achuOffice',0,0,{w:.9,h:1.15,d:.88})}
function contract(parent,bank,level=1){const c=level>=5?0xef7767:0xf0a64d;ring(parent,.6,c,.62);building(parent,bank,'achuSmallOffice',0,0,{w:1.0,h:1.18,d:.94,rot:.2});const l=labelSprite(level>=5?'PREMIUM TENDER':'CONTRACT',c,true);l.scale.multiplyScalar(.42);l.position.set(0,1.42,0);parent.add(l)}
function rival(parent,bank,tier,color,name){building(parent,bank,'achuOffice',0,0,{w:1.05,h:1.25+Math.min(5,tier)*.14,d:.96,rot:.25});ring(parent,.64,color,.52);const l=labelSprite(name??'RIVAL',color,true);l.scale.multiplyScalar(.4);l.position.set(0,1.8,0);parent.add(l)}
function hitPlane(parent,id){const h=new THREE.Mesh(new THREE.PlaneGeometry(LOT_STEP*1.02,LOT_STEP*1.02),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));h.rotation.x=-Math.PI/2;h.position.y=.07;h.userData.tileId=id;parent.add(h)}

function nearestRoadCell(p){let best=null,bestD=Infinity;for(const k of ROAD_CELLS){const [x,z]=k.split(',').map(Number),d=(p.x-x)**2+(p.z-z)**2;if(d<bestD){bestD=d;best=[x,z]}}return best}
function shortestRoadPath(start,end){const sk=cellKey(...start),ek=cellKey(...end),q=[sk],prev=new Map([[sk,null]]);while(q.length){const k=q.shift();if(k===ek)break;const [x,z]=k.split(',').map(Number);for(const d of Object.values(DIRS)){const nk=cellKey(x+d[0],z+d[1]);if(ROAD_CELLS.has(nk)&&!prev.has(nk)){prev.set(nk,k);q.push(nk)}}}if(!prev.has(ek))return[start,end];const out=[];for(let k=ek;k;k=prev.get(k)){out.push(k.split(',').map(Number))}return out.reverse()}
function roadElevation(x,z){if((x===-15||x===9)&&(z===-13||z===-11))return 1.02;if((x===-15||x===9)&&(z===-15||z===-9))return .5;return .03}
function marchRoute(targetId){const [tx,ty]=parseTile(targetId),target=worldVisualPosition(tx,ty),start=nearestRoadCell(worldVisualPosition(WORLD_CENTER,WORLD_CENTER)),end=nearestRoadCell(target),cells=shortestRoadPath(start,end),points=[worldVisualPosition(WORLD_CENTER,WORLD_CENTER)];for(const [x,z] of cells)points.push(new THREE.Vector3(x,roadElevation(x,z),z));points.push(target);return points}
function pointOnPolyline(points,u){if(points.length<2)return{pos:points[0]?.clone()??new THREE.Vector3(),tan:new THREE.Vector3(0,0,1)};const lens=[],total=points.slice(1).reduce((sum,p,i)=>{const l=p.distanceTo(points[i]);lens.push(l);return sum+l},0),want=Math.max(0,Math.min(1,u))*Math.max(.001,total);let acc=0;for(let i=0;i<lens.length;i++){if(want<=acc+lens[i]||i===lens.length-1){const t=(want-acc)/Math.max(.001,lens[i]),pos=points[i].clone().lerp(points[i+1],Math.max(0,Math.min(1,t))),tan=points[i+1].clone().sub(points[i]).normalize();return{pos,tan}}acc+=lens[i]}return{pos:points.at(-1).clone(),tan:new THREE.Vector3(0,0,1)}}

export class World3D4X extends THREE.Group{
 constructor(bank,state){super();this.bank=bank;this.state=state;this.tiles=new Map();this.marchObjects=new Map();this.traffic=[];this.build()}
 build(){this.clear();this.tiles.clear();this.marchObjects.clear();const span=47,ground=new THREE.Mesh(new THREE.PlaneGeometry(span,span),material(0xa9b7ae,1));ground.rotation.x=-Math.PI/2;ground.position.y=-.09;ground.receiveShadow=true;this.add(ground);buildCityRoads(this,this.bank);sidewalkTrees(this,this.bank);this.traffic=trafficNetwork(this,this.bank);const owned=new Set(this.state.world.owned??[]),scouted=new Set(this.state.world.scouted??[]);for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){const def=worldTile(x,y),id=key(x,y),known=scouted.has(id),ours=owned.has(id),p=worldVisualPosition(x,y),g=new THREE.Group();g.position.copy(p);g.userData.tileId=id;hitPlane(g,id);const adjacentOwned=[`${x+1},${y}`,`${x-1},${y}`,`${x},${y+1}`,`${x},${y-1}`].some(n=>owned.has(n));if(ours){disk(g,.59,0x45c996,.12,.026);ring(g,.57,0x4ed6a0,.24)}if(known){if(id===BASE_TILE){building(g,this.bank,'achuHq',0,0,{w:1.12,h:1.8,d:1.05,rot:.15});ring(g,.72,0x52d9a6,.7);const l=labelSprite('ACHU HQ',0x52d9a6,true);l.scale.multiplyScalar(.46);l.position.set(0,2.08,0);g.add(l)}else if(def.kind==='settlement')rival(g,this.bank,def.tier??1,FACTIONS[def.tag]?.color??0xc397d3,FACTIONS[def.tag]?.name??'Competitor');else if(def.kind==='camp'&&!this.state.world.defeated.includes(id))contract(g,this.bank,def.level);else if(def.kind==='resource')opportunity(g,this.bank,def.resource,x,y,ours||adjacentOwned);else if(hash(x,y)<.28)tree(g,this.bank,0,0,.42,x*31+y)}else if(adjacentOwned){const q=glow(0xa5e4cd);q.material.opacity=.42;q.position.set(0,.30,0);q.scale.setScalar(.28);g.add(q)}g.traverse(o=>{o.userData.tileId=id});this.add(g);this.tiles.set(id,g)}this.refreshMarches();moveTraffic(this.traffic,Date.now())}
 refresh(){this.build()}
 refreshMarches(){for(const o of this.marchObjects.values())o.removeFromParent();this.marchObjects.clear();for(const m of this.state.world.marches??[]){const o=car(this,this.bank,m.type==='attack'?4:1,.82);o.userData.route=marchRoute(m.target);this.marchObjects.set(m.id,o)}this.updateMarches(Date.now())}
 updateMarches(now){moveTraffic(this.traffic,now);for(const m of this.state.world.marches??[]){const o=this.marchObjects.get(m.id);if(!o)continue;let p=1,returning=false;if(m.phase==='outbound')p=Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)));else if(m.phase==='returning'){returning=true;p=1-Math.max(0,Math.min(1,(now-m.phaseStartedAt)/Math.max(1,m.arriveAt-m.phaseStartedAt)))}const route=o.userData.route??marchRoute(m.target),sample=pointOnPolyline(route,p),tan=returning?sample.tan.multiplyScalar(-1):sample.tan;o.position.set(sample.pos.x,sample.pos.y+.075,sample.pos.z);o.rotation.y=Math.atan2(tan.x,tan.z)+(o.userData.forwardOffset??0)}}
 focusTile(id){const t=this.tiles.get(id);return t?new THREE.Vector3(t.position.x,0,t.position.z):new THREE.Vector3()}
}
