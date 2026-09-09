import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

const gltf=new GLTFLoader()
const fbx=new FBXLoader()

// Existing ACHU/Kenney sources are pinned. The car/tree FBX sources below are
// byte-identical public mirrors of the packs supplied for this rebuild.
const KENNEY_MIRROR='https://raw.githubusercontent.com/Jolomolokolo/Trackenomics/421363bca8386b6955a09a6e4abadcd1ddc45601/models'
const KENNEY_CITY=`${KENNEY_MIRROR}/city`
const KENNEY_CARS=`${KENNEY_MIRROR}/cars`
const KENNEY_ROADS='https://raw.githubusercontent.com/Rbitah/BRace-game/15ef8e4a210668a0ef2f383e4fe9a7cd86a000f6/assets/env/kenney_city-kit-roads'
const USER_PACK='https://raw.githubusercontent.com/luisfillipedias/OHOMEMDEMETAS/3b44f2ba45d980a95713394f1ef1a6803b3c921c/assets/models'
const USER_CARS=`${USER_PACK}/car/designersoup`
const USER_TREES=`${USER_PACK}/trees/Trees`
const CHARACTER='https://raw.githubusercontent.com/euuuuuuan/fatal-funnel-public/main/packages/renderer/assets/models/quaternius-men/worker.glb'
const ANIMATIONS='https://raw.githubusercontent.com/Seyamalam/blood-league-kickoff/main/public/assets/vendor/quaternius/universal-animation-library.glb'

const gltfFiles={
 achuHq:[KENNEY_CITY,'building-type-t.glb'],
 achuOffice:[KENNEY_CITY,'building-type-k.glb'],
 achuClient:[KENNEY_CITY,'building-type-o.glb'],
 achuStudio:[KENNEY_CITY,'building-type-p.glb'],
 achuSmallOffice:[KENNEY_CITY,'building-type-q.glb'],
 achuWarehouse:[KENNEY_CITY,'building-type-h.glb'],
 achuDepot:[KENNEY_CITY,'building-type-i.glb'],
 carVan:[KENNEY_CARS,'van.glb'],
 carDelivery:[KENNEY_CARS,'delivery.glb'],
 carSedan:[KENNEY_CARS,'sedan.glb'],
 carSuv:[KENNEY_CARS,'suv.glb'],
 carTruck:[KENNEY_CARS,'truck.glb'],
 roadStraight:[KENNEY_ROADS,'road-straight.glb'],
 roadCrossroad:[KENNEY_ROADS,'road-crossroad.glb'],
 roadCrossing:[KENNEY_ROADS,'road-crossing.glb'],
 roadIntersection:[KENNEY_ROADS,'road-intersection.glb'],
 roadIntersectionPath:[KENNEY_ROADS,'road-intersection-path.glb'],
 roadBend:[KENNEY_ROADS,'road-bend.glb'],
 roadBendSidewalk:[KENNEY_ROADS,'road-bend-sidewalk.glb'],
 roadEnd:[KENNEY_ROADS,'road-end.glb'],
 roadEndRound:[KENNEY_ROADS,'road-end-round.glb'],
 roadRoundabout:[KENNEY_ROADS,'road-roundabout.glb'],
 roadCurve:[KENNEY_ROADS,'road-curve.glb'],
 roadCurveIntersection:[KENNEY_ROADS,'road-curve-intersection.glb'],
 roadSplit:[KENNEY_ROADS,'road-split.glb'],
 roadDrivewaySingle:[KENNEY_ROADS,'road-driveway-single.glb'],
 roadDrivewayDouble:[KENNEY_ROADS,'road-driveway-double.glb'],
 roadSide:[KENNEY_ROADS,'road-side.glb'],
 roadSideEntry:[KENNEY_ROADS,'road-side-entry.glb'],
 roadSideExit:[KENNEY_ROADS,'road-side-exit.glb'],
 roadBridge:[KENNEY_ROADS,'road-bridge.glb'],
 roadSlant:[KENNEY_ROADS,'road-slant.glb'],
 roadSlantHigh:[KENNEY_ROADS,'road-slant-high.glb'],
 roadSlantFlat:[KENNEY_ROADS,'road-slant-flat.glb'],
 bridgePillar:[KENNEY_ROADS,'bridge-pillar.glb'],
 bridgePillarWide:[KENNEY_ROADS,'bridge-pillar-wide.glb'],
 roadBarrier:[KENNEY_ROADS,'construction-barrier.glb'],
 roadCone:[KENNEY_ROADS,'construction-cone.glb'],
 roadFence:[KENNEY_ROADS,'construction-fence.glb'],
 roadSignStop:[KENNEY_ROADS,'road-sign-stop.glb'],
 roadSignWarning:[KENNEY_ROADS,'road-sign-warning.glb'],
 roadSignStreet:[KENNEY_ROADS,'road-sign-street.glb'],
 highwaySign:[KENNEY_ROADS,'sign-highway-wide.glb'],
 roadLight:[KENNEY_ROADS,'light-square.glb'],
 roadLightCurved:[KENNEY_ROADS,'light-curved.glb'],
 roadTrafficLight:[KENNEY_ROADS,'traffic-light.glb']
}
const fbxFiles={
 userBeatall:[USER_CARS,'Beatall.fbx'],
 userDoc:[USER_CARS,'docLorean.fbx'],
 userLandy:[USER_CARS,'Landyroamer.fbx'],
 userToyoyo:[USER_CARS,'Toyoyo Highlight.fbx'],
 userTristar:[USER_CARS,'Tristar Racer.fbx'],
 userTrees:[USER_TREES,'Trees.fbx']
}
export const USER_CAR_KEYS=['userBeatall','userLandy','userToyoyo','userTristar','userDoc']

