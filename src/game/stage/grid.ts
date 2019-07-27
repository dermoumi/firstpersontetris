import * as Pixi from 'pixi.js'
import Tetromino, { TetrominoAngle } from './tetromino'

export const WIDTH = 10
export const HEIGHT = 20
export const BLOCK_SIZE = 16
export const BLOCK_SPACING = 1
export const COLORS = [
  0xFF0000,
  0x00FF00,
  0x0000FF,
  0xFFCC00,
  0xCCFF00,
  0xFF00CC,
  0x00CCFF,
]

export default class StageGrid extends Pixi.Container {
  private _data: number[][]

  public constructor() {
    super()

    this._data = new Array(HEIGHT).fill([]).map((): number[] => new Array(WIDTH).fill(0))
  }

  public update(): void {
    this.removeChildren()

    const blockSize = BLOCK_SIZE + BLOCK_SPACING

    this._data.forEach((row: number[], y: number): void => {
      row.forEach((colorIndex: number, x: number): void => {
        // Don't do anything if cell is empty
        if (colorIndex === 0) return

        // Make a block graphic
        // TODO: Use an image instead
        const block = new Pixi.Graphics()
        block.beginFill(COLORS[colorIndex - 1])
        block.drawRect(x * blockSize, y * blockSize, BLOCK_SIZE, BLOCK_SIZE)

        // Add the block to the container
        this.addChild(block)
      })
    })
  }

  public collidesWith(tetromino: Tetromino, gridX: number, gridY: number, angle?: TetrominoAngle): boolean {
    const shape = tetromino.getShape(angle)

    return shape.some((row: number[], blockY: number): boolean => {
      return row.some((block: number, blockX: number): boolean => {
        if (block === 0) return false

        const x = gridX + blockX
        if (x < 0 || x >= WIDTH) return true

        const y = gridY + blockY
        if (y < 0 || y >= HEIGHT) return true

        return this._data[y][x] !== 0
      })
    })
  }

  public unite(tetromino: Tetromino, gridX: number, gridY: number): void {
    const shape = tetromino.getShape()
    const color = tetromino.getColorIndex()

    shape.forEach((row: number[], blockY: number): void => {
      row.forEach((block: number, blockX: number): void => {
        if (block === 0) return

        const x = gridX + blockX
        const y = gridY + blockY

        this._data[y][x] = color + 1
      })
    })
  }
}
