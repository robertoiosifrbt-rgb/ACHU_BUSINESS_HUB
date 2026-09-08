export const DISTRICTS=[
 {id:'slough',name:'Slough Central',kind:'Mixed',unlockRep:0,leadBias:'domestic',description:'Flats, family homes and small shops. Cheap travel and steady starter work.'},
 {id:'langley',name:'Langley',kind:'Residential',unlockRep:0,leadBias:'domestic',description:'Larger homes and recurring domestic routes.'},
 {id:'trading',name:'Trading Estate',kind:'Commercial',unlockRep:28,leadBias:'commercial',description:'Warehouses, offices and recurring commercial contracts.'},
 {id:'windsor',name:'Windsor Road',kind:'Premium',unlockRep:55,leadBias:'premium',description:'Higher expectations, stronger margins and less tolerance for mistakes.'}
]

export const SERVICES={
 regular:{name:'Regular clean',baseHourly:30,suppliesPerHour:2.4,qualityNeed:60},
 deep:{name:'Deep clean',baseHourly:39,suppliesPerHour:4.4,qualityNeed:72},
 tenancy:{name:'End of tenancy',baseHourly:45,suppliesPerHour:5.2,qualityNeed:78},
 office:{name:'Office clean',baseHourly:34,suppliesPerHour:2.8,qualityNeed:68},
 commercialDeep:{name:'Commercial deep clean',baseHourly:48,suppliesPerHour:5.5,qualityNeed:80}
}

export const LEAD_TEMPLATES=[
 {client:'Priya Shah',initials:'PS',district:'slough',kind:'Domestic',property:'3-bed house',serviceId:'regular',hours:3,frequency:'Fortnightly',priceSensitivity:.55,expectation:66,message:'Looking for someone reliable every two weeks for kitchen, bathrooms and floors.'},
 {client:'Daniel Morgan',initials:'DM',district:'langley',kind:'Domestic',property:'4-bed house',serviceId:'deep',hours:5,frequency:'One-off',priceSensitivity:.45,expectation:74,message:'We need a proper deep clean before family arrives this weekend.'},
 {client:'Hannah Lee',initials:'HL',district:'slough',kind:'Domestic',property:'2-bed flat',serviceId:'regular',hours:2.5,frequency:'Weekly',priceSensitivity:.7,expectation:62,message:'Weekly clean, preferably the same person and the same time each week.'},
 {client:'Oakfield Lettings',initials:'OL',district:'slough',kind:'Commercial',property:'2-bed rental flat',serviceId:'tenancy',hours:4,frequency:'Repeat',priceSensitivity:.5,expectation:78,message:'We manage several rentals and need fast turnarounds between tenants.'},
 {client:'Northgate Dental',initials:'ND',district:'trading',kind:'Commercial',property:'Dental practice',serviceId:'office',hours:3.5,frequency:'3x weekly',priceSensitivity:.4,expectation:82,message:'Evening cleaning contract. Reliability and hygiene standards matter more than the cheapest price.'},
 {client:'Westpoint Logistics',initials:'WL',district:'trading',kind:'Commercial',property:'Warehouse offices',serviceId:'commercialDeep',hours:7,frequency:'Monthly',priceSensitivity:.35,expectation:80,message:'Monthly deep clean of offices, welfare areas and entrance spaces.'},
 {client:'Amelia Brooks',initials:'AB',district:'windsor',kind:'Domestic',property:'5-bed house',serviceId:'deep',hours:6,frequency:'Monthly',priceSensitivity:.25,expectation:88,message:'I care about consistency and details. Monthly service if the first clean is excellent.'},
 {client:'Rowan & Finch',initials:'RF',district:'windsor',kind:'Commercial',property:'Boutique office',serviceId:'office',hours:4,frequency:'5x weekly',priceSensitivity:.3,expectation:86,message:'Premium office clean before staff arrive. We need the same standard every morning.'}
]

export const APPLICANTS=[
 {id:'staff-maya',name:'Maya Patel',role:'Cleaner',quality:82,speed:72,reliability:88,wage:12.8,hireCost:85},
 {id:'staff-lewis',name:'Lewis Grant',role:'Cleaner',quality:68,speed:86,reliability:72,wage:11.9,hireCost:60},
 {id:'staff-aisha',name:'Aisha Khan',role:'Senior cleaner',quality:90,speed:78,reliability:93,wage:15.2,hireCost:140},
 {id:'staff-tomas',name:'Tomas Reed',role:'Cleaner',quality:74,speed:75,reliability:80,wage:12.3,hireCost:70}
]

export const VEHICLES=[
 {id:'vehicle-transit',name:'Used Transit',seats:3,stockCapacity:90,reliability:72,runningCostPerMile:.34,price:0},
 {id:'vehicle-caddy',name:'Used Caddy',seats:2,stockCapacity:62,reliability:84,runningCostPerMile:.27,price:3200},
 {id:'vehicle-custom',name:'Transit Custom',seats:5,stockCapacity:150,reliability:94,runningCostPerMile:.31,price:7800}
]

export const PREMISES=[
 {id:'home',name:'Home base',staffLimit:2,stockLimit:120,price:0,stage:'One-person operator'},
 {id:'storage',name:'Storage unit',staffLimit:5,stockLimit:260,price:1200,stage:'Small cleaning team'},
 {id:'office',name:'Small office',staffLimit:10,stockLimit:420,price:4800,stage:'Local operator'},
 {id:'depot',name:'Operations depot',staffLimit:24,stockLimit:900,price:14000,stage:'City cleaning company'}
]

export const SYSTEMS=[
 {id:'quality',name:'Quality checklist',price:450,unlock:'complaint',description:'Reduces quality variance and makes weak jobs less likely.',effect:'+6 minimum job quality'},
 {id:'route',name:'Route planner',price:650,unlock:'multiJob',description:'Cuts wasted travel when multiple jobs share a day.',effect:'-15% travel cost'},
 {id:'crm',name:'Client CRM',price:900,unlock:'clients',description:'Improves follow-up and recurring-client conversion.',effect:'+15% recurring conversion'}
]

export const FIRST_LEAD={
 id:'lead-sarah-001',client:'Sarah Collins',initials:'SC',district:'langley',kind:'Domestic',property:'2-bed flat',serviceId:'tenancy',hours:3.5,frequency:'One-off',priceSensitivity:.5,expectation:78,distanceMiles:4.2,expiresDay:2,
 message:'I hand the keys back tomorrow afternoon. The flat is empty, but the oven is bad and the bathroom needs a proper clean. Can you fit me in tomorrow morning?'
}

export const CHAPTERS=[
 {id:1,title:'ONE CHANCE',goal:'Complete your first paid job and earn a review.'},
 {id:2,title:'WORD GETS AROUND',goal:'Build three active clients and £750 cash.'},
 {id:3,title:'TOO MUCH FOR ONE PERSON',goal:'Hire your first employee after capacity becomes tight.'},
 {id:4,title:'A PROPER BASE',goal:'Move from home into a storage unit.'},
 {id:5,title:'COMMERCIAL WORK',goal:'Win your first recurring commercial contract.'},
 {id:6,title:'THE COMPANY',goal:'Run two crews with multiple vehicles and recurring routes.'}
]
