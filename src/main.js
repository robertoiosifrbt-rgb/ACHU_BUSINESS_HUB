import './styles.css'
import { StrategyGame } from './game/StrategyGame.js'
import './game/StrategyGameEnhancements.js'

const mount = document.querySelector('#app')
const game = new StrategyGame(mount)
await game.start()
