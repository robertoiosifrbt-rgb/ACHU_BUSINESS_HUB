import { Assets } from 'pixi.js'

const ROOT='https://cdn.jsdelivr.net/gh/Tiddybub/2d-assets@main/fantasy/medieval-rts/PNG/Default%20size'
const structure=n=>`${ROOT}/Structure/medievalStructure_${String(n).padStart(2,'0')}.png`
const environment=n=>`${ROOT}/Environment/medievalEnvironment_${String(n).padStart(2,'0')}.png`
const tile=n=>`${ROOT}/Tile/medievalTile_${String(n).padStart(2,'0')}.png`
const unit=n=>`${ROOT}/Unit/medievalUnit_${String(n).padStart(2,'0')}.png`

const BUILDING_FILES={
 furnace:12,
 shelter:2,
 sawmill:5,
 huntersHut:4,
 coalMine:9,
 ironMine:10,
 storehouse:7,
 infirmary:3,
 embassy:11,
 infantryCamp:6,
 lancerCamp:8,
 marksmanCamp:13,
 researchCenter:1,
}

export const visualAssets={buildings:{},environment:[],tiles:[],units:[]}
let loaded=false

export async function loadVisualAssets(){
 if(loaded)return visualAssets
 const buildingEntries=Object.entries(BUILDING_FILES)
 const buildingTextures=await Promise.all(buildingEntries.map(([,n])=>Assets.load(structure(n))))
 buildingEntries.forEach(([id],i)=>{visualAssets.buildings[id]=buildingTextures[i]})
 visualAssets.environment=await Promise.all([1,2,3,4,5,6,7,8].map(n=>Assets.load(environment(n))))
 visualAssets.tiles=await Promise.all([1,2,3,4,5,6].map(n=>Assets.load(tile(n))))
 visualAssets.units=await Promise.all([1,2,3,4,5,6].map(n=>Assets.load(unit(n))))
 loaded=true
 return visualAssets
}
