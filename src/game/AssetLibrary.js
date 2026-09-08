import { Assets,Rectangle,Texture } from 'pixi.js'

const SNOW_ATLAS='https://raw.githubusercontent.com/igorko/flare-mod-noname/master/new_game_mod/images/tilesets/tileset_snowplains.png'
const BUILDING_ATLAS=`${import.meta.env.BASE_URL}assets/winter-city-atlas.svg`
const IDS=['furnace','shelter','sawmill','huntersHut','coalMine','ironMine','storehouse','infirmary','embassy','infantryCamp','lancerCamp','marksmanCamp','researchCenter']

const visualAssets={snow:[],paths:[],water:[],bridges:[],trees:[],props:[],buildings:{},foundation:null}
let loaded=false

function frame(base,x,y,w,h){return new Texture({source:base.source,frame:new Rectangle(x,y,w,h)})}
const row=(base,start,count,y,w=64,h=32)=>Array.from({length:count},(_,i)=>frame(base,(start+i)*w,y,w,h))

export {visualAssets}

export async function loadVisualAssets(){
 if(loaded)return visualAssets
 const [atlas,city]=await Promise.all([Assets.load(SNOW_ATLAS),Assets.load(BUILDING_ATLAS)])
 visualAssets.snow=row(atlas,0,16,0,64,32)
 visualAssets.paths=row(atlas,0,16,32,64,32)
 visualAssets.water=row(atlas,0,16,608,64,32)
 visualAssets.bridges=row(atlas,0,16,640,64,64)
 visualAssets.props=row(atlas,0,16,256,64,64)
 visualAssets.trees=[
  ...Array.from({length:4},(_,i)=>frame(atlas,i*128,992,128,128)),
  ...Array.from({length:4},(_,i)=>frame(atlas,i*128,1120,128,224)),
  ...Array.from({length:4},(_,i)=>frame(atlas,512+i*128,1184,128,160)),
 ]
 visualAssets.foundation=frame(atlas,768,160,64,64)
 IDS.forEach((id,i)=>{visualAssets.buildings[id]=frame(city,i*220,0,220,220)})
 loaded=true
 return visualAssets
}
