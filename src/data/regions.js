export const REGIONS={
 crown:{name:'Crown Basin',subtitle:'The heartland around your settlement'},
 north:{name:'White North',subtitle:'Frozen passes and rich iron seams'},
 east:{name:'Ashen Reach',subtitle:'Fortified rivals and coal fields'},
 south:{name:'Low Frostlands',subtitle:'Open ground, food and timber'},
 west:{name:'Raven March',subtitle:'Raider country and old forts'},
}

export function regionFor(x,y,center=10){
 const dx=x-center,dy=y-center
 if(Math.abs(dx)<=3&&Math.abs(dy)<=3)return'crown'
 if(Math.abs(dx)>Math.abs(dy))return dx>0?'east':'west'
 return dy<0?'north':'south'
}
