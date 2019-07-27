import * as Pixi from 'pixi.js'
import { BLOCK_SIZE, BLOCK_SPACING, COLORS } from './grid'

const CELL_SIZE = BLOCK_SIZE + BLOCK_SPACING

export interface TetrominoType {
  color: number;
  size: number;
  shapes: number[][][];
}

export enum TetrominoAngle {
  Deg0 = 0,
  Deg90,
  Deg180,
  Deg270,
}

export const TYPES: Record<string, TetrominoType> = {
  T: {
    color: 0,
    size: 3,
    shapes: [[
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ], [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ], [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ], [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ]],
  },
  J: {
    color: 1,
    size: 3,
    shapes: [[
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ], [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ], [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ], [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ]],
  },
  Z: {
    color: 2,
    size: 3,
    shapes: [[
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ], [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ]],
  },
  O: {
    color: 0,
    size: 2,
    shapes: [[
      [1, 1],
      [1, 1],
    ]],
  },
  S: {
    color: 1,
    size: 3,
    shapes: [[
      [0, 0, 0],
      [0, 1, 1],
      [1, 1, 0],
    ], [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ]],
  },
  L: {
    color: 2,
    size: 3,
    shapes: [[
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ], [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ], [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ], [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ]],
  },
  I: {
    color: 0,
    size: 4,
    shapes: [[
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ], [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ]],
  },
}

export default class Tetromino extends Pixi.Container {
  protected _type: TetrominoType
  protected _angle = TetrominoAngle.Deg0

  public constructor(type: TetrominoType | string) {
    super()

    this._type = typeof(type) === 'string' ? TYPES[type] : type
  }

  public static getRandom(): Tetromino {
    const types = ['I', 'O', 'T', 'J', 'L', 'S', 'Z']
    const type = types[Math.floor(Math.random() * types.length)]
    return new Tetromino(type)
  }

  public update(): void {
    this.removeChildren()

    const shape = this.getShape()
    const blockColor = COLORS[this._type.color]

    shape.forEach((row: number[], y: number): void => {
      row.forEach((hasBlock: number, x: number): void => {
        if (hasBlock === 0) return

        // Make a block graphic
        // TODO: Use an image instead
        const block = new Pixi.Graphics()
        block.beginFill(blockColor)
        block.drawRect(x * CELL_SIZE, y * CELL_SIZE, BLOCK_SIZE, BLOCK_SIZE)

        this.addChild(block)
      })
    })
  }

  public getSize(): number {
    return this._type.size
  }

  public getShape(angle = this._angle): number[][] {
    const { shapes } = this._type
    return shapes[angle % shapes.length]
  }

  public getColorIndex(): number {
    return this._type.color
  }

  public getAngle(): TetrominoAngle {
    return this._angle
  }

  public setAngle(angle: TetrominoAngle): void {
    this._angle = angle
  }
}
