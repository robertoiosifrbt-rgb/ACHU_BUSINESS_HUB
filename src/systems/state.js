const KEY='build_strategy_v03'
export const DEMO_SPEED=120
export function defaultState(){return{resources:{wood:1600,food:1500,coal:500,iron:120},buildings:{furnace:1,house:1,sawmill:1,coalMine:1,infirmary:0,embassy:0,infantryCamp:0,marksmanCamp:0,researchCenter:0},research:{},construction:null,researchJob:null,power:420}}
export function loadState(){try{return{...defaultState(),...JSON.parse(localStorage.getItem(KEY)||'null')}}catch{return defaultState()}}
export function saveState(s){localStorage.setItem(KEY,JSON.stringify(s))}
export function resetState(){localStorage.removeItem(KEY);return defaultState()}
