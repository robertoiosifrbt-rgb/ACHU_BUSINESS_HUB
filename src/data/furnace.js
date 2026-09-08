export const FURNACE_MAX_LEVEL=12

export const FURNACE_LEVELS={
 1:{cost:{meat:70,wood:85,coal:20,iron:4},seconds:55,power:190,tier:'Ember Camp'},
 2:{cost:{meat:130,wood:160,coal:32,iron:6},seconds:85,power:320,tier:'Ember Camp'},
 3:{cost:{meat:240,wood:300,coal:58,iron:10},seconds:130,power:520,tier:'Hearth'},
 4:{cost:{meat:450,wood:560,coal:100,iron:18},seconds:195,power:840,tier:'Hearth'},
 5:{cost:{meat:820,wood:1020,coal:180,iron:32},seconds:290,power:1320,tier:'Foundry'},
 6:{cost:{meat:1500,wood:1850,coal:320,iron:58},seconds:430,power:2050,tier:'Foundry'},
 7:{cost:{meat:2700,wood:3350,coal:560,iron:100},seconds:620,power:3150,tier:'Bastion'},
 8:{cost:{meat:4800,wood:6000,coal:980,iron:175},seconds:900,power:4800,tier:'Bastion'},
 9:{cost:{meat:8500,wood:10600,coal:1700,iron:310},seconds:1280,power:7200,tier:'Citadel'},
 10:{cost:{meat:15000,wood:18800,coal:3000,iron:550},seconds:1800,power:10500,tier:'Citadel'},
 11:{cost:{meat:26500,wood:33000,coal:5200,iron:950},seconds:2500,power:15000,tier:'Crown Forge'},
 12:{cost:{meat:46000,wood:58000,coal:9000,iron:1650},seconds:3400,power:21000,tier:'Crown Forge'},
}

export const FURNACE_REQUIRES={
 2:[['shelter',1]],
 3:[['sawmill',2]],
 4:[['huntersHut',3]],
 5:[['coalMine',3]],
 6:[['infantryCamp',5]],
 7:[['infirmary',6]],
 8:[['embassy',7]],
 9:[['embassy',8],['infirmary',8]],
 10:[['marksmanCamp',9],['researchCenter',1]],
 11:[['ironMine',10],['lancerCamp',10]],
 12:[['researchCenter',11],['storehouse',11]],
}

export const FURNACE_UNLOCKS={
 2:["Hunter's Hut"],
 3:['Coal Mine','Storehouse'],
 4:['World Map','Scouting'],
 5:['Infantry Camp','Infirmary','Army command'],
 6:['Iron Mine','Lancer Camp'],
 7:['Embassy','Alliance help'],
 8:['Marksman Camp','Third march slot'],
 9:['Research Center'],
 10:['Elite raids'],
 11:['Stronghold campaigns'],
 12:['Capital tier'],
}

export const furnaceVisualIndex=level=>Math.max(0,Math.min(FURNACE_MAX_LEVEL-1,(level||1)-1))
export const furnaceTier=level=>FURNACE_LEVELS[Math.max(1,Math.min(FURNACE_MAX_LEVEL,level||1))]?.tier??'Ember Camp'
export function nextFurnaceUnlock(level){for(let l=(level||0)+1;l<=FURNACE_MAX_LEVEL;l++)if(FURNACE_UNLOCKS[l])return{level:l,items:FURNACE_UNLOCKS[l]};return null}
