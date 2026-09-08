import * as THREE from 'three'

// The redesigned game uses procedural Three.js geometry so its visual identity
// is owned by this project and no longer depends on the old remote urban pack.
export class AssetBank{
 constructor(){this.models={};this.character=null}
 async load(){return this}
 clone(){return new THREE.Group()}
 cloneCharacter(){return null}
}
