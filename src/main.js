import './styles.css'
import { StrategyGame } from './game/StrategyGame.js'
import './game/StrategyGameEnhancements.js'
import './game/DomHudPatch.js'

const mount = document.querySelector('#app')
const game = new StrategyGame(mount)
await game.start()
