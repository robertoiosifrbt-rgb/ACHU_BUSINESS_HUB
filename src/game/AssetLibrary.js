import { Assets,Rectangle,Texture } from 'pixi.js'

const SNOW_ATLAS='https://raw.githubusercontent.com/igorko/flare-mod-noname/master/new_game_mod/images/tilesets/tileset_snowplains.png'

const visualAssets={
 snow:[],paths:[],water:[],bridges:[],trees:[],props:[],tents:[],caves:[],
 buildings:{},furnaceLevels:[],foundation:null
}
let loaded=false

function frame(base,x,y,w,h){return new Texture({source:base.source,frame:new Rectangle(x,y,w,h)})}
const row=(base,start,count,y,w=64,h=32)=>Array.from({length:count},(_,i)=>frame(base,(start+i)*w,y,w,h))

export {visualAssets}

export async function loadVisualAssets(){
 if(loaded)return visualAssets
 const atlas=await Assets.load(SNOW_ATLAS)

 visualAssets.snow=row(atlas,0,16,0,64,32)
 visualAssets.paths=row(atlas,0,16,32,64,32)
 visualAssets.water=row(atlas,0,16,608,64,32)
 visualAssets.bridges=row(atlas,0,16,640,64,64)
 visualAssets.props=row(atlas,0,16,256,64,64)
 visualAssets.tents=[0,1,2,3].map(i=>frame(atlas,512+i*64,160,64,96))
 visualAssets.caves=[
  frame(atlas,0,864,64,128),
  frame(atlas,128,864,64,128),
  frame(atlas,192,864,64,128),
  frame(atlas,320,864,64,128),
 ]
 visualAssets.trees=[
  ...Array.from({length:4},(_,i)=>frame(atlas,i*128,992,128,128)),
  ...Array.from({length:4},(_,i)=>frame(atlas,i*128,1120,128,224)),
  ...Array.from({length:4},(_,i)=>frame(atlas,512+i*128,1184,128,160)),
 ]
 visualAssets.foundation=frame(atlas,768,160,64,64)

 const houses=Array.from({length:8},(_,i)=>frame(atlas,i*64,704,64,160))
 visualAssets.buildings={
  furnace:houses[0],
  shelter:houses[0],
  sawmill:houses[1],
  huntersHut:houses[2],
  coalMine:visualAssets.caves[0],
  ironMine:visualAssets.caves[1],
  storehouse:houses[3],
  infirmary:houses[4],
  embassy:houses[5],
  infantryCamp:visualAssets.tents[0],
  lancerCamp:visualAssets.tents[1],
  marksmanCamp:visualAssets.tents[2],
  researchCenter:houses[6],
 }

 const furnaceFrames=[0,0,1,1,2,2,3,4,5,6,7,7]
 visualAssets.furnaceLevels=furnaceFrames.map(i=>houses[i])
 loaded=true
 return visualAssets
}
