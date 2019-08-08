export enum Button {
  Up,
  Left,
  Down,
  Right,
  Rotate,
  Drop,
  Pause,
}

interface BindingsMap {
  [key: string]: Button;
}

interface KeyNameMap {
  [key: string]: string;
}

interface AxisThresholdMap {
  [axis: string]: number;
}

type AxisThreshold = number | AxisThresholdMap

function getButtonId(button: Button): number {
  return 1 << (button as number)
}

export default class Input {
  private oldState = 0
  private currentState = 0
  private newState = 0
  private repeatState = 0
  private newRepeatState = 0
  private bindings: BindingsMap = {}
  private axes = { x: 0, y: 0 }
  private axisThreshold: AxisThreshold = 0.2
  private level3Supported: boolean

  public constructor() {
    this.level3Supported = (new KeyboardEvent('dummy')).code !== undefined
    const keyAttr = this.level3Supported ? 'code' : 'keyCode'

    // Register event for key down
    window.addEventListener('keydown', (event): void => {
      // Get the button that's pressed
      const keyCode = event[keyAttr].toString()
      const button = this.bindings[keyCode]

      // If the button is not bound, do nothing
      if (button === undefined) return

      // Add the button to the list of pressed buttons since last update
      const buttonId = getButtonId(button)
      this.newState |= buttonId
      event.preventDefault()

      // Save the repeated state of this button
      if (event.repeat) this.newRepeatState |= buttonId
    }, false)

    // Register event for key up
    window.addEventListener('keyup', (event): void => {
      // Get the button's binding
      const keyCode = event[keyAttr].toString()
      const button = this.bindings[keyCode]

      // If the button is not bound, do nothing
      if (button === undefined) return

      // Unregister the key from the pressed buttons since last update
      this.newState &= ~getButtonId(button)
      event.preventDefault()
    }, false)

    // Listen for when focus is lost
    window.addEventListener('blur', (): void => {
      this.newState = 0
      this.newRepeatState = 0
    }, false)
  }

  public getAxisThreshold(axis: string): number {
    return typeof this.axisThreshold === 'number'
      ? this.axisThreshold
      : (this.axisThreshold[axis] || 0)
  }

  public getAxisValue(axis: string): number {
    const axisValue = 0 // TODO: Implement this
    return axisValue > this.getAxisThreshold(axis) ? axisValue : 0
  }

  public setBindings(bindings: BindingsMap, newAxisThreshold: AxisThreshold | null = null): Input {
    this.oldState = 0
    this.currentState = 0
    this.newState = 0
    this.repeatState = 0
    this.newRepeatState = 0
    this.bindings = bindings
    this.axes = { x: 0, y: 0 }
    if (newAxisThreshold !== null) this.axisThreshold = newAxisThreshold

    return this
  }

  public update(): void {
    this.oldState = this.currentState
    this.currentState = this.newState

    this.repeatState = this.newRepeatState
    this.newRepeatState = 0

    // Handle keyboard axis emulation
    const axisFactor = 1

    if (this.isPressed(Button.Right)) {
      this.axes['x'] = axisFactor
    } else if (this.isReleased(Button.Right)) {
      this.axes['x'] = this.isDown(Button.Left) ? -axisFactor : 0
    }

    if (this.isPressed(Button.Left)) {
      this.axes['x'] = -axisFactor
    } else if (this.isReleased(Button.Left)) {
      this.axes['x'] = this.isDown(Button.Right) ? axisFactor : 0
    }

    if (this.isPressed(Button.Down)) {
      this.axes['y'] = axisFactor
    } else if (this.isReleased(Button.Down)) {
      this.axes['y'] = this.isDown(Button.Up) ? -axisFactor : 0
    }

    if (this.isPressed(Button.Up)) {
      this.axes['y'] = -axisFactor
    } else if (this.isReleased(Button.Up)) {
      this.axes['y'] = this.isDown(Button.Down) ? axisFactor : 0
    }
  }

  public setPressed(button: Button, repeat: boolean = false): void {
    // Add the button to the list of pressed buttons since last update
    const buttonId = getButtonId(button)
    this.newState |= buttonId

    // Save the repeated state of this button
    if (repeat) this.newRepeatState |= buttonId
  }

  public setReleased(button: Button): void {
    // Unregister the key from the pressed buttons since last update
    this.newState &= ~getButtonId(button)
  }

  public isPressed(button: Button, repeat: boolean = false): boolean {
    const buttonId = getButtonId(button)

    const result = (repeat && (this.repeatState & buttonId)) ||
      ((this.currentState & buttonId) && !(this.oldState & buttonId))

    return !!result
  }

  public isReleased(button: Button): boolean {
    const buttonId = getButtonId(button)

    const result = !(this.currentState & buttonId) && (this.oldState & buttonId)
    return !!result
  }

  public isDown(button: Button): boolean {
    const buttonId = getButtonId(button)

    const result = this.currentState & buttonId
    return !!result
  }
}
