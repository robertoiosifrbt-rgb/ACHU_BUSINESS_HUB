import { Container } from 'pixi.js'
import { BUILDINGS } from '../../data/buildings.js'
import { currentChapter,chapterStatus } from '../../data/chapters.js'
import { panel,text } from './primitives.js'
export class QuestHud extends Container{
 constructor(game){super();this.game=game;this.addChild(panel(350,78,.93,0x183a46,16));this.title=text('',11,0xffd777,'900');this.title.position.set(14,10);this.task=text('',13,0xffffff,'800');this.task.position.set(14,31);this.progress=text('',10,0xb9dce8);this.progress.position.set(14,54);this.addChild(this.title,this.task,this.progress);this.eventMode='static';this.cursor='pointer';this.on('pointertap',()=>this.action())}
 refresh(){const chapter=currentChapter(this.game.state);if(!chapter){this.title.text='SETTLEMENT';this.task.text='All current chapters complete';this.progress.text='More territory coming';return}const s=chapterStatus(this.game.state,chapter);this.title.text=chapter.title;if(s.done){this.task.text='Reward ready';this.progress.text='TAP TO CLAIM'}else{const [id,lvl]=s.next;this.task.text=`${BUILDINGS[id].name} → Lv. ${lvl}`;this.progress.text=`${s.complete}/${s.total} objectives · tap to locate`}}
 action(){const chapter=currentChapter(this.game.state);if(!chapter)return;const s=chapterStatus(this.game.state,chapter);if(s.done)this.game.claimChapter(chapter);else if(s.next)this.game.focusBuilding(s.next[0])}
}
