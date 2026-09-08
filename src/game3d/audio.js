const KEY='achu_business_audio_enabled'

export class GameAudio{
 constructor(){
  this.enabled=localStorage.getItem(KEY)!=='off'
  this.ctx=null;this.master=null;this.ambient=null;this.started=false
 }
 async unlock(){
  if(!this.enabled)return false
  if(!this.ctx){
   const AudioCtx=window.AudioContext||window.webkitAudioContext
   if(!AudioCtx)return false
   this.ctx=new AudioCtx();this.master=this.ctx.createGain();this.master.gain.value=.78;this.master.connect(this.ctx.destination)
  }
  if(this.ctx.state==='suspended')await this.ctx.resume().catch(()=>{})
  if(this.ctx.state==='running'){
   this.startAmbient()
   if(!this.started){this.started=true;this.tone(360,.07,'triangle',.07);this.tone(520,.11,'sine',.055,.055)}
  }
  return this.ctx.state==='running'
 }
 toggle(){
  this.enabled=!this.enabled;localStorage.setItem(KEY,this.enabled?'on':'off')
  if(this.enabled)this.unlock();else this.stopAmbient()
  return this.enabled
 }
 tone(freq=440,duration=.08,type='sine',volume=.08,delay=0){
  if(!this.enabled||!this.ctx||this.ctx.state!=='running')return
  const now=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain()
  o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.008);g.gain.exponentialRampToValueAtTime(.0001,now+duration)
  o.connect(g);g.connect(this.master);o.start(now);o.stop(now+duration+.025)
 }
 ui(){this.tone(560,.055,'sine',.045)}
 dispatch(kind='scout'){
  const base=kind==='attack'?170:kind==='claim'?235:kind==='gather'?310:380
  this.tone(base,.11,'triangle',.105);this.tone(base*1.45,.16,'sine',.08,.065)
 }
 build(){this.tone(145,.1,'square',.07);this.tone(215,.15,'triangle',.095,.085);this.tone(285,.12,'sine',.055,.18)}
 research(){this.tone(600,.09,'sine',.075);this.tone(800,.13,'sine',.075,.075);this.tone(1020,.16,'triangle',.055,.16)}
 success(){this.tone(420,.11,'triangle',.09);this.tone(630,.14,'triangle',.09,.095);this.tone(860,.22,'sine',.08,.195)}
 fail(){this.tone(205,.15,'sawtooth',.07);this.tone(145,.24,'triangle',.06,.11)}
 startAmbient(){
  if(this.ambient||!this.enabled||!this.ctx||this.ctx.state!=='running')return
  const bed=this.ctx.createGain();bed.gain.value=.03;bed.connect(this.master)
  const humA=this.ctx.createOscillator();humA.type='sine';humA.frequency.value=54;humA.connect(bed);humA.start()
  const humB=this.ctx.createOscillator(),humBGain=this.ctx.createGain();humB.type='triangle';humB.frequency.value=92;humBGain.gain.value=.018;humB.connect(humBGain);humBGain.connect(this.master);humB.start()
  const seconds=3,buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*seconds,this.ctx.sampleRate),data=buffer.getChannelData(0)
  let last=0;for(let i=0;i<data.length;i++){const white=Math.random()*2-1;last=(last+.025*white)/1.025;data[i]=last*.6}
  const noise=this.ctx.createBufferSource();noise.buffer=buffer;noise.loop=true
  const filter=this.ctx.createBiquadFilter();filter.type='bandpass';filter.frequency.value=520;filter.Q.value=.55
  const noiseGain=this.ctx.createGain();noiseGain.gain.value=.055;noise.connect(filter);filter.connect(noiseGain);noiseGain.connect(this.master);noise.start()
  this.ambient={humA,humB,noise,bed,humBGain,noiseGain}
 }
 stopAmbient(){
  if(!this.ambient)return
  try{this.ambient.humA.stop();this.ambient.humB.stop();this.ambient.noise.stop()}catch{}
  try{this.ambient.bed.disconnect();this.ambient.humBGain.disconnect();this.ambient.noiseGain.disconnect()}catch{}
  this.ambient=null
 }
}
