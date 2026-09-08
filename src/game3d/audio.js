const KEY='achu_business_audio_enabled'

export class GameAudio{
 constructor(){
  this.enabled=localStorage.getItem(KEY)!=='off'
  this.ctx=null;this.master=null;this.ambient=null
 }
 async unlock(){
  if(!this.enabled)return false
  if(!this.ctx){
   const AudioCtx=window.AudioContext||window.webkitAudioContext
   if(!AudioCtx)return false
   this.ctx=new AudioCtx();this.master=this.ctx.createGain();this.master.gain.value=.55;this.master.connect(this.ctx.destination)
  }
  if(this.ctx.state==='suspended')await this.ctx.resume().catch(()=>{})
  this.startAmbient();return this.ctx.state==='running'
 }
 toggle(){
  this.enabled=!this.enabled;localStorage.setItem(KEY,this.enabled?'on':'off')
  if(this.enabled)this.unlock();else this.stopAmbient()
  return this.enabled
 }
 tone(freq=440,duration=.08,type='sine',volume=.08,delay=0){
  if(!this.enabled||!this.ctx||this.ctx.state!=='running')return
  const now=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain()
  o.type=type;o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.01);g.gain.exponentialRampToValueAtTime(.0001,now+duration)
  o.connect(g);g.connect(this.master);o.start(now);o.stop(now+duration+.02)
 }
 ui(){this.tone(520,.045,'sine',.025)}
 dispatch(kind='scout'){
  const base=kind==='attack'?180:kind==='claim'?250:kind==='gather'?320:390
  this.tone(base,.09,'triangle',.055);this.tone(base*1.5,.13,'sine',.045,.06)
 }
 build(){this.tone(160,.08,'square',.045);this.tone(230,.12,'triangle',.05,.08)}
 research(){this.tone(620,.08,'sine',.045);this.tone(820,.12,'sine',.045,.07)}
 success(){this.tone(440,.1,'triangle',.055);this.tone(660,.12,'triangle',.055,.09);this.tone(880,.18,'sine',.05,.18)}
 fail(){this.tone(210,.13,'sawtooth',.04);this.tone(150,.2,'triangle',.035,.1)}
 startAmbient(){
  if(this.ambient||!this.enabled||!this.ctx||this.ctx.state!=='running')return
  const gain=this.ctx.createGain();gain.gain.value=.012;gain.connect(this.master)
  const hum=this.ctx.createOscillator();hum.type='sine';hum.frequency.value=58;hum.connect(gain);hum.start()
  const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate),data=buffer.getChannelData(0)
  let last=0;for(let i=0;i<data.length;i++){const white=Math.random()*2-1;last=(last+.018*white)/1.018;data[i]=last*.42}
  const noise=this.ctx.createBufferSource();noise.buffer=buffer;noise.loop=true
  const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650
  const noiseGain=this.ctx.createGain();noiseGain.gain.value=.02;noise.connect(filter);filter.connect(noiseGain);noiseGain.connect(this.master);noise.start()
  this.ambient={hum,noise,gain,noiseGain}
 }
 stopAmbient(){
  if(!this.ambient)return
  try{this.ambient.hum.stop();this.ambient.noise.stop()}catch{}
  try{this.ambient.gain.disconnect();this.ambient.noiseGain.disconnect()}catch{}
  this.ambient=null
 }
}
