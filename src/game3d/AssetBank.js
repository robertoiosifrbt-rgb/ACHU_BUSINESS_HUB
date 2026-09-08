import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const gltf=new GLTFLoader()
const RAW='https://raw.githubusercontent.com/ronmurphy/CityBuilder/37244cfa7e40f99cdde4690c13b63d0c98c89dfc/models/IGNORED/Retro%20Urban%20Kit/Models/GLB%20format'

const files={
 wallADoor:'wall-a-door.glb',
 wallAWindow:'wall-a-window.glb',
 wallA:'wall-a.glb',
 wallARoof:'wall-a-roof.glb',
 wallBDoor:'wall-b-door.glb',
 wallBWindow:'wall-b-window.glb',
 wallB:'wall-b.glb',
 wallBRoof:'wall-b-roof.glb',
 garage:'wall-a-garage.glb',
 metalRoof:'roof-metal-type-a.glb',
 scaffold:'scaffolding-structure.glb',
 barrier:'detail-barrier-strong-type-a.glb',
 dumpster:'detail-dumpster-closed.glb',
 pineLarge:'tree-pine-large.glb',
 pineSmall:'tree-pine-small.glb',
 truckGreen:'truck-green.glb',
 truckGrey:'truck-grey.glb'
}

function prep(root){
 root.traverse(o=>{
  if(!o.isMesh)return
  o.castShadow=true
  o.receiveShadow=true
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
 if(n.includes('pine')){
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,.7,6),new THREE.MeshStandardMaterial({color:0x5a4030,roughness:1}));trunk.position.y=.35;g.add(trunk)
  const crown=new THREE.Mesh(new THREE.ConeGeometry(.55,1.5,8),new THREE.MeshStandardMaterial({color:0x345c46,roughness:1}));crown.position.y=1.2;g.add(crown)
 }else if(n.includes('truck')){
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.25,.45,.62),new THREE.MeshStandardMaterial({color:n.includes('green')?0x55765d:0x686e73,roughness:.9}));body.position.y=.35;g.add(body)
 }else if(n.includes('roof')){
  const roof=new THREE.Mesh(new THREE.BoxGeometry(1.05,.12,1.05),new THREE.MeshStandardMaterial({color:0x59636a,roughness:1}));roof.position.y=.08;g.add(roof)
 }else{
  const wall=new THREE.Mesh(new THREE.BoxGeometry(1,.95,.16),new THREE.MeshStandardMaterial({color:n.includes('b')?0x68767b:0x7b6b63,roughness:1}));wall.position.y=.48;g.add(wall)
 }
 return g
}

async function loadModel(file){
 const asset=await gltf.loadAsync(`${RAW}/${file}`)
 return prep(asset.scene)
}

export class AssetBank{
 constructor(){this.models={};this.character=null;this.ready=false}
 async load(){
  const entries=Object.entries(files)
  const results=await Promise.allSettled(entries.map(([,file])=>loadModel(file)))
  results.forEach((result,i)=>{
   const [key,file]=entries[i]
   if(result.status==='fulfilled')this.models[key]=result.value
   else console.warn(`Urban asset failed: ${file}`,result.reason)
  })
  this.ready=true
  return this
 }
 clone(name){const src=this.models[name];return src?prep(src.clone(true)):placeholder(name)}
 cloneCharacter(){return null}
}
