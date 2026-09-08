import { BusinessGameApp } from './business-game/app/BusinessGameApp.js'

const mount=document.querySelector('#app')
try{
 new BusinessGameApp(mount).start()
}catch(error){
 console.error('ACHU business game failed to start',error)
 document.body.innerHTML=`<main style="font-family:system-ui;padding:32px;background:#12251f;color:white;min-height:100vh"><h1>ACHU could not start</h1><pre>${String(error?.stack??error)}</pre></main>`
}
