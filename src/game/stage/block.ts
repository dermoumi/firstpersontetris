import * as Pixi from 'pixi.js'
import Game from 'game/app'

export const BLOCK_SIZE = 16
export const BLOCK_SPACING = 0

export enum BlockType {
  Block1 = 0,
  Block2,
}

const BLOCK_TYPE: Record<BlockType, string> = {
  [BlockType.Block1]: 'block1',
  [BlockType.Block2]: 'block2',
}

export default class Block extends Pixi.Container {
  public constructor(color: number, type: BlockType) {
    super()

    const filling = new Pixi.Graphics()
    filling.beginFill(color)
    filling.drawRect(0, 0, BLOCK_SIZE, BLOCK_SIZE)
    this.addChild(filling)

    const blockType = BLOCK_TYPE[type]
    const sprite = Pixi.Sprite.from(Game.resources[blockType].texture)
    this.addChild(sprite)
  }
}
