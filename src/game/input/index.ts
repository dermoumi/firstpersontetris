import Player from './player'
import { MaxLocalPlayers, KeyboardMap, GamepadMap, getDefaultKeyMap } from 'game/config'
import Keyboard from './keyboard'

export default class Input {
  private players: Player[]
  private keyboards: Keyboard[]
  private multiplayerMode: boolean
  private gamepadMaps: Record<string, GamepadMap>

  public constructor(
    multiplayer: boolean = false,
    keyMaps: Record<string, KeyboardMap> = {},
    gamepadMaps: Record<string, GamepadMap> = {},
  ) {
    this.multiplayerMode = multiplayer
    this.gamepadMaps = gamepadMaps

    const level3Supported = Keyboard.isLevel3Supported()

    // Create players handlers
    this.players = new Array(MaxLocalPlayers)
    this.keyboards = new Array(MaxLocalPlayers)
    for (let i = 0; i < MaxLocalPlayers; ++i) {
      const player = new Player(i)
      this.players[i] = player

      const keyMap = keyMaps[i] || getDefaultKeyMap(i, level3Supported)
      this.keyboards[i] = new Keyboard(keyMap, player)
    }

    this.affectGamepads()
  }

  public setMultiplayerMode(enabled: boolean): void {
    if (this.multiplayerMode === enabled) return

    this.multiplayerMode = enabled
    this.affectGamepads()
  }

  public getFor(player: number): Player {
    return this.players[player]
  }

  public update(): void {
    this.players.forEach((player): void => {
      player.update()
    })
  }

  private affectGamepads(): void {
    // TODO: Implement this
  }
}
