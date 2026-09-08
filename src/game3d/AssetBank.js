import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

const gltf=new GLTFLoader()
const URBAN='https://raw.githubusercontent.com/ronmurphy/CityBuilder/37244cfa7e40f99cdde4690c13b63d0c98c89dfc/models/IGNORED/Retro%20Urban%20Kit/Models/GLB%20format'
const DOWNTOWN='https://raw.githubusercontent.com/anshaneja5/skyline-run/main/public/assets/models'
const CREW_ROOT='https://raw.githubusercontent.com/lord3nd3r/ffxi-browser/main/public/models/chars'
const CHARACTER_MALE=`${CREW_ROOT}/Male_Peasant.gltf`
const CHARACTER_FEMALE=`${CREW_ROOT}/Female_Peasant.gltf`
const ANIMATIONS='https://raw.githubusercontent.com/Seyamalam/blood-league-kickoff/main/public/assets/vendor/quaternius/universal-animation-library.glb'

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
  const body=new THREE.Mesh(new THREE.BoxGeometry(2.25,.82,1.05),new THREE.MeshStandardMaterial({color:n.includes('green')?0x55765d:0x686e73,roughness:.9}));body.position.y=.65;g.add(body)
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
async function loadCharacter(url){const asset=await gltf.loadAsync(url);return prep(asset.scene)}
async function loadAnimations(){return gltf.loadAsync(ANIMATIONS)}

export class AssetBank{
 constructor(){this.models={};this.characters=[];this.characterAnimations=[];this.ready=false}
 async load(){
  const entries=Object.entries(files)
  const [modelsResult,characterResults,animationResult]=await Promise.all([
   Promise.allSettled(entries.map(([,src])=>loadModel(src[0],src[1]))),
   Promise.allSettled([loadCharacter(CHARACTER_MALE),loadCharacter(CHARACTER_FEMALE)]),
   Promise.allSettled([loadAnimations()])
  ])
  modelsResult.forEach((result,i)=>{const [key,src]=entries[i];if(result.status==='fulfilled')this.models[key]=result.value;else console.warn(`3D asset failed: ${src[1]}`,result.reason)})
  this.characters=characterResults.filter(r=>r.status==='fulfilled').map(r=>r.value)
  if(!this.characters.length)console.warn('Clothed crew assets failed; using fallback crew')
  if(animationResult[0]?.status==='fulfilled')this.characterAnimations=animationResult[0].value.animations??[]
  else console.warn('Humanoid animation library failed',animationResult[0]?.reason)
  this.ready=true;return this
 }
 clone(name){const src=this.models[name];return src?prep(src.clone(true)):placeholder(name)}
 cloneCharacter(index=0){
  const src=this.characters[index%Math.max(1,this.characters.length)]
  if(!src)return null
  const root=prep(cloneSkeleton(src));root.updateMatrixWorld(true)
  const box=new THREE.Box3().setFromObject(root),height=Math.max(.01,box.getSize(new THREE.Vector3()).y)
  root.scale.setScalar(1.62/height);root.updateMatrixWorld(true)
  const fitted=new THREE.Box3().setFromObject(root);root.position.y-=fitted.min.y
  root.userData.realCrew=true
  return root
 }
 characterClip(preferred='walk'){
  const clips=this.characterAnimations??[],needle=preferred.toLowerCase()
  return clips.find(c=>c.name.toLowerCase().includes(needle))||clips.find(c=>c.name.toLowerCase().includes('idle'))||clips[0]||null
 }
}
