export const WORLD_SIZE=11
export const WORLD_CENTER=5
export const BASE_TILE=`${WORLD_CENTER},${WORLD_CENTER}`

export const tileId=(x,y)=>`${x},${y}`
export const parseTile=id=>id.split(',').map(Number)
export const inWorld=(x,y)=>x>=0&&y>=0&&x<WORLD_SIZE&&y<WORLD_SIZE
export const neighbors=id=>{const [x,y]=parseTile(id);return[[x+1,y],[x-1,y],[x,y+1],[x,y-1]].filter(([a,b])=>inWorld(a,b)).map(([a,b])=>tileId(a,b))}

function hash(x,y){let n=(x+11)*92821+(y+7)*68917;n=(n^(n>>>13))*1274126177;return Math.abs(n^(n>>>16))}

export function worldTile(x,y){
 const id=tileId(x,y)
 if(id===BASE_TILE)return{id,x,y,kind:'base',name:'Home Settlement'}
 const h=hash(x,y)
 const dist=Math.abs(x-WORLD_CENTER)+Math.abs(y-WORLD_CENTER)
 if((h%17===0&&dist>2)||(h%29===0&&dist>4))return{id,x,y,kind:'camp',name:dist>5?'Raider Stronghold':'Raider Camp',strength:450+dist*260+(h%420),reward:{meat:220+dist*80,wood:180+dist*75,coal:70+dist*35,iron:20+dist*16}}
 const resources=['meat','wood','coal','iron']
 if(h%4!==0){const resource=resources[h%resources.length];return{id,x,y,kind:'resource',resource,name:`${resource[0].toUpperCase()+resource.slice(1)} field`,yield:220+dist*70+(h%160)}}
 return{id,x,y,kind:'wild',name:['Frozen Plain','Pine Ridge','Ice Valley','Snow Pass'][h%4]}
}

export function allWorldTiles(){const out=[];for(let y=0;y<WORLD_SIZE;y++)for(let x=0;x<WORLD_SIZE;x++)out.push(worldTile(x,y));return out}
export const adjacentTo=(id,list)=>neighbors(id).some(n=>list.includes(n))
