import * as Pixi from 'pixi.js'
import Assets from 'game/assets'
import SubSprite from 'game/utils/subsprite'

export const BLOCK_SIZE = 16
export const BLOCK_SPACING = 0

export enum BlockType {
  Block1 = 0,
  Block2,
}

const BLOCK_TYPE: Record<BlockType, Pixi.Rectangle> = {
  [BlockType.Block1]: new Pixi.Rectangle(9, 225, 8, 8),
  [BlockType.Block2]: new Pixi.Rectangle(0, 225, 8, 8),
}

export default class Block extends Pixi.Container {
  public constructor(color: number, type: BlockType) {
    super()

    const filling = new Pixi.Graphics()
    filling.beginFill(color)
    filling.drawRect(0, 0, BLOCK_SIZE, BLOCK_SIZE)
    this.addChild(filling)

    const blockType = BLOCK_TYPE[type]
    const sprite = new SubSprite(Assets.stage.texture, blockType)
    sprite.scale.x = 2
    sprite.scale.y = 2
    this.addChild(sprite)
  }
}
