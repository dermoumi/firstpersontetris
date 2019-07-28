import * as Pixi from 'pixi.js'
import Tetromino, { TetrominoAngle } from './tetromino'
import Block, { BlockType, BLOCK_SIZE, BLOCK_SPACING } from './block'

export const CELL_SIZE = BLOCK_SIZE + BLOCK_SPACING

export const WIDTH = 10
export const HEIGHT = 20

export interface CompleteRow {
  row: number;
  blocks: number[];
}

export default class StageGrid extends Pixi.Container {
  private _data: number[][]
  private _colors!: [number, number]

  public constructor() {
    super()

    this._data = new Array(HEIGHT).fill([]).map((): number[] => new Array(WIDTH).fill(0))
  }

  public setColors(color1: number, color2: number, update = true): void {
    this._colors = [color1, color2]
    if (update) {
      this.update()
    }
  }

  public update(): void {
    this.removeChildren()

    this._data.forEach((row: number[], y: number): void => {
      row.forEach((colorIndex: number, x: number): void => {
        // Don't do anything if cell is empty
        if (colorIndex === 0) return

        // Make a block graphic
        const color = this._colors[(colorIndex - 1) % 2]
        const type = colorIndex == 1 ? BlockType.Block1 : BlockType.Block2
        const block = new Block(color, type)
        block.position.x = x * CELL_SIZE
        block.position.y = y * CELL_SIZE

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

  public unite(tetromino: Tetromino, gridX: number, gridY: number): CompleteRow[] {
    const shape = tetromino.getShape()
    const color = tetromino.getColorIndex()
    const completeRows: CompleteRow[] = []

    shape.forEach((row: number[], blockY: number): void => {
      const y = gridY + blockY
      let rowDirty = false

      row.forEach((block: number, blockX: number): void => {
        if (block === 0) return

        rowDirty = true
        const x = gridX + blockX
        this._data[y][x] = color + 1
      })

      // Check if this row was completed
      if (rowDirty && !this._data[y].some((block): boolean => block === 0)) {
        completeRows.push({
          row: y,
          blocks: this._data[y],
        })

        this._data[y] = new Array(WIDTH).fill(0)
      }
    })

    return completeRows
  }

  public removeRow(row: number): void {
    for (let i = row - 1; i >= 0; --i) {
      this._data[i + 1] = this._data[i]
    }

    this._data[0] = new Array(WIDTH).fill(0)
  }
}
