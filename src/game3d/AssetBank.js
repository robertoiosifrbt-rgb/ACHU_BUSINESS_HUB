import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

const gltf=new GLTFLoader()
const URBAN='https://raw.githubusercontent.com/ronmurphy/CityBuilder/37244cfa7e40f99cdde4690c13b63d0c98c89dfc/models/IGNORED/Retro%20Urban%20Kit/Models/GLB%20format'
const DOWNTOWN='https://raw.githubusercontent.com/anshaneja5/skyline-run/main/public/assets/models'
const CHARACTER='https://raw.githubusercontent.com/Seyamalam/blood-league-kickoff/main/public/assets/vendor/quaternius/night-striker.glb'

const files={
 wallADoor:[URBAN,'wall-a-door.glb'],wallAWindow:[URBAN,'wall-a-window.glb'],wallA:[URBAN,'wall-a.glb'],wallARoof:[URBAN,'wall-a-roof.glb'],
 wallBDoor:[URBAN,'wall-b-door.glb'],wallBWindow:[URBAN,'wall-b-window.glb'],wallB:[URBAN,'wall-b.glb'],wallBRoof:[URBAN,'wall-b-roof.glb'],
 garage:[URBAN,'wall-a-garage.glb'],metalRoof:[URBAN,'roof-metal-type-a.glb'],scaffold:[URBAN,'scaffolding-structure.glb'],
 barrier:[URBAN,'detail-barrier-strong-type-a.glb'],dumpster:[URBAN,'detail-dumpster-closed.glb'],pineLarge:[URBAN,'tree-pine-large.glb'],pineSmall:[URBAN,'tree-pine-small.glb'],
 truckGreen:[URBAN,'truck-green.glb'],truckGrey:[URBAN,'truck-grey.glb'],
 downtownSmall:[DOWNTOWN,'b_small.glb'],downtownMedium:[DOWNTOWN,'b_medium.glb'],downtownLarge:[DOWNTOWN,'b_large.glb'],
 downtownTreeA:[DOWNTOWN,'tree1.glb'],downtownTreeB:[DOWNTOWN,'tree2.glb'],downtownTreeC:[DOWNTOWN,'tree3.glb'],downtownBush:[DOWNTOWN,'bush.glb'],downtownAC:[DOWNTOWN,'prop_ac.glb']
}

function prep(root){
 root.traverse(o=>{
  if(!o.isMesh)return
  o.castShadow=true;o.receiveShadow=true
  const mats=Array.isArray(o.material)?o.material:[o.material]
  for(const m of mats){if(m?.map)m.map.colorSpace=THREE.SRGBColorSpace;if(m){m.side=THREE.DoubleSide;m.needsUpdate=true}}
 })
 return root
}

function placeholder(name){
 const g=new THREE.Group(),n=name.toLowerCase()
 if(n.includes('tree')||n.includes('pine')){
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,.7,6),new THREE.MeshStandardMaterial({color:0x6a4936,roughness:1}));trunk.position.y=.35;g.add(trunk)
  const crown=new THREE.Mesh(new THREE.ConeGeometry(.62,1.65,8),new THREE.MeshStandardMaterial({color:0x4f7d5d,roughness:1}));crown.position.y=1.25;g.add(crown)
 }else if(n.includes('truck')){
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.25,.45,.62),new THREE.MeshStandardMaterial({color:n.includes('green')?0x55765d:0x686e73,roughness:.9}));body.position.y=.35;g.add(body)
 }else if(n.includes('downtown')){
  const h=n.includes('large')?4.8:n.includes('medium')?3.6:2.5,b=new THREE.Mesh(new THREE.BoxGeometry(2.4,h,2.2),new THREE.MeshStandardMaterial({color:0xd6c7b4,roughness:.86}));b.position.y=h/2;g.add(b)
 }else if(n.includes('roof')){
  const roof=new THREE.Mesh(new THREE.BoxGeometry(1.05,.12,1.05),new THREE.MeshStandardMaterial({color:0x59636a,roughness:1}));roof.position.y=.08;g.add(roof)
 }else{
  const wall=new THREE.Mesh(new THREE.BoxGeometry(1,.95,.16),new THREE.MeshStandardMaterial({color:n.includes('b')?0x68767b:0x7b6b63,roughness:1}));wall.position.y=.48;g.add(wall)
 }
 return g
}

async function loadModel(base,file){const asset=await gltf.loadAsync(`${base}/${file}`);return prep(asset.scene)}
async function loadCharacter(){const asset=await gltf.loadAsync(CHARACTER);return prep(asset.scene)}

export class AssetBank{
 constructor(){this.models={};this.character=null;this.ready=false}
 async load(){
  const entries=Object.entries(files)
  const [modelsResult,characterResult]=await Promise.all([
   Promise.allSettled(entries.map(([,src])=>loadModel(src[0],src[1]))),
   Promise.allSettled([loadCharacter()])
  ])
  modelsResult.forEach((result,i)=>{const [key,src]=entries[i];if(result.status==='fulfilled')this.models[key]=result.value;else console.warn(`3D asset failed: ${src[1]}`,result.reason)})
  if(characterResult[0]?.status==='fulfilled')this.character=characterResult[0].value
  else console.warn('Humanoid crew asset failed; using fallback crew',characterResult[0]?.reason)
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
  return root
 }
}
