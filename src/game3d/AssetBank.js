import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const gltf=new GLTFLoader()
const RAW='https://raw.githubusercontent.com/KoshkiKode/cordite/46edc7df41a3b658d7e2d1b7332b7da803c5e7d6/assets/models/kenney-urban'
const files={
 wallADoor:'wall-a-door.glb',wallAWindow:'wall-a-window.glb',wallA:'wall-a.glb',wallARoof:'wall-a-roof.glb',
 wallBDoor:'wall-b-door.glb',wallBWindow:'wall-b-window.glb',wallB:'wall-b.glb',wallBRoof:'wall-b-roof.glb',garage:'wall-a-garage.glb',metalRoof:'roof-metal-type-a.glb',
 scaffold:'scaffolding-structure.glb',barrier:'detail-barrier-strong-type-a.glb',dumpster:'detail-dumpster-closed.glb',pineLarge:'tree-pine-large.glb',pineSmall:'tree-pine-small.glb',truckGreen:'truck-green.glb',truckGrey:'truck-grey.glb'
}
function prep(root){root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(!o.material||!o.material.map)o.material=new THREE.MeshStandardMaterial({color:0x8b7355,roughness:0.8,metalness:0.1})}});return root}
async function loadModel(file){const asset=await gltf.loadAsync(`${RAW}/${file}`);return prep(asset.scene)}

export class AssetBank{
 constructor(){this.models={};this.character=null}
 async load(){
  const entries=Object.entries(files)
  const results=await Promise.allSettled(entries.map(([,file])=>loadModel(file)))
  results.forEach((result,i)=>{const [key]=entries[i];if(result.status==='fulfilled')this.models[key]=result.value;else console.warn(`Kenney asset failed: ${entries[i][1]}`,result.reason)})
  return this
 }
 clone(name){const src=this.models[name];return src?prep(src.clone(true)):new THREE.Group()}
 cloneCharacter(){return null}
}
