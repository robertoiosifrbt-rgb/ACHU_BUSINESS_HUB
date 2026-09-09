const KEY='achu_business_audio_enabled'
const PARTS=['audio/make-it-shine-0.b64','audio/make-it-shine-1.b64']

export class GameAudio{
 constructor(){this.enabled=localStorage.getItem(KEY)!=='off';this.ctx=null;this.master=null;this.track=null;this.trackUrl=null;this.preparing=null}
 prepare(){
  if(this.track||this.preparing)return this.preparing
  this.preparing=Promise.all(PARTS.map(path=>fetch(`${import.meta.env.BASE_URL}${path}`).then(r=>{if(!r.ok)throw new Error(`Music part ${r.status}`);return r.text()})))
   .then(parts=>{
    const raw=atob(parts.join('').replace(/\s/g,'')),bytes=new Uint8Array(raw.length)
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i)
    this.trackUrl=URL.createObjectURL(new Blob([bytes],{type:'audio/ogg; codecs=opus'}))
    const track=new Audio(this.trackUrl);track.loop=true;track.preload='auto';track.volume=.34;track.playsInline=true
    track.setAttribute('playsinline','');track.setAttribute('webkit-playsinline','');this.track=track
    return track
   }).catch(error=>{console.error('ACHU music failed to load',error);this.preparing=null;return null})
  return this.preparing
 }
 ensureContext(){
  if(this.ctx)return true
  const AudioCtx=window.AudioContext||window.webkitAudioContext
  if(!AudioCtx)return false
  this.ctx=new AudioCtx({latencyHint:'interactive'});this.master=this.ctx.createGain();this.master.gain.value=.82;this.master.connect(this.ctx.destination);return true
 }
 async unlock(){
  if(!this.enabled)return false
  const track=this.track??await this.prepare();if(!track)return false
  if(this.ensureContext()&&this.ctx.state!=='running')await this.ctx.resume().catch(()=>{})
  try{await track.play();return true}catch{return false}
 }
 toggle(){
  this.enabled=!this.enabled;localStorage.setItem(KEY,this.enabled?'on':'off')
  if(this.enabled)this.unlock();else this.stopAmbient();return this.enabled
 }
 tone(freq=440,duration=.08,type='sine',volume=.08,delay=0){
  if(!this.enabled||!this.ctx||this.ctx.state!=='running'||!this.master)return
  const now=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,now)
  g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+duration)
  o.connect(g);g.connect(this.master);o.start(now);o.stop(now+duration+.04)
 }
 ui(){this.tone(720,.055,'triangle',.045)}
 dispatch(kind='scout'){const base=kind==='attack'?190:kind==='claim'?300:kind==='gather'?380:460;this.tone(base,.11,'triangle',.1);this.tone(base*1.5,.16,'sine',.07,.06)}
 build(){this.tone(160,.1,'square',.075);this.tone(240,.15,'triangle',.085,.08);this.tone(360,.12,'sine',.055,.18)}
 research(){this.tone(620,.09,'sine',.07);this.tone(820,.13,'sine',.075,.07);this.tone(1040,.12,'triangle',.045,.16)}
 success(){this.tone(523.25,.11,'triangle',.09);this.tone(659.25,.13,'triangle',.09,.09);this.tone(783.99,.22,'sine',.08,.18)}
 fail(){this.tone(220,.14,'sawtooth',.065);this.tone(155,.24,'triangle',.06,.1)}
 startMusic(){this.unlock()}
 startAmbient(){this.startMusic()}
 stopAmbient(){if(this.track)this.track.pause()}
}
