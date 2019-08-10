import Device from './device'
import { KeyboardMap } from 'game/config'
import Player from './player'

export default class KeyboardHandler implements Device {
  private mapping!: KeyboardMap
  private player?: Player
  private eventKeyAttr: string

  public static isLevel3Supported(): boolean {
    return (new KeyboardEvent('dummy')).code !== undefined
  }

  public constructor(mapping: KeyboardMap, player?: Player) {
    // Don't want to be checking level3 support every time
    this.eventKeyAttr = KeyboardHandler.isLevel3Supported() ? 'code' : 'keyCode'

    // Set keyboard and keyboard mapping
    this.mapping = mapping
    this.player = player
    if (player) player.reset()

    this.onKeyDown = this.onKeyDown.bind(this)
    window.addEventListener('keydown', this.onKeyDown, false)

    this.onKeyUp = this.onKeyUp.bind(this)
    window.addEventListener('keyup', this.onKeyUp, false)
  }

  public destroy(): void {
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('keydown', this.onKeyDown)
  }

  public setPlayer(player?: Player): void {
    if (player !== this.player) {
      if (this.player) this.player.reset()
      if (player) player.reset()
    }

    this.player = player
  }

  public setMapping(mapping: KeyboardMap): void {
    this.mapping = mapping
    if (this.player) {
      this.player.reset()
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (this.player === undefined) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyCode = (event as any)[this.eventKeyAttr].toString()
    const button = this.mapping.keys[keyCode]

    // If the button is not mapped, do nothing
    if (button === undefined) return
    event.preventDefault()

    // Add the button to the list of pressed buttons since last update
    this.player.newState |= button

    // Check if there's a key => axis mapping
    const axisMapping = this.mapping.keyAxes[button]
    if (axisMapping === undefined) return

    const factor = (axisMapping.factor === undefined) ? 1 : axisMapping.factor
    this.player.axes[axisMapping.axis] = factor
  }

  private onKeyUp(event: KeyboardEvent): void {
    if (this.player === undefined) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keyCode = (event as any)[this.eventKeyAttr].toString()
    const button = this.mapping.keys[keyCode]

    // If the button is not mapped, do nothing
    if (button === undefined) return
    event.preventDefault()

    // Unregister the key from the pressed buttons list since last update
    this.player.newState &= ~button

    // Check if there's a key => axis mapping
    const axisMapping = this.mapping.keyAxes[button]
    if (axisMapping === undefined) return

    // If there's an opposite button and it's pressed, switch to that direction instead
    const opposite = axisMapping.opposite
    if (opposite !== undefined && this.player.isDown(opposite)) {
      const factor = (axisMapping.factor === undefined) ? 1 : axisMapping.factor
      this.player.axes[axisMapping.axis] = factor * -1
    } else {
      this.player.axes[axisMapping.axis] = 0
    }
  }
}
