import {DomHud} from './DomHud.js'
import {worldTile,parseTile} from '../data/world.js'
import {REGIONS} from '../data/regions.js'

const originalRefresh=DomHud.prototype.refresh
DomHud.prototype.refresh=function(force=false){
 const now=performance.now()
 if(!force&&this.__uiPaintAt&&now-this.__uiPaintAt<420)return
 this.__uiPaintAt=now
 return originalRefresh.call(this,force)
}

const originalOpenSheet=DomHud.prototype.openSheet
DomHud.prototype.openSheet=function(html,kind=''){
 const old=this.root?.querySelector('#sheet'),same=old?.classList.contains(kind),y=old?.scrollTop??0
 originalOpenSheet.call(this,html,kind)
 if(same){const next=this.root?.querySelector('#sheet');if(next)next.scrollTop=y}
}

const originalWorldPanel=DomHud.prototype.renderWorldPanel
DomHud.prototype.renderWorldPanel=function(id){
 originalWorldPanel.call(this,id)
 if(!id)return
 const [x,y]=parseTile(id),def=worldTile(x,y),small=this.root?.querySelector('#sheet .sheet-head small')
 if(small)small.textContent=`${REGIONS[def.region]?.name??'Frontier'} · ${def.kind.toUpperCase()}`
}
