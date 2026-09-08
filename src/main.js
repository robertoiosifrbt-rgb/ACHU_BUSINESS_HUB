import './styles.css'
import './gameplay.css'
import './clarity.css'
import { Retro4XGame } from './game3d/Retro4XGame.js'
import './game3d/startPatch.js'
import './game3d/systemsPatch.js'
import './game3d/gameplayPatch.js'
import './game3d/cameraPatch.js'

export const APP_VERSION='3.3.0'
const mount=document.querySelector('#app')
mount.innerHTML='<div id="boot" style="position:fixed;inset:0;display:grid;place-items:center;background:#13242a;color:#eefaff;font:700 14px system-ui;letter-spacing:1px;z-index:9999">LOADING EMBERFALL…</div>'
try{
 const game=new Retro4XGame(mount)
 await game.start()
 document.querySelector('#boot')?.remove()
 window.game=game
}catch(error){
 console.error(error)
 mount.innerHTML=`<div style="position:fixed;inset:0;display:grid;place-items:center;background:#13242a;color:#fff;font-family:system-ui;padding:24px;text-align:center"><div><b style="font-size:22px">STARTUP ERROR</b><p style="opacity:.75;font-size:13px">${String(error?.message||error)}</p><button onclick="location.reload()" style="border:0;border-radius:14px;padding:14px 24px;background:#34768b;color:#fff;font-weight:900">RETRY</button></div></div>`
}

const withTimeout=(promise,ms=5000)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Update check timed out')),ms))])
async function registerUpdater(){
 if(!('serviceWorker' in navigator))return null
 const base=import.meta.env.BASE_URL
 const registration=await withTimeout(navigator.serviceWorker.register(`${base}sw.js`,{scope:base}),5000)
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!window.__reloadingForUpdate){window.__reloadingForUpdate=true;location.reload()}})
 const updater={version:APP_VERSION,async checkAndApply(){
  const status=document.querySelector('#update-app');if(status){status.disabled=true;status.textContent='CHECKING'}
  try{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500)
   const remote=await fetch(`${base}version.json?t=${Date.now()}`,{cache:'no-store',signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`Version ${r.status}`);return r.json()}).finally(()=>clearTimeout(timer))
   if(remote.version!==APP_VERSION){if(status)status.textContent='UPDATING';const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('emberfall-4x-')).map(k=>caches.delete(k)));registration.update().catch(()=>{});location.replace(`${base}?v=${encodeURIComponent(remote.version)}&t=${Date.now()}`);return}
   registration.update().catch(()=>{});if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'})
   if(status){status.textContent='UP TO DATE';setTimeout(()=>{status.textContent='UPDATE';status.disabled=false},1200)}
  }catch(e){console.warn(e);if(status){status.textContent='RETRY';status.disabled=false}}
 }}
 window.appUpdater=updater;return updater
}
registerUpdater().catch(error=>{console.warn(error);const status=document.querySelector('#update-app');if(status){status.textContent='RETRY';status.disabled=false}})
