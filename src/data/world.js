import {regionFor} from './regions.js'

export const WORLD_SIZE=21
export const WORLD_CENTER=10
export const BASE_TILE=`${WORLD_CENTER},${WORLD_CENTER}`

export const FACTIONS={
 BRK:{name:'Brickline Services',color:0xe46f61},
 NVA:{name:'NovaWorks',color:0x6d8df0},
 PRM:{name:'PrimeServe',color:0xe0a24e},
 HZN:{name:'Horizon Group',color:0x9b7ae6},
 BLU:{name:'BluePeak',color:0x4aa7a5},
 VTX:{name:'Vertex Facilities',color:0x8d97a3},
}

const RIVALS={
 '4,4':{name:'Brickline West',tag:'BRK',tier:4},
 '10,2':{name:'Nova North',tag:'NVA',tier:5},
 '16,4':{name:'Prime East',tag:'PRM',tier:3},
 '18,10':{name:'BluePeak Commercial',tag:'BLU',tier:5},
 '16,16':{name:'Horizon South',tag:'HZN',tier:4},
 '10,18':{name:'Vertex Premium',tag:'VTX',tier:5},
 '4,16':{name:'Nova South West',tag:'NVA',tier:4},
 '2,10':{name:'Brickline Regional',tag:'BRK',tier:3},
 '14,9':{name:'Prime Business Park',tag:'PRM',tier:3},
 '7,13':{name:'Vertex Commercial',tag:'VTX',tier:3},
}

export const tileId=(x,y)=>`${x},${y}`
export const parseTile=id=>id.split(',').map(Number)
export const inWorld=(x,y)=>x>=0&&y>=0&&x<WORLD_SIZE&&y<WORLD_SIZE
export const neighbors=id=>{const [x,y]=parseTile(id);return[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a,b])=>inWorld(a,b)).map(([a,b])=>tileId(a,b))}

function hash(x,y){let n=(x+31)*92821+(y+17)*68917;n=(n^(n>>>13))*1274126177;return Math.abs(n^(n>>>16))}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n))
const dist=(x,y)=>Math.abs(x-WORLD_CENTER)+Math.abs(y-WORLD_CENTER)

function influenceAt(x,y){
 let best=null,bestD=99
 for(const [id,r] of Object.entries(RIVALS)){const [rx,ry]=parseTile(id),d=Math.abs(x-rx)+Math.abs(y-ry);if(d<bestD){bestD=d;best=r}}
 return bestD<=2?{tag:best.tag,distance:bestD}:null
}

const opportunityName={meat:'Revenue Opportunity',wood:'Supply Contract',coal:'Brand Opportunity',iron:'Talent Pool'}

export function worldTile(x,y){
 const id=tileId(x,y),d=dist(x,y),h=hash(x,y),region=regionFor(x,y,WORLD_CENTER),influence=influenceAt(x,y)
 if(id===BASE_TILE)return{id,x,y,kind:'base',name:'ACHU Headquarters',region,level:1}
 const rival=RIVALS[id]
 if(rival){const strength=1250+rival.tier*520+d*115+(h%360);return{id,x,y,kind:'settlement',name:rival.name,tag:rival.tag,faction:rival.tag,tier:rival.tier,region,level:rival.tier,strength,reward:{meat:520+rival.tier*180,wood:480+rival.tier*170,coal:160+rival.tier*70,iron:55+rival.tier*32}}}
 const level=clamp(1+Math.floor(d/4)+(h%2),1,6)
 if((h%19===0&&d>2)||(h%31===0&&d>5)){const strength=380+level*430+d*55+(h%260);return{id,x,y,kind:'camp',name:level>=5?'Major Commercial Contract':'Local Contract Lead',region,level,strength,reward:{meat:180+level*140,wood:160+level*125,coal:55+level*55,iron:18+level*24}}}
 const resources=['meat','wood','coal','iron']
 if(h%5!==0){const resource=resources[h%resources.length],yieldAmount=180+level*145+(h%120);return{id,x,y,kind:'resource',resource,name:opportunityName[resource],region,level,yield:yieldAmount,faction:influence?.tag??null}}
 const terrain=['Retail Cluster','Office District','Residential Catchment','Industrial Estate','Mixed-use Zone'][h%5]
 return{id,x,y,kind:'wild',name:terrain,terrain,region,level,faction:influence?.tag??null}
}

export function allWorldTiles(){const out=[];for(let y=0;y<WORLD_SIZE;y++)for(let x=0;x<WORLD_SIZE;x++)out.push(worldTile(x,y));return out}
export const adjacentTo=(id,list)=>neighbors(id).some(n=>list.includes(n))
export const rivalSettlements=()=>Object.keys(RIVALS)
