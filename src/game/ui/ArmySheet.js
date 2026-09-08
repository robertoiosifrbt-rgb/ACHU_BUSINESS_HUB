import {Container} from 'pixi.js'
import {panel,text,button,fmt,fmtTime} from './primitives.js'
import {HEROES,FORMATIONS,heroXpToNext} from '../../data/heroes.js'

const TROOPS={
 infantry:{label:'Infantry',camp:'infantryCamp'},
 lancer:{label:'Lancer',camp:'lancerCamp'},
 marksman:{label:'Marksman',camp:'marksmanCamp'},
}

export class ArmySheet extends Container{
 constructor(game){super();this.game=game;this.visible=false;this.sheetW=390;this.sheetH=450;this.lastKey=''}
 open(){this.visible=true;this.render()}
 key(){const w=this.game.state.world,j=w.trainingJob,r=w.rally,last=w.battleReports?.[0];return`${w.troops.infantry}|${w.troops.lancer}|${w.troops.marksman}|${j?.type??''}|${j?.finishAt??''}|${w.marches.length}|${w.selectedHero}|${w.formation}|${w.heroes?.[w.selectedHero]?.level}|${w.heroes?.[w.selectedHero]?.xp}|${r?.target??''}|${r?.launchAt??''}|${last?.at??''}`}
 render(){this.removeChildren();const width=Math.min(390,window.innerWidth-20),h=450,w=this.game.state.world,heroId=this.game.selectedHeroId(),hero=HEROES[heroId],heroState=w.heroes?.[heroId]??{level:1,xp:0};this.sheetW=width;this.sheetH=h;const p=panel(width,h,.98,0x0c2732,22);this.addChild(p);const title=text('ARMY COMMAND',20,0xffffff,'900');title.position.set(18,16);p.addChild(title);const power=text(`Power ${fmt(this.game.armyPower())} · Free ${fmt(this.game.freeArmyPower())}`,10,0xffdc86,'900');power.position.set(18,46);p.addChild(power);const marches=text(`March slots ${w.marches.length}/${this.game.marchCapacity()}`,10,0x9fd8ea,'800');marches.position.set(18,66);p.addChild(marches)
  const heroText=text(`${hero.name} · Lv.${heroState.level} · ${hero.role}`,11,0xffffff,'900');heroText.position.set(18,94);p.addChild(heroText);const heroXp=text(`Commander power ${fmt(this.game.commanderPower())} · XP ${fmt(heroState.xp)}/${fmt(heroXpToNext(heroState.level))}`,9,0xaed8e7,'800');heroXp.position.set(18,116);p.addChild(heroXp);const next=button('NEXT COMMANDER',142,34,0x4e7191);next.position.set(width-160,88);next.on('pointertap',()=>this.game.cycleHero());p.addChild(next)
  const formation=text(`Formation: ${FORMATIONS[w.formation]?.name??'Balanced'}`,10,0xffd899,'900');formation.position.set(18,145);p.addChild(formation);const form=button('CHANGE FORMATION',142,34,0x6b6650);form.position.set(width-160,137);form.on('pointertap',()=>this.game.cycleFormation());p.addChild(form)
  let y=184;for(const [type,d] of Object.entries(TROOPS)){const free=this.game.freeTroops()[type]??0,count=text(`${d.label}  ${fmt(w.troops[type]??0)} · free ${fmt(free)}`,11,0xffffff,'900');count.position.set(18,y+10);p.addChild(count);const b=button('TRAIN',92,34,0x3d7898);b.position.set(width-110,y);b.on('pointertap',()=>this.game.trainTroops(type));p.addChild(b);y+=48}
  const j=w.trainingJob;if(j){const left=Math.max(0,j.finishAt-Date.now()),t=text(`Training ${j.amount} ${TROOPS[j.type].label} · ${fmtTime(left)}`,10,0xa8e7b8,'900');t.position.set(18,330);p.addChild(t)}else{const t=text('Training queue idle',10,0xa8c9d5,'800');t.position.set(18,330);p.addChild(t)}
  if(w.rally){const left=Math.max(0,w.rally.launchAt-Date.now()),t=text(`Rally forming · ${w.rally.participants} armies · ${fmtTime(left)}`,10,0xffd477,'900');t.position.set(18,353);p.addChild(t)}
  const report=w.battleReports?.[0];if(report){const result=report.win?'VICTORY':'DEFEAT',name=report.name??report.target,t=text(`${result} · ${name} · losses ${report.losses}${report.rally?' · RALLY':''}`,9,report.win?0x9ee5b6:0xffa39a,'900');t.position.set(18,376);p.addChild(t)}else{const t=text('No battle reports yet',9,0x91adba,'800');t.position.set(18,376);p.addChild(t)}
  const close=button('CLOSE',110,38,0x526b76);close.position.set(width-128,400);close.on('pointertap',()=>this.visible=false);p.addChild(close);this.lastKey=this.key()}
 refresh(){if(this.visible&&this.key()!==this.lastKey)this.render()}
}
