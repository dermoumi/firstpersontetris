import * as Pixi from 'pixi.js'
import { CELL_SIZE, COLORS } from './grid'
import Block, { BlockType } from './block'

export interface TetrominoType {
  name: string;
  color: number;
  size: number;
  offset: number;
  center: [number, number][];
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
    name: 'T',
    color: 0,
    size: 3,
    offset: 1,
    center: [
      [1.5, 2],
      [1, 1.5],
      [1.5, 1],
      [2, 1.5],
    ],
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
    name: 'J',
    color: 1,
    size: 3,
    offset: 1,
    center: [
      [1.5, 2],
      [1, 1.5],
      [1.5, 1],
      [2, 1.5],
    ],
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
    name: 'Z',
    color: 2,
    size: 3,
    offset: 1,
    center: [
      [1.5, 2],
      [2, 1.5],
    ],
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
    name: 'O',
    color: 0,
    size: 2,
    offset: 0,
    center: [
      [1, 1],
    ],
    shapes: [[
      [1, 1],
      [1, 1],
    ]],
  },
  S: {
    name: 'S',
    color: 1,
    size: 3,
    offset: 1,
    center: [
      [1.5, 2],
      [2, 1.5],
    ],
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
    name: 'L',
    color: 2,
    size: 3,
    offset: 1,
    center: [
      [1.5, 2],
      [1, 1.5],
      [1.5, 1],
      [2, 1.5],
    ],
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
    name: 'I',
    color: 0,
    size: 4,
    offset: 2,
    center: [
      [2, 2.5],
      [2.5, 2],
    ],
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

    const [centerX, centerY] = this.getCenter()
    this.pivot.x = CELL_SIZE * centerX
    this.pivot.y = CELL_SIZE * centerY
  }

  public static getRandom(): Tetromino {
    const types = ['I', 'O', 'T', 'J', 'L', 'S', 'Z']
    const type = types[Math.floor(Math.random() * types.length)]
    return new Tetromino(type)
  }

  public update(): void {
    this.removeChildren()

    const shape = this.getShape()
    const colorIndex = this._type.color
    const blockColor = COLORS[colorIndex]
    const blockType = (colorIndex == 0) ? BlockType.Block1 : BlockType.Block2

    shape.forEach((row: number[], y: number): void => {
      row.forEach((hasBlock: number, x: number): void => {
        if (hasBlock === 0) return

        // Make a block graphic
        const block = new Block(blockColor, blockType)
        block.position.x = x * CELL_SIZE
        block.position.y = y * CELL_SIZE

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

    this.pivot.x = CELL_SIZE * this.getSize() / 2
    this.pivot.y = CELL_SIZE * this.getSize() / 2
  }

  public getOffset(): number {
    return this._type.offset
  }

  public getCenter(angle = this._angle): [number, number] {
    const { shapes, center } = this._type
    return center[angle % shapes.length]
  }

  public getName(): string {
    return this._type.name
  }

  public setX(x: number): void {
    this.position.x = x + this.pivot.x
  }

  public setY(y: number): void {
    this.position.y = y + this.pivot.y
  }
}
