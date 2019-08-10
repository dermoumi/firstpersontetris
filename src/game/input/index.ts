import Player from './player'
import { MaxLocalPlayers, KeyboardMap, GamepadMap, getDefaultKeyMap, getDefaultGamepadMap } from 'game/config'
import KeyboardHandler from './keyboard'
import GamepadHandler from './gamepad'

export default class Input {
  private players: Player[]
  private keyboards: KeyboardHandler[]
  private gamepads: Record<number, GamepadHandler> = {}
  private gamepadMaps: Record<string, GamepadMap>

  public constructor(
    keyMaps: Record<string, KeyboardMap> = {},
    gamepadMaps: Record<string, GamepadMap> = {},
  ) {
    this.gamepadMaps = gamepadMaps

    const level3Supported = KeyboardHandler.isLevel3Supported()

    // Create players handlers
    this.players = new Array(MaxLocalPlayers)
    this.keyboards = new Array(MaxLocalPlayers)
    for (let i = 0; i < MaxLocalPlayers; ++i) {
      const player = new Player(i)
      this.players[i] = player

      const keyMap = keyMaps[i] || getDefaultKeyMap(i, level3Supported)
      this.keyboards[i] = new KeyboardHandler(keyMap, player)
    }

    // Setup gamepads
    const gamepads = navigator.getGamepads()
    for (let i = 0; i < gamepads.length; ++i) {
      const gamepad = gamepads[i]
      if (!gamepad) continue

      this.plugGamepad(gamepad)
    }

    // Setup gamepad events
    window.addEventListener('gamepadconnected', (event): void => {
      const gamepad = (event as GamepadEvent).gamepad
      this.plugGamepad(gamepad)
    }, false)

    window.addEventListener('gamepaddisconnected', (event): void => {
      const gamepad = (event as GamepadEvent).gamepad
      this.unplugGamepad(gamepad)
    })
  }

  public getFor(player: number): Player {
    return this.players[player]
  }

  public update(): void {
    for (let i = 0; i < 4; ++i) {
      const gamepad = this.gamepads[i]
      if (!gamepad) continue
      gamepad.update()
    }

    this.players.forEach((player): void => {
      player.update()
    })
  }

  public plugGamepad(gamepad: Gamepad, player?: Player): void {
    const index = gamepad.index
    const gamepadMap = this.getGamepadMap(gamepad)

    if (!player && gamepadMap.players) {
      const playerIndex = gamepadMap.players[index]
      if (playerIndex !== undefined) {
        player = this.players[playerIndex]
      }
    }

    const gamepadHandler = new GamepadHandler(gamepad, gamepadMap, player)
    this.gamepads[index] = gamepadHandler
  }

  public unplugGamepad(gamepad: Gamepad): void {
    const index = gamepad.index

    const gamepadHandler = this.gamepads[index]
    if (!gamepadHandler) return

    gamepadHandler.destroy()
    delete this.gamepads[index]
  }

  private getGamepadMap(gamepad: Gamepad): GamepadMap {
    let gamepadMap = this.gamepadMaps[gamepad.id]
    if (gamepadMap === undefined) {
      gamepadMap = getDefaultGamepadMap(gamepad)
      this.gamepadMaps[gamepad.id] = gamepadMap
    }
    return gamepadMap
  }
}
