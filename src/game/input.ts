interface ButtonMap {
  [key: string]: number
}

interface BindingsMap {
  [key: string]: string
}

interface KeyNameMap {
  [key: string]: string
}

interface AxisThresholdMap {
  [axis: string]: number
}

type AxisThreshold = number | AxisThresholdMap

export default class Input {
  ids: ButtonMap = {}
  idCount = 0
  oldState = 0
  currentState = 0
  newState = 0
  repeatState = 0
  newRepeatState = 0
  keyNames: KeyNameMap = {}
  bindings: BindingsMap = {}
  axes = { x: 0, y: 0 }
  axisThreshold: AxisThreshold = 0.2
  level3Supported: boolean

  constructor() {
    this.level3Supported = (new KeyboardEvent('dummy')).code !== undefined
    const keyAttr = this.level3Supported ? 'code' : 'keyCode'

    // Register event for key down
    window.addEventListener('keydown', (event) => {
      // Get the button that's pressed
      const keyCode = event[keyAttr].toString()
      const button = this.bindings[keyCode]

      // If the button is not bound, do nothing
      if (!button) return

      // Add the button to the list of pressed buttons since last update
      const buttonId = this.getButtonId(button)
      this.newState |= buttonId
      event.preventDefault()

      // Save the repeated state of this button
      if (event.repeat) this.newRepeatState |= buttonId

      // Since we only know the key by its physical location
      // We might as well start building a database of key names
      // while we have access to key names
      if (this.level3Supported) this.keyNames[button] = (event.key || event.keyCode).toString()
    }, false)

    // Register event for key up
    window.addEventListener('keyup', (event) => {
      // Get the button's binding
      const keyCode = event[keyAttr].toString()
      const button = this.bindings[keyCode]

      // If the button is not bound, do nothing
      if (!button) return

      // Unregister the key from the pressed buttons since last update
      this.newState &= ~this.getButtonId(button)
      event.preventDefault()
    }, false)

    // Listen for when focus is lost
    window.addEventListener('blur', () => {
      this.newState = 0
      this.newRepeatState = 0
    }, false)
  }

  getButtonId(button: string): number {
    let id = this.ids[button]
    if (id === undefined) {
      id = 1 << this.idCount++
      this.ids[button] = id
    }

    return id
  }

  getAxisThreshold(axis: string): number {
    return typeof this.axisThreshold === 'number'
      ? this.axisThreshold
      : (this.axisThreshold[axis] || 0)
  }

  getAxisValue(axis: string): number {
    const axisValue = 0 // TODO: Implement this
    return axisValue > this.getAxisThreshold(axis) ? axisValue : 0
  }

  getKeyName(button: string): string {
    return this.keyNames[button] || button
  }

  setBindings(newBindings: BindingsMap, newAxisThreshold: AxisThreshold | null = null): Input {
    this.ids = {}
    this.idCount = 0
    this.oldState = 0
    this.currentState = 0
    this.newState = 0
    this.repeatState = 0
    this.newRepeatState = 0
    this.bindings = newBindings
    this.axes = { x: 0, y: 0 }
    if (newAxisThreshold !== null) this.axisThreshold = newAxisThreshold

    return this
  }

  update() {
    this.oldState = this.currentState
    this.currentState = this.newState

    this.repeatState = this.newRepeatState
    this.newRepeatState = 0

    // Handle keyboard axis emulation
    const axisFactor = 1

    if (this.isPressed('right')) {
      this.axes['x'] = axisFactor
    } else if (this.isReleased('right')) {
      this.axes['x'] = this.isDown('left') ? -axisFactor : 0
    }

    if (this.isPressed('left')) {
      this.axes['x'] = -axisFactor
    } else if (this.isReleased('left')) {
      this.axes['x'] = this.isDown('right') ? axisFactor : 0
    }

    if (this.isPressed('down')) {
      this.axes['y'] = axisFactor
    } else if (this.isReleased('down')) {
      this.axes['y'] = this.isDown('up') ? -axisFactor : 0
    }

    if (this.isPressed('up')) {
      this.axes['y'] = -axisFactor
    } else if (this.isReleased('up')) {
      this.axes['y'] = this.isDown('down') ? axisFactor : 0
    }
  }

  isPressed(button: string, repeat: boolean = false): boolean {
    const buttonId = this.getButtonId(button)

    const result = (repeat && (this.repeatState & buttonId)) ||
      ((this.currentState & buttonId) && !(this.oldState & buttonId))

    return !!result
  }

  isReleased(button: string): boolean {
    const buttonId = this.getButtonId(button)

    const result = !(this.currentState & buttonId) && (this.oldState & buttonId)
    return !!result
  }

  isDown(button: string): boolean {
    const buttonId = this.getButtonId(button)

    const result = this.currentState & buttonId
    return !!result
  }
}
