import {Container} from 'pixi.js'
import {panel,text,button,fmt,fmtTime} from './primitives.js'

const TROOPS={
 infantry:{label:'Infantry',camp:'infantryCamp'},
 lancer:{label:'Lancer',camp:'lancerCamp'},
 marksman:{label:'Marksman',camp:'marksmanCamp'},
}

export class ArmySheet extends Container{
 constructor(game){super();this.game=game;this.visible=false;this.sheetW=390;this.sheetH=330;this.lastKey=''}
 open(){this.visible=true;this.render()}
 key(){const w=this.game.state.world,j=w.trainingJob;return`${w.troops.infantry}|${w.troops.lancer}|${w.troops.marksman}|${j?.type??''}|${j?.finishAt??''}|${w.marches.length}`}
 render(){this.removeChildren();const width=Math.min(390,window.innerWidth-20),h=330,w=this.game.state.world;this.sheetW=width;this.sheetH=h;const p=panel(width,h,.98,0x0c2732,22);this.addChild(p);const title=text('ARMY',20,0xffffff,'900');title.position.set(18,16);p.addChild(title);const power=text(`Power ${fmt(this.game.armyPower())} · Free ${fmt(this.game.freeArmyPower())}`,10,0xffdc86,'900');power.position.set(18,46);p.addChild(power);const marches=text(`March slots ${w.marches.length}/${this.game.marchCapacity()}`,10,0x9fd8ea,'800');marches.position.set(18,66);p.addChild(marches);let y=96;for(const [type,d] of Object.entries(TROOPS)){const count=text(`${d.label}  ${fmt(w.troops[type]??0)}`,12,0xffffff,'900');count.position.set(18,y+10);p.addChild(count);const b=button(`TRAIN`,100,34,0x3d7898);b.position.set(width-118,y);b.on('pointertap',()=>this.game.trainTroops(type));p.addChild(b);y+=52}const j=w.trainingJob;if(j){const left=Math.max(0,j.finishAt-Date.now()),t=text(`Training ${j.amount} ${TROOPS[j.type].label} · ${fmtTime(left)}`,10,0xa8e7b8,'900');t.position.set(18,254);p.addChild(t)}else{const t=text('Training queue idle',10,0xa8c9d5,'800');t.position.set(18,254);p.addChild(t)}const close=button('CLOSE',110,38,0x526b76);close.position.set(width-128,278);close.on('pointertap',()=>this.visible=false);p.addChild(close);this.lastKey=this.key()}
 refresh(){if(this.visible&&this.key()!==this.lastKey)this.render()}
}
