import { Container } from 'pixi.js'
import { RESEARCH } from '../../data/research.js'
import { panel,text,button } from './primitives.js'
export class ResearchSheet extends Container{
 constructor(game){super();this.game=game;this.visible=false}
 open(){this.removeChildren();this.visible=true;const w=Math.min(420,window.innerWidth-20),h=Math.min(620,window.innerHeight-90);this.sheetW=w;this.sheetH=h;const p=panel(w,h,.99,0x0f2935,22);this.addChild(p);const title=text('RESEARCH CENTER',19,0xffffff,'900');title.position.set(18,14);const rc=this.game.state.buildings.researchCenter??0,status=text(rc?`Center Lv. ${rc}`:'Locked · Furnace 9 required',10,rc?0xa8e7b8:0xffae9f,'800');status.position.set(18,42);p.addChild(title,status);let y=70;const rowW=w-36
  outer:for(const [,branch] of Object.entries(RESEARCH)){const head=text(branch.label.toUpperCase(),11,0xffd777,'900');head.position.set(18,y);p.addChild(head);y+=22;for(const [id,d] of Object.entries(branch.items)){if(y>h-76)break outer;const lvl=this.game.state.research[id]??0,row=button(`${d.name}   ${lvl}/${d.max}`,rowW,34,0x315668);row.position.set(18,y);row.on('pointertap',()=>this.game.research(id));p.addChild(row);y+=38}y+=6}const close=button('CLOSE',86,36,0x526b76);close.position.set(w-104,14);close.on('pointertap',()=>this.visible=false);p.addChild(close)}
}
