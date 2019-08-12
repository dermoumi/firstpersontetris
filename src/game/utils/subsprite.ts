import * as Pixi from 'pixi.js'

export default class SubSprite extends Pixi.Container {
  private texture: Pixi.Texture
  private subRect!: Pixi.Rectangle
  private graphics = new Pixi.Graphics()
  private hitAreaOverride?: Pixi.Rectangle

  public constructor(texture: Pixi.Texture, subRect?: Pixi.Rectangle) {
    super()
    this.texture = texture

    this.setSubRect(subRect)
    this.addChild(this.graphics)
  }

  public setSubRect(subRect?: Pixi.Rectangle): void {
    if (subRect === undefined) {
      const { width, height } = this.texture
      this.subRect = new Pixi.Rectangle(0, 0, width, height)
    } else {
      this.subRect = subRect
    }

    this.update()
  }

  public setHitArea(hitArea?: Pixi.Rectangle): void {
    this.hitAreaOverride = hitArea

    this.hitArea = (hitArea === undefined) ? this.subRect : hitArea
  }

  public setSize(width: number, height: number): void {
    this.scale.x = width / this.subRect.width
    this.scale.y = height / this.subRect.height
  }

  private update(): void {
    const gfx = this.graphics

    gfx.clear()
    gfx.beginTextureFill(this.texture)

    const { x, y, width, height } = this.subRect
    gfx.drawRect(x, y, width, height)

    gfx.pivot.x = x
    gfx.pivot.y = y

    this.updateHitArea()
  }

  private updateHitArea(): void {
    if (this.hitAreaOverride) {
      this.hitArea = this.hitAreaOverride
      return
    }

    const { width, height } = this.subRect
    this.hitArea = new Pixi.Rectangle(0, 0, width, height)
  }
}
