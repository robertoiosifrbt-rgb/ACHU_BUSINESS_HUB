import './styles.css'
import './game3d/information.css'
import './game3d/4x.css'
import './game3d/story.css'
import './game3d/hud-redesign.css'
import './game3d/dialogue-v5.css'
import { VisualBusinessGame } from './game3d/VisualBusinessGame.js'

export const APP_VERSION='5.0.0-living-city'
const mount=document.querySelector('#app')
const game=new VisualBusinessGame(mount)
try{await game.start()}catch(e){
 console.error('ACHU Business Hub startup failed:',e)
 document.body.innerHTML+=`<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;background:#07141a;padding:20px;border:1px solid #64e5ba55;border-radius:14px;max-width:85%;text-align:center;z-index:1000"><h2>Game Error</h2><p>${e.message}</p></div>`
}

async function registerUpdater(){
 if(!('serviceWorker' in navigator))return null
 const base=import.meta.env.BASE_URL
 const registration=await navigator.serviceWorker.register(`${base}sw.js`,{scope:base})
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!window.__reloadingForUpdate){window.__reloadingForUpdate=true;location.reload()}})
 const updater={version:APP_VERSION,async checkAndApply(){
  const status=document.querySelector('#update-app');if(status){status.disabled=true;status.textContent='CHECKING'}
  try{
   const remote=await fetch(`${base}version.json?t=${Date.now()}`,{cache:'no-store'}).then(r=>r.json())
   await registration.update()
   if(registration.waiting){registration.waiting.postMessage({type:'SKIP_WAITING'});return}
   if(remote.version!==APP_VERSION){if(status)status.textContent='UPDATING';const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('achu-business-hub-')).map(k=>caches.delete(k)));location.replace(`${base}?v=${encodeURIComponent(remote.version)}&t=${Date.now()}`);return}
   if(status){status.textContent='CURRENT';setTimeout(()=>{status.textContent='SYNC';status.disabled=false},1200)}
  }catch(e){console.warn(e);if(status){status.textContent='RETRY';status.disabled=false}}
 }}
 window.appUpdater=updater
 return updater
}
registerUpdater().catch(console.warn)
