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
   this.ctx=new AudioCtx();this.master=this.ctx.createGain();this.master.gain.value=.82;this.master.connect(this.ctx.destination)
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
 ui(){this.tone(620,.055,'triangle',.055)}
 dispatch(kind='scout'){
  const base=kind==='attack'?170:kind==='claim'?260:kind==='gather'?340:430
  this.tone(base,.11,'triangle',.11);this.tone(base*1.48,.16,'sine',.085,.06)
 }
 build(){this.tone(145,.1,'square',.085);this.tone(220,.15,'triangle',.095,.08);this.tone(330,.12,'sine',.06,.18)}
 research(){this.tone(560,.09,'sine',.08);this.tone(760,.13,'sine',.085,.07);this.tone(980,.12,'triangle',.05,.16)}
 success(){this.tone(440,.11,'triangle',.1);this.tone(660,.13,'triangle',.1,.09);this.tone(880,.2,'sine',.09,.18)}
 fail(){this.tone(210,.14,'sawtooth',.075);this.tone(145,.24,'triangle',.065,.1)}
 startAmbient(){
  if(this.ambient||!this.enabled||!this.ctx||this.ctx.state!=='running')return
  const humGain=this.ctx.createGain();humGain.gain.value=.022;humGain.connect(this.master)
  const hum=this.ctx.createOscillator();hum.type='sine';hum.frequency.value=62;hum.connect(humGain);hum.start()
  const upperGain=this.ctx.createGain();upperGain.gain.value=.008;upperGain.connect(this.master)
  const upper=this.ctx.createOscillator();upper.type='triangle';upper.frequency.value=124;upper.connect(upperGain);upper.start()
  const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate),data=buffer.getChannelData(0)
  let last=0;for(let i=0;i<data.length;i++){const white=Math.random()*2-1;last=(last+.018*white)/1.018;data[i]=last*.5}
  const noise=this.ctx.createBufferSource();noise.buffer=buffer;noise.loop=true
  const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900
  const noiseGain=this.ctx.createGain();noiseGain.gain.value=.045;noise.connect(filter);filter.connect(noiseGain);noiseGain.connect(this.master);noise.start()
  this.ambient={hum,upper,noise,humGain,upperGain,noiseGain}
 }
 stopAmbient(){
  if(!this.ambient)return
  try{this.ambient.hum.stop();this.ambient.upper.stop();this.ambient.noise.stop()}catch{}
  try{this.ambient.humGain.disconnect();this.ambient.upperGain.disconnect();this.ambient.noiseGain.disconnect()}catch{}
  this.ambient=null
 }
}
