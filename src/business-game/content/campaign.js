export const FIRST_LEAD={
 id:'lead-sarah-001',client:'Sarah Collins',initials:'SC',kind:'Domestic',property:'2-bed flat',service:'End of tenancy clean',area:'Langley',distanceMiles:4.2,requested:'Tomorrow · 09:00–13:00',durationHours:3.5,marketPrice:128,minimumGoodPrice:105,maximumGoodPrice:148,variableCosts:{travel:9,supplies:14},
 message:'Hi, I hand the keys back tomorrow afternoon. The flat is empty, but the oven is bad and the bathroom needs a proper clean. Can you fit me in tomorrow morning?',
 stakes:'This is ACHU’s first real chance to earn a public review. Price it badly and you either lose the client or work for almost nothing.'
}

export const SECOND_LEAD={
 id:'lead-priya-002',client:'Priya Shah',initials:'PS',kind:'Domestic',property:'3-bed house',service:'Recurring fortnightly clean',area:'Slough',distanceMiles:2.7,requested:'Friday · flexible',durationHours:3,marketPrice:84,minimumGoodPrice:72,maximumGoodPrice:96,variableCosts:{travel:6,supplies:9},
 message:'Sarah gave me your number. I’m looking for someone every two weeks, mainly kitchen, bathrooms and floors. Are you taking regular clients?',
 stakes:'Recurring clients are the foundation of a stable route. This lead only exists because the first client talked about you.'
}

export const STORY={
 start:{eyebrow:'DAY 1 · 07:42',title:'One chance to look professional',body:'ACHU is barely a business yet: £350 cash, basic equipment, one used van and no public reputation. Your phone just buzzed with the first serious enquiry.',action:'READ THE MESSAGE'},
 accepted:{eyebrow:'QUOTE ACCEPTED',title:'Now you have to deliver',body:'Sarah accepted. Tomorrow morning is no longer an empty calendar — somebody is trusting you with a deadline.',action:'PLAN THE JOB'},
 scheduled:{eyebrow:'TOMORROW · 08:32',title:'The first job is real',body:'Equipment loaded. Supplies checked. The van is not glamorous, but it starts. Sarah expects the keys back clean by early afternoon.',action:'DRIVE TO LANGLEY'},
 arrived:{eyebrow:'09:01 · ON SITE',title:'The photos were optimistic',body:'The flat is empty, but the oven has heavy grease baked onto the racks. Doing it properly will cost extra supplies and around 25 minutes.',action:'MAKE A DECISION'},
 finished:{eyebrow:'13:06 · JOB COMPLETE',title:'You got paid. More importantly, you got remembered.',body:'The first job is finished. A good review can create work that advertising never could.',action:'SEE THE RESULT'},
 wordOfMouth:{eyebrow:'DAY 2 · 10:18',title:'Word gets around',body:'A new message arrives: “Sarah gave me your number.” For the first time, reputation is producing work.',action:'OPEN NEW LEAD'}
}

export const JOB_PROBLEM={
 title:'The oven will push the job over plan',
 body:'You quoted one complete clean. The client did mention the oven, but it is worse than expected. What matters now is the standard you want ACHU to be known for.',
 choices:[
  {id:'quality',title:'Do it properly',copy:'Use stronger degreaser and stay 25 minutes longer.',cashDelta:-4,qualityDelta:12,timeDelta:25},
  {id:'rush',title:'Stick to the planned time',copy:'Finish the visible areas and move on.',cashDelta:0,qualityDelta:-16,timeDelta:0}
 ]
}
