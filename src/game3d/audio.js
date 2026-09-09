const KEY='achu_business_audio_enabled'

export class GameAudio{
 constructor(){this.enabled=localStorage.getItem(KEY)!=='off';this.ctx=null;this.master=null;this.music=null;this.musicTimer=null;this.musicStep=0}
 async unlock(){
  if(!this.enabled)return false
  if(!this.ctx){
   const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return false
   this.ctx=new AudioCtx();this.master=this.ctx.createGain();this.master.gain.value=.78;this.master.connect(this.ctx.destination)
  }
  if(this.ctx.state==='suspended')await this.ctx.resume().catch(()=>{})
  this.startMusic();return this.ctx.state==='running'
 }
 toggle(){this.enabled=!this.enabled;localStorage.setItem(KEY,this.enabled?'on':'off');if(this.enabled)this.unlock();else this.stopAmbient();return this.enabled}
 tone(freq=440,duration=.08,type='sine',volume=.08,delay=0,target=this.master){
  if(!this.enabled||!this.ctx||this.ctx.state!=='running'||!target)return
  const now=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.01);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g);g.connect(target);o.start(now);o.stop(now+duration+.03)
 }
 ui(){this.tone(620,.055,'triangle',.045)}
 dispatch(kind='scout'){const base=kind==='attack'?170:kind==='claim'?260:kind==='gather'?340:430;this.tone(base,.11,'triangle',.11);this.tone(base*1.48,.16,'sine',.075,.06)}
 build(){this.tone(145,.1,'square',.08);this.tone(220,.15,'triangle',.09,.08);this.tone(330,.12,'sine',.055,.18)}
 research(){this.tone(560,.09,'sine',.075);this.tone(760,.13,'sine',.08,.07);this.tone(980,.12,'triangle',.045,.16)}
 success(){this.tone(440,.11,'triangle',.095);this.tone(660,.13,'triangle',.095,.09);this.tone(880,.2,'sine',.08,.18)}
 fail(){this.tone(210,.14,'sawtooth',.07);this.tone(145,.24,'triangle',.06,.1)}
 startMusic(){
  if(this.music||!this.enabled||!this.ctx||this.ctx.state!=='running')return
  const bus=this.ctx.createGain();bus.gain.value=.28;bus.connect(this.master)
  const pad=this.ctx.createGain();pad.gain.value=.11;pad.connect(bus)
  const bass=this.ctx.createGain();bass.gain.value=.14;bass.connect(bus)
  const chord=[110,138.59,164.81]
  const padOsc=chord.map((f,i)=>{const o=this.ctx.createOscillator();o.type=i===0?'sine':'triangle';o.frequency.value=f;const g=this.ctx.createGain();g.gain.value=i===0?.34:.18;o.connect(g);g.connect(pad);o.start();return{o,g}})
  const bassOsc=this.ctx.createOscillator();bassOsc.type='sine';bassOsc.frequency.value=55;bassOsc.connect(bass);bassOsc.start()
  this.music={bus,pad,bass,padOsc,bassOsc}
  const progressions=[[110,138.59,164.81,55],[98,123.47,146.83,49],[130.81,164.81,196,65.41],[87.31,110,130.81,43.65]]
  const melody=[329.63,392,440,392,293.66,329.63,392,493.88]
  const tick=()=>{
   if(!this.music||!this.ctx)return
   const step=this.musicStep++,bar=Math.floor(step/4)%progressions.length,p=progressions[bar],now=this.ctx.currentTime
   this.music.padOsc.forEach((x,i)=>x.o.frequency.exponentialRampToValueAtTime(p[i],now+.35));this.music.bassOsc.frequency.exponentialRampToValueAtTime(p[3],now+.22)
   const note=melody[step%melody.length];this.tone(note,.34,'triangle',.06,0,this.music.bus);this.tone(note/2,.16,'sine',.035,.18,this.music.bus)
   if(step%2===0)this.tone(p[3]*2,.22,'sine',.05,.02,this.music.bus)
  }
  tick();this.musicTimer=setInterval(tick,900)
 }
 startAmbient(){this.startMusic()}
 stopAmbient(){
  if(this.musicTimer){clearInterval(this.musicTimer);this.musicTimer=null}
  if(!this.music)return
  try{this.music.padOsc.forEach(x=>x.o.stop());this.music.bassOsc.stop()}catch{}
  try{this.music.bus.disconnect();this.music.pad.disconnect();this.music.bass.disconnect()}catch{}
  this.music=null
 }
}
