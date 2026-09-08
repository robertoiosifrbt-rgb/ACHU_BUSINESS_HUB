export const REGIONS={
 crown:{name:'Central Market',subtitle:'Your home operating zone and strongest client base'},
 north:{name:'North Corridor',subtitle:'Commercial estates, offices and logistics opportunities'},
 east:{name:'East Growth Belt',subtitle:'Dense competition with high-value contracts'},
 south:{name:'South Service Zone',subtitle:'Residential density and recurring service demand'},
 west:{name:'West Expansion Ring',subtitle:'New markets with room to grow fast'},
}

export function regionFor(x,y,center=10){
 const dx=x-center,dy=y-center
 if(Math.abs(dx)<=3&&Math.abs(dy)<=3)return'crown'
 if(Math.abs(dx)>Math.abs(dy))return dx>0?'east':'west'
 return dy<0?'north':'south'
}
