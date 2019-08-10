import Device from './device'
import Player from './player'
import { GamepadMap } from 'game/config'

export default class GamepadHandler implements Device {
  private mapping: GamepadMap
  private index: number
  private player?: Player

  private buttonState: Record<number, boolean> = {}

  public constructor(gamepad: Gamepad, mapping: GamepadMap,  player?: Player) {
    this.index = gamepad.index

    this.mapping = mapping
    this.player = player
    if (player) player.reset()
  }

  public destroy(): void {
    // Nothing to do
  }

  public setPlayer(player?: Player): void {
    if (player !== this.player) {
      if (this.player) this.player.reset()
      if (player) player.reset()
    }
  }

  public setMapping(mapping: GamepadMap): void {
    this.mapping = mapping
    if (this.player) {
      this.player.reset()
    }
  }

  public update(): void {
    if (!this.player) return
    const player: Player = this.player

    const gamepad = navigator.getGamepads()[this.index]
    if (gamepad === null) return

    // Update buttons
    gamepad.buttons.forEach(({ pressed }, button): void => {
      const target = this.mapping.buttons[button]
      if (target === undefined) return

      if (this.buttonState[button] != pressed) {
        if (pressed) {
          player.newState |= target
        } else {
          player.newState &= ~target
        }

        this.buttonState[button] = pressed
      }
    })

    // Update axes
  }
}
