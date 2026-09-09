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
 '4,4':{name:'Brickline Services',tag:'BRK',client:'Westgate Retail Park',tier:4},
 '10,2':{name:'NovaWorks',tag:'NVA',client:'Northpoint Offices',tier:5},
 '16,4':{name:'PrimeServe',tag:'PRM',client:'Eastfield Academy Trust',tier:3},
 '18,10':{name:'BluePeak Commercial',tag:'BLU',client:'Riverside Health Centre',tier:5},
 '16,16':{name:'Horizon Group',tag:'HZN',client:'Southgate Apartments',tier:4},
 '10,18':{name:'Vertex Facilities',tag:'VTX',client:'Central Logistics Campus',tier:5},
 '4,16':{name:'NovaWorks',tag:'NVA',client:'South West Business Park',tier:4},
 '2,10':{name:'Brickline Services',tag:'BRK',client:'West Borough Council',tier:3},
 '14,9':{name:'PrimeServe',tag:'PRM',client:'Prime Business Park',tier:3},
 '7,13':{name:'Vertex Facilities',tag:'VTX',client:'Cedar Court Offices',tier:3},
}

const SERVICES=['Regular domestic clean','Deep clean','End of tenancy','Office clean','Carpet clean','After-builders clean']
const PROPERTIES=['2-bedroom flat','3-bedroom house','4-bedroom house','small office','retail unit','shared accommodation']
const FREQUENCIES=['One-off','Weekly','Fortnightly','Monthly']
const COMPETITION=['LOW','MEDIUM','HIGH']
const DEMAND=['STEADY','GOOD','STRONG','VERY STRONG']
const CLIENTS=['Sarah M.','Oak & Co.','Greenview Lettings','Marlow Dental','The Corner Shop','Riverside Homes','Blue Door Property','Harbour Offices']

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
 return bestD<=2?{tag:best.tag,name:best.name,distance:bestD}:null
}

function marketProfile(x,y,h){
 const d=dist(x,y),level=clamp(1+Math.floor(d/4)+(h%2),1,6)
 return{
  level,
  demand:DEMAND[(h+d)%DEMAND.length],
  competition:COMPETITION[(Math.floor(h/7)+d)%COMPETITION.length],
  averageJobValue:65+level*18+(h%35),
  travelMins:8+d*2+(h%7),
  propertyMix:['Mostly residential','Flats and shared homes','Mixed residential and retail','Office-heavy','Industrial and commercial'][h%5],
 }
}

export function worldTile(x,y){
 const id=tileId(x,y),h=hash(x,y),region=regionFor(x,y,WORLD_CENTER),influence=influenceAt(x,y),market=marketProfile(x,y,h)
 if(id===BASE_TILE)return{id,x,y,kind:'base',businessType:'base',name:'ACHU Headquarters',region,level:1,...market}

 const rival=RIVALS[id]
 if(rival){
  const required=1150+rival.tier*470+dist(x,y)*90+(h%260),monthlyValue=1450+rival.tier*520+(h%650)
  return{id,x,y,kind:'settlement',businessType:'framework',name:`${rival.client} framework`,client:rival.client,incumbent:rival.name,tag:rival.tag,faction:rival.tag,tier:rival.tier,region,level:rival.tier,strength:required,requiredCapability:required,service:SERVICES[(h+rival.tier)%SERVICES.length],frequency:'5 days per week',term:'12 months',monthlyValue,annualValue:monthlyValue*12,requirements:['Documented quality checks','Reliable cover for absence','Named contract supervisor'],reward:{meat:monthlyValue,wood:420+rival.tier*150,coal:240+rival.tier*85,iron:80+rival.tier*35},...market}
 }

 if((h%19===0&&dist(x,y)>2)||(h%31===0&&dist(x,y)>5)){
  const required=420+market.level*390+dist(x,y)*45+(h%210),monthlyValue=520+market.level*260+(h%310)
  return{id,x,y,kind:'camp',businessType:'tender',name:market.level>=5?'Major commercial cleaning tender':'Local commercial tender',client:CLIENTS[(h+market.level)%CLIENTS.length],region,level:market.level,strength:required,requiredCapability:required,service:SERVICES[(h+2)%SERVICES.length],frequency:market.level>=4?'5 days per week':'3 days per week',term:market.level>=4?'12 months':'6 months',monthlyValue,annualValue:monthlyValue*12,requirements:['Enough trained cleaners','Supplies and equipment ready','Quality process in place'],reward:{meat:monthlyValue,wood:190+market.level*120,coal:90+market.level*60,iron:30+market.level*24},...market}
 }

 if(h%5!==0){
  const service=SERVICES[h%SERVICES.length],property=PROPERTIES[Math.floor(h/5)%PROPERTIES.length],frequency=FREQUENCIES[Math.floor(h/11)%FREQUENCIES.length]
  const crewHours=clamp(2+(h%5),2,6),quote=Math.round((45+market.level*16+crewHours*18+(h%25))/5)*5
  return{id,x,y,kind:'resource',businessType:'lead',resource:'meat',name:`${service} enquiry`,client:CLIENTS[(h+x+y)%CLIENTS.length],service,property,frequency,region,level:market.level,yield:quote,quote,crewHours,reviewReward:2+market.level,margin:clamp(28+(h%34),28,61),faction:influence?.tag??null,competitor:influence?.name??null,...market}
 }

 const terrain=['Residential catchment','Town-centre flats','Retail cluster','Office district','Industrial estate'][h%5]
 return{id,x,y,kind:'wild',businessType:'market',name:terrain,terrain,region,level:market.level,faction:influence?.tag??null,competitor:influence?.name??null,...market}
}

export function allWorldTiles(){const out=[];for(let y=0;y<WORLD_SIZE;y++)for(let x=0;x<WORLD_SIZE;x++)out.push(worldTile(x,y));return out}
export const adjacentTo=(id,list)=>neighbors(id).some(n=>list.includes(n))
export const rivalSettlements=()=>Object.keys(RIVALS)
