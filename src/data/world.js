import {regionFor} from './regions.js'

export const WORLD_SIZE=21
export const WORLD_CENTER=10
export const BASE_TILE=`${WORLD_CENTER},${WORLD_CENTER}`

export const FACTIONS={
 WLF:{name:'Frostfang',color:0xb45e5e},
 NTH:{name:'Northwatch',color:0x6e84b6},
 IRN:{name:'Ironvale',color:0x8f775d},
 SNW:{name:'Snowspire',color:0x8e70ad},
 ASH:{name:'Ashen',color:0xb56d47},
 RVN:{name:'Raven',color:0x6a717d},
}

const RIVALS={
 '4,4':{name:'Frostfang Keep',tag:'WLF',tier:4},
 '10,2':{name:'Northwatch',tag:'NTH',tier:5},
 '16,4':{name:'Iceclaw Bastion',tag:'WLF',tier:3},
 '18,10':{name:'Ashen Hold',tag:'ASH',tier:5},
 '16,16':{name:'Snowspire',tag:'SNW',tier:4},
 '10,18':{name:'Ironvale',tag:'IRN',tier:5},
 '4,16':{name:'Raven Camp',tag:'RVN',tier:4},
 '2,10':{name:'Blackpine Fort',tag:'RVN',tier:3},
 '14,9':{name:'Coalwatch',tag:'ASH',tier:3},
 '7,13':{name:'Greyforge',tag:'IRN',tier:3},
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

export function worldTile(x,y){
 const id=tileId(x,y),d=dist(x,y),h=hash(x,y),region=regionFor(x,y,WORLD_CENTER),influence=influenceAt(x,y)
 if(id===BASE_TILE)return{id,x,y,kind:'base',name:'Home Settlement',region,level:1}
 const rival=RIVALS[id]
 if(rival){const strength=1250+rival.tier*520+d*115+(h%360);return{id,x,y,kind:'settlement',name:rival.name,tag:rival.tag,faction:rival.tag,tier:rival.tier,region,level:rival.tier,strength,reward:{meat:520+rival.tier*180,wood:480+rival.tier*170,coal:160+rival.tier*70,iron:55+rival.tier*32}}}
 const level=clamp(1+Math.floor(d/4)+(h%2),1,6)
 if((h%19===0&&d>2)||(h%31===0&&d>5)){const strength=380+level*430+d*55+(h%260);return{id,x,y,kind:'camp',name:level>=5?'Raider Stronghold':'Raider Camp',region,level,strength,reward:{meat:180+level*140,wood:160+level*125,coal:55+level*55,iron:18+level*24}}}
 const resources=['meat','wood','coal','iron']
 if(h%5!==0){const resource=resources[h%resources.length],yieldAmount=180+level*145+(h%120);return{id,x,y,kind:'resource',resource,name:`${resource[0].toUpperCase()+resource.slice(1)} Field`,region,level,yield:yieldAmount,faction:influence?.tag??null}}
 const terrain=['Frozen Plain','Pine Ridge','Ice Valley','Snow Pass','Glacier Shelf'][h%5]
 return{id,x,y,kind:'wild',name:terrain,terrain,region,level,faction:influence?.tag??null}
}

export function allWorldTiles(){const out=[];for(let y=0;y<WORLD_SIZE;y++)for(let x=0;x<WORLD_SIZE;x++)out.push(worldTile(x,y));return out}
export const adjacentTo=(id,list)=>neighbors(id).some(n=>list.includes(n))
export const rivalSettlements=()=>Object.keys(RIVALS)
