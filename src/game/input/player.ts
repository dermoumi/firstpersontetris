export default class Player {
  public index = 0
  public oldState = 0
  public currentState = 0
  public newState = 0
  public axes: Record<string, number> = {};

  public constructor(index: number) {
    this.index = index

    // Release all buttons when window or tab loses focus
    window.addEventListener('blur', (): void => {
      this.reset()
    }, false)
  }

  public isPressed(buttons: number): number {
    return (this.currentState & buttons) & ~(this.oldState & buttons)
  }

  public isReleased(buttons: number): number {
    return ~(this.currentState & buttons) & (this.oldState & buttons)
  }

  public isDown(buttons: number): number {
    return this.currentState & buttons
  }

  public reset(): void {
    this.newState = 0

    Object.keys(this.axes).forEach((key: string): void => {
      this.axes[key] = 0
    })
  }

  public update(): void {
    this.oldState = this.currentState
    this.currentState = this.newState
  }
}
