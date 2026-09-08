import { FIRST_LEAD,STORY } from '../content/campaign.js'

export function createInitialState(){
 return{
  version:1,
  day:1,
  cash:350,
  reputation:0,
  reviews:[],
  supplies:76,
  capacityHours:8,
  company:{name:'ACHU',stage:'One-person operator'},
  vehicle:{id:'van-01',name:'Used Transit',condition:72,runningCostPerMile:0.34},
  leads:[FIRST_LEAD],
  selectedLeadId:FIRST_LEAD.id,
  quote:{price:128,status:'draft'},
  jobs:[],
  currentJobId:null,
  jobPhase:'idle',
  currentStory:STORY.start,
  storyKey:'start',
  lastOutcome:null
 }
}
