const KEY='achu_business_audio_enabled'

export class GameAudio{
 constructor(){
  this.enabled=localStorage.getItem(KEY)!=='off'
  this.ctx=null;this.master=null;this.music=null;this.musicTimer=null;this.musicStep=0
 }
 ensureContext(){
  if(this.ctx)return true
  const AudioCtx=window.AudioContext||window.webkitAudioContext
  if(!AudioCtx)return false
  this.ctx=new AudioCtx({latencyHint:'interactive'})
  this.master=this.ctx.createGain();this.master.gain.value=.88;this.master.connect(this.ctx.destination)
  return true
 }
 async unlock(){
  if(!this.enabled||!this.ensureContext())return false
  this.startMusic()
  try{if(this.ctx.state!=='running')await this.ctx.resume()}catch{}
  this.startMusic()
  return this.ctx.state==='running'
 }
 toggle(){
  this.enabled=!this.enabled;localStorage.setItem(KEY,this.enabled?'on':'off')
  if(this.enabled)this.unlock();else this.stopAmbient()
  return this.enabled
 }
 tone(freq=440,duration=.08,type='sine',volume=.08,delay=0,target=this.master){
  if(!this.enabled||!this.ctx||!target)return
  const now=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain()
  o.type=type;o.frequency.setValueAtTime(freq,now)
  g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+duration)
  o.connect(g);g.connect(target);o.start(now);o.stop(now+duration+.04)
 }
 ui(){this.tone(720,.055,'triangle',.05)}
 dispatch(kind='scout'){const base=kind==='attack'?190:kind==='claim'?300:kind==='gather'?380:460;this.tone(base,.11,'triangle',.12);this.tone(base*1.5,.16,'sine',.09,.06)}
 build(){this.tone(160,.1,'square',.09);this.tone(240,.15,'triangle',.1,.08);this.tone(360,.12,'sine',.07,.18)}
 research(){this.tone(620,.09,'sine',.085);this.tone(820,.13,'sine',.09,.07);this.tone(1040,.12,'triangle',.055,.16)}
 success(){this.tone(523.25,.11,'triangle',.11);this.tone(659.25,.13,'triangle',.11,.09);this.tone(783.99,.22,'sine',.1,.18)}
 fail(){this.tone(220,.14,'sawtooth',.075);this.tone(155,.24,'triangle',.07,.1)}
 startMusic(){
  if(this.music||!this.enabled||!this.ensureContext())return
  const bus=this.ctx.createGain();bus.gain.value=.62;bus.connect(this.master)
  const pad=this.ctx.createGain();pad.gain.value=.26;pad.connect(bus)
  const bass=this.ctx.createGain();bass.gain.value=.22;bass.connect(bus)
  const roots=[220,196,261.63,174.61]
  const chordFor=root=>[root,root*1.2599,root*1.4983]
  const first=chordFor(roots[0])
  const padOsc=first.map((f,i)=>{
   const o=this.ctx.createOscillator(),g=this.ctx.createGain()
   o.type=i===0?'sine':'triangle';o.frequency.value=f;g.gain.value=i===0?.34:.22
   o.connect(g);g.connect(pad);o.start();return{o,g}
  })
  const bassOsc=this.ctx.createOscillator();bassOsc.type='triangle';bassOsc.frequency.value=110;bassOsc.connect(bass);bassOsc.start()
  this.music={bus,pad,bass,padOsc,bassOsc}
  const melody=[440,523.25,659.25,523.25,392,440,523.25,698.46,659.25,523.25,440,392,349.23,392,440,523.25]
  const tick=()=>{
   if(!this.music||!this.ctx)return
   const step=this.musicStep++,bar=Math.floor(step/8)%roots.length,root=roots[bar],chord=chordFor(root),now=this.ctx.currentTime
   this.music.padOsc.forEach((x,i)=>x.o.frequency.exponentialRampToValueAtTime(chord[i],now+.18))
   this.music.bassOsc.frequency.exponentialRampToValueAtTime(root/2,now+.12)
   const note=melody[step%melody.length]
   this.tone(note,.28,'triangle',.17,0,this.music.bus)
   if(step%2===0)this.tone(note/2,.22,'sine',.09,.03,this.music.bus)
   if(step%4===0){this.tone(root,.38,'sine',.13,.01,this.music.bus);this.tone(root*2,.12,'square',.045,.02,this.music.bus)}
  }
  tick();this.musicTimer=setInterval(tick,480)
 }
 startAmbient(){this.startMusic()}
 stopAmbient(){
  if(this.musicTimer){clearInterval(this.musicTimer);this.musicTimer=null}
  if(!this.music)return
  try{this.music.padOsc.forEach(x=>x.o.stop());this.music.bassOsc.stop()}catch{}
  try{this.music.bus.disconnect();this.music.pad.disconnect();this.music.bass.disconnect()}catch{}
  this.music=null;this.musicStep=0
 }
}