function prep(root){
 root.traverse(o=>{
  if(!o.isMesh)return
  o.castShadow=true;o.receiveShadow=true
  const mats=Array.isArray(o.material)?o.material:[o.material]
  for(const m of mats){
   if(m?.map)m.map.colorSpace=THREE.SRGBColorSpace
   if(m){m.side=THREE.DoubleSide;m.needsUpdate=true}
  }
 })
 return root
}
function cloneMaterials(root){
 root.traverse(o=>{
  if(!o.isMesh||!o.material)return
  o.material=Array.isArray(o.material)?o.material.map(m=>m?.clone?.()??m):o.material.clone?.()??o.material
 })
 return root
}
function placeholder(name){
 const g=new THREE.Group(),n=name.toLowerCase()
 if(n.includes('road')||n.includes('bridge')){
  const road=new THREE.Mesh(new THREE.BoxGeometry(1,.04,1),new THREE.MeshStandardMaterial({color:0x313b3d,roughness:.98}));road.position.y=.02;g.add(road)
 }else if(n.includes('tree')){
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.1,.14,.7,7),new THREE.MeshStandardMaterial({color:0x654837,roughness:1}));trunk.position.y=.35;g.add(trunk)
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.52,1),new THREE.MeshStandardMaterial({color:0x397156,roughness:1}));crown.scale.y=1.35;crown.position.y=1.05;g.add(crown)
 }else if(n.includes('car')||n.includes('beat')||n.includes('landy')||n.includes('toyoyo')||n.includes('tristar')||n.includes('doc')){
  const body=new THREE.Mesh(new THREE.BoxGeometry(.7,.38,1.25),new THREE.MeshStandardMaterial({color:0x397f68,roughness:.75}));body.position.y=.34;g.add(body)
  const cab=new THREE.Mesh(new THREE.BoxGeometry(.64,.28,.42),new THREE.MeshStandardMaterial({color:0x879990,roughness:.5}));cab.position.set(0,.57,.32);g.add(cab)
 }else{
  const wall=new THREE.Mesh(new THREE.BoxGeometry(1,.95,.8),new THREE.MeshStandardMaterial({color:0x687a72,roughness:.9}));wall.position.y=.48;g.add(wall)
 }
 return prep(g)
}
async function loadGltf(base,file){const asset=await gltf.loadAsync(encodeURI(`${base}/${file}`));return prep(asset.scene)}
async function loadFbx(base,file){const root=await fbx.loadAsync(encodeURI(`${base}/${file}`));return prep(root)}
async function loadCharacter(){const asset=await gltf.loadAsync(CHARACTER);prep(asset.scene);return asset}
async function loadAnimations(){return gltf.loadAsync(ANIMATIONS)}
function hasMesh(o){let yes=false;o?.traverse?.(x=>{if(x.isMesh)yes=true});return yes}
function plausibleTree(o){
 try{const b=new THREE.Box3().setFromObject(o),s=b.getSize(new THREE.Vector3()),h=s.y,w=Math.max(s.x,s.z);return Number.isFinite(h)&&h>.001&&w>.001&&h/w>.65&&h/w<7}catch{return false}
}
function findTreeVariants(root){
 const direct=(root.children??[]).filter(hasMesh),nested=direct.length<=1?(direct[0]?.children??[]).filter(hasMesh):[]
 const candidates=(nested.length>1?nested:direct).filter(plausibleTree)
 return candidates.length?candidates.slice(0,12):[root]
}
function normalizeTree(view,targetHeight=1.6){
 view.updateMatrixWorld(true);let b=new THREE.Box3().setFromObject(view),s=b.getSize(new THREE.Vector3())
 const scale=targetHeight/Math.max(.001,s.y);view.scale.multiplyScalar(scale);view.updateMatrixWorld(true)
 b=new THREE.Box3().setFromObject(view);const cx=(b.min.x+b.max.x)/2,cz=(b.min.z+b.max.z)/2
 view.position.x-=cx;view.position.z-=cz;view.position.y-=b.min.y
 return prep(view)
}

