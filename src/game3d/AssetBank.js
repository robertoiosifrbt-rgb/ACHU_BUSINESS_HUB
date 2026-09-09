import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

const gltf=new GLTFLoader()

// Kenney packs used by the ACHU visual overhaul. Mirrors are pinned to
// immutable commits so the live game cannot silently change underneath us.
const KENNEY_MIRROR='https://raw.githubusercontent.com/Jolomolokolo/Trackenomics/421363bca8386b6955a09a6e4abadcd1ddc45601/models'
const KENNEY_CITY=`${KENNEY_MIRROR}/city`
const KENNEY_CARS=`${KENNEY_MIRROR}/cars`
const KENNEY_ROADS='https://raw.githubusercontent.com/Rbitah/BRace-game/15ef8e4a210668a0ef2f383e4fe9a7cd86a000f6/assets/env/kenney_city-kit-roads'
const CHARACTER='https://raw.githubusercontent.com/euuuuuuan/fatal-funnel-public/main/packages/renderer/assets/models/quaternius-men/worker.glb'
const ANIMATIONS='https://raw.githubusercontent.com/Seyamalam/blood-league-kickoff/main/public/assets/vendor/quaternius/universal-animation-library.glb'

const files={
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
 roadLight:[KENNEY_ROADS,'light-square.glb'],
 roadTrafficLight:[KENNEY_ROADS,'traffic-light.glb']
}

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

function placeholder(name){
 const g=new THREE.Group(),n=name.toLowerCase()
 if(n.includes('road')){
  const road=new THREE.Mesh(new THREE.BoxGeometry(1,.04,1),new THREE.MeshStandardMaterial({color:0x273034,roughness:.98}));road.position.y=.02;g.add(road)
 }else if(n.includes('tree')||n.includes('pine')){
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,.7,6),new THREE.MeshStandardMaterial({color:0x6a4936,roughness:1}));trunk.position.y=.35;g.add(trunk)
  const crown=new THREE.Mesh(new THREE.ConeGeometry(.62,1.65,8),new THREE.MeshStandardMaterial({color:0x4f7d5d,roughness:1}));crown.position.y=1.25;g.add(crown)
 }else if(n.includes('car')||n.includes('truck')||n.includes('van')||n.includes('delivery')){
  const body=new THREE.Mesh(new THREE.BoxGeometry(.7,.38,1.25),new THREE.MeshStandardMaterial({color:0x397f68,roughness:.75}));body.position.y=.34;g.add(body)
  const cab=new THREE.Mesh(new THREE.BoxGeometry(.64,.28,.42),new THREE.MeshStandardMaterial({color:0x758a82,roughness:.5}));cab.position.set(0,.57,.36);g.add(cab)
 }else if(n.includes('achu')){
  const b=new THREE.Mesh(new THREE.BoxGeometry(1.35,1.05,1.05),new THREE.MeshStandardMaterial({color:0x74857d,roughness:.82}));b.position.y=.525;g.add(b)
 }else{
  const wall=new THREE.Mesh(new THREE.BoxGeometry(1,.95,.16),new THREE.MeshStandardMaterial({color:0x68767b,roughness:1}));wall.position.y=.48;g.add(wall)
 }
 return g
}

async function loadModel(base,file){const asset=await gltf.loadAsync(`${base}/${file}`);return prep(asset.scene)}
async function loadCharacter(){const asset=await gltf.loadAsync(CHARACTER);prep(asset.scene);return asset}
async function loadAnimations(){return gltf.loadAsync(ANIMATIONS)}

export class AssetBank{
 constructor(){this.models={};this.character=null;this.characterAnimations=[];this.ready=false}
 async load(){
  const entries=Object.entries(files)
  const [modelsResult,characterResult,animationResult]=await Promise.all([
   Promise.allSettled(entries.map(([,src])=>loadModel(src[0],src[1]))),
   Promise.allSettled([loadCharacter()]),
   Promise.allSettled([loadAnimations()])
  ])
  modelsResult.forEach((result,i)=>{
   const [key,src]=entries[i]
   if(result.status==='fulfilled')this.models[key]=result.value
   else console.warn(`3D asset failed: ${src[1]}`,result.reason)
  })
  if(characterResult[0]?.status==='fulfilled'){
   this.character=characterResult[0].value.scene
   this.characterAnimations=characterResult[0].value.animations??[]
  }else console.warn('Clothed crew asset failed; using fallback crew',characterResult[0]?.reason)
  if(!this.characterAnimations.length&&animationResult[0]?.status==='fulfilled')this.characterAnimations=animationResult[0].value.animations??[]
  else if(!this.characterAnimations.length)console.warn('Humanoid animation library failed',animationResult[0]?.reason)
  this.ready=true;return this
 }
 clone(name){const src=this.models[name];return src?prep(src.clone(true)):placeholder(name)}
 cloneCharacter(){
  if(!this.character)return null
  const root=prep(cloneSkeleton(this.character));root.updateMatrixWorld(true)
  const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),height=Math.max(.01,size.y)
  root.scale.setScalar(1.48/height);root.updateMatrixWorld(true)
  const fitted=new THREE.Box3().setFromObject(root);root.position.y-=fitted.min.y
  root.userData.realCrew=true
  root.userData.clothedWorker=true
  return root
 }
 characterClip(preferred='walk'){
  const clips=this.characterAnimations??[]
  return clips.find(c=>c.name.toLowerCase().includes(preferred))||clips.find(c=>c.name.toLowerCase().includes('idle'))||clips[0]||null
 }
}
