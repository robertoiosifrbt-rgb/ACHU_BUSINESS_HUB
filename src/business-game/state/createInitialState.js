import { FIRST_LEAD,PREMISES,VEHICLES } from '../content/gameData.js'
import { enrichLead,suggestedQuote } from '../domain/simulator.js'

export function createInitialState(){
 const base={
  version:2,
  day:1,
  cash:350,
  reputation:0,
  supplies:76,
  activeTab:'today',
  selectedLeadId:FIRST_LEAD.id,
  selectedJobId:null,
  selectedClientId:null,
  company:{name:'ACHU',stage:'One-person operator'},
  premises:{...PREMISES[0]},
  systems:{quality:false,route:false,crm:false},
  staff:[{id:'owner',name:'You',role:'Owner-cleaner',quality:76,speed:74,reliability:92,wage:0,dailyHours:8,owner:true,active:true}],
  vehicles:[{...VEHICLES[0],condition:72}],
  leads:[],
  jobs:[],
  clients:[],
  reviews:[],
  applicantsUnlocked:['staff-maya','staff-lewis'],
  activity:[{id:'a-start',day:1,title:'ACHU starts here',copy:'£350, one used van, basic supplies and no reputation. Every decision now affects the company.'}],
  lastDaySummary:null,
  flags:{firstReview:false,capacityPressure:false,complaint:false,commercial:false}
 }
 const first=enrichLead(FIRST_LEAD,base)
 first.quotePrice=suggestedQuote(first,base)
 base.leads=[first]
 return base
}
