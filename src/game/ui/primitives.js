import { Container,Graphics,Text } from 'pixi.js'
export const text=(s,size=15,color=0xffffff,weight='700')=>new Text({text:s,style:{fontFamily:'Arial',fontSize:size,fill:color,fontWeight:weight}})
export const panel=(w,h,a=.90,color=0x102b38,r=18)=>new Graphics().roundRect(0,0,w,h,r).fill({color,alpha:a}).stroke({color:0xffffff,alpha:.20,width:1})
export function button(label,w=120,h=42,color=0x2f86c9){const c=new Container();const g=new Graphics().roundRect(0,0,w,h,13).fill({color,alpha:.96}).stroke({color:0xffffff,alpha:.36,width:2});const t=text(label,12);t.anchor.set(.5);t.position.set(w/2,h/2);c.addChild(g,t);c.eventMode='static';c.cursor='pointer';return c}
export const fmt=n=>Math.floor(n).toLocaleString()
export const fmtTime=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return s<60?`${s}s`:`${Math.floor(s/60)}m ${s%60}s`}