export class AssetBank{
 constructor(){this.models={};this.treeVariants=[];this.character=null;this.characterAnimations=[];this.ready=false}
 async load(){
  const ge=Object.entries(gltfFiles),fe=Object.entries(fbxFiles)
  const [gltfResult,fbxResult,characterResult,animationResult]=await Promise.all([
   Promise.allSettled(ge.map(([,src])=>loadGltf(src[0],src[1]))),
   Promise.allSettled(fe.map(([,src])=>loadFbx(src[0],src[1]))),
   Promise.allSettled([loadCharacter()]),
   Promise.allSettled([loadAnimations()])
  ])
  gltfResult.forEach((result,i)=>{const [key,src]=ge[i];if(result.status==='fulfilled')this.models[key]=result.value;else console.warn(`GLTF failed: ${src[1]}`,result.reason)})
  fbxResult.forEach((result,i)=>{const [key,src]=fe[i];if(result.status==='fulfilled')this.models[key]=result.value;else console.warn(`FBX failed: ${src[1]}`,result.reason)})
  this.treeVariants=this.models.userTrees?findTreeVariants(this.models.userTrees):[]
  if(characterResult[0]?.status==='fulfilled'){
   this.character=characterResult[0].value.scene;this.characterAnimations=characterResult[0].value.animations??[]
  }else console.warn('Clothed crew asset failed; using fallback crew',characterResult[0]?.reason)
  if(!this.characterAnimations.length&&animationResult[0]?.status==='fulfilled')this.characterAnimations=animationResult[0].value.animations??[]
  else if(!this.characterAnimations.length)console.warn('Humanoid animation library failed',animationResult[0]?.reason)
  this.ready=true;return this
 }
 clone(name){const src=this.models[name];return src?prep(cloneMaterials(src.clone(true))):placeholder(name)}
 cloneCar(index=0){const key=USER_CAR_KEYS[Math.abs(index)%USER_CAR_KEYS.length],src=this.models[key];return src?prep(cloneMaterials(src.clone(true))):this.clone('carSedan')}
 cloneTree(index=0,targetHeight=1.6){
  const src=this.treeVariants?.length?this.treeVariants[Math.abs(index)%this.treeVariants.length]:null
  return src?normalizeTree(cloneMaterials(src.clone(true)),targetHeight):normalizeTree(placeholder('tree'),targetHeight)
 }
 cloneCharacter(){
  if(!this.character)return null
  const root=prep(cloneSkeleton(this.character));root.updateMatrixWorld(true)
  const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),height=Math.max(.01,size.y)
  root.scale.setScalar(1.48/height);root.updateMatrixWorld(true)
  const fitted=new THREE.Box3().setFromObject(root);root.position.y-=fitted.min.y
  root.userData.realCrew=true;root.userData.clothedWorker=true
  return root
 }
 characterClip(preferred='walk'){
  const clips=this.characterAnimations??[]
  return clips.find(c=>c.name.toLowerCase().includes(preferred))||clips.find(c=>c.name.toLowerCase().includes('idle'))||clips[0]||null
 }
}
