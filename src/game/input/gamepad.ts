import Device from './device'
import Player from './player'
import { GamepadMap, Axis, AxisMapping, AxisRange, JoystickThreshold } from 'game/config'
import { type } from 'os'

export default class GamepadHandler implements Device {
  private mapping: GamepadMap
  private index: number
  private player?: Player

  private buttonState: Record<number, boolean> = {}
  private axisState: Record<number, number> = {}

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

      if (this.buttonState[button] === pressed) return

      if (pressed) {
        player.newState |= target
      } else {
        player.newState &= ~target
      }

      this.buttonState[button] = pressed
    })

    // Update axes
    const updatedAxes: Record<number, boolean> = {}
    gamepad.axes.forEach((value, axis): void => {
      const target = this.mapping.axes[axis]
      if (target === undefined) return

      const roundedValue = Math.floor(value * 100) / 100

      if (this.axisState[axis] === roundedValue) return

      if (target instanceof Object) {
        const mapping = target as AxisMapping
        if (mapping.range === AxisRange.Hat && mapping.targetY) {
          if (roundedValue > 1) {
            player.axes[mapping.target] = 0
            player.axes[mapping.targetY] = 0
          } else {
            const direction = (1 + roundedValue) * 7/8 - 1

            const xValue = -Math.sin(direction * Math.PI)
            const yValue = Math.cos(direction * Math.PI)

            player.axes[mapping.target] = xValue
            player.axes[mapping.targetY] = yValue
          }
          updatedAxes[mapping.target] = true
          updatedAxes[mapping.targetY] = true
        } else {
          let axisValue = roundedValue

          if (mapping.range === AxisRange.Positive) {
            axisValue = Math.max(0, axisValue)
          } else if (mapping.range === AxisRange.Negative) {
            axisValue = Math.min(0, axisValue)
          }

          if (mapping.invert) {
            axisValue *= -1
          }

          player.axes[mapping.target] = axisValue
          updatedAxes[mapping.target] = true
        }
      } else {
        player.axes[target] = roundedValue
        updatedAxes[target] = true
      }

      this.axisState[axis] = roundedValue
    })

    // Process axes to buttons mappings
    this.mapping.axisButtons.forEach(({ axis, button, threshold, negative }): void => {
      if (threshold === undefined) threshold = JoystickThreshold

      if (!updatedAxes[axis]) return

      const value = negative ? -player.axes[axis] : player.axes[axis]
      if (value > threshold) {
        player.newState |= button
      } else {
        player.newState &= ~button
      }
    })
  }
}
