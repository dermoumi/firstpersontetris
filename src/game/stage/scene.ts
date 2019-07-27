import SceneBase from 'game/scene/base'
import GameApp from 'game/app'
import Tetromino from './tetromino'
import StageGrid, { WIDTH as GRID_WIDTH, BLOCK_SIZE, BLOCK_SPACING } from './grid'
import Input from 'game/input'

const CELL_SIZE = BLOCK_SIZE + BLOCK_SPACING

enum GameMode {
  Normal,
  DarkRoom,
  ExistentialCrisis,
}

enum StageState {
  Paused,
  Idle,
  RotationAnimation,
  LineFlash,
  LineAnimation,
}

export default class StageScene extends SceneBase {
  private _grid = new StageGrid
  private _state = StageState.Idle
  private _stepTime = 0
  private _stepDuration = 1
  private _animationTime = 0

  private _firstPersonMode = true
  private _gameMode = GameMode.Normal // TODO: Switch this to Normal, eventually

  private _currentTetromino: Tetromino
  private _nextTetromino: Tetromino
  private _playerX = 0
  private _playerY = 0

  private _hasWallKick = true
  private _hasLockDelay = false

  public constructor(app: GameApp) {
    super(app)

    this.stage.addChild(this._grid)

    this._nextTetromino = this._getNextTetromino()
    this._currentTetromino = this._spawnTetromino()
  }

  public onUpdate(frameTime: number): void {
    if (this._state === StageState.Paused) {
      return
    }

    if (this._state === StageState.Idle) {
      this._updateIdle(frameTime)
    }

    if (this._state === StageState.RotationAnimation) {
      this._updateRotation(frameTime)
    }

    if (this._state === StageState.LineAnimation) {
      this._updateLineAnimation(frameTime)
    }
  }

  public onProcessInput(input: Input): void {
    if (input.isPressed('left', true)) {
      this._moveLeft()
    } else if (input.isPressed('right', true)) {
      this._moveRight()
    } else if (input.isPressed('down', true)) {
      this._moveDown()
      this._stepTime = 0
    }

    if (input.isPressed('rotate', true)) {
      this._rotate()
    }
  }

  private _getNextTetromino(): Tetromino {
    const tetromino = Tetromino.getRandom()
    tetromino.update()

    if (this._gameMode === GameMode.DarkRoom) {
      tetromino.visible = false
    } else {
      tetromino.position.x = (2 + GRID_WIDTH) * CELL_SIZE
      tetromino.position.y = 2 * CELL_SIZE
    }

    this.stage.addChild(tetromino)
    return tetromino
  }

  private _spawnTetromino(): Tetromino {
    if (this._currentTetromino) {
      this.stage.removeChild(this._currentTetromino)
    }

    const tetromino = this._nextTetromino
    tetromino.visible = true

    this._nextTetromino = this._getNextTetromino()

    this._playerX = Math.floor(GRID_WIDTH / 2 - tetromino.getSize() / 2)
    this._playerY = 0

    tetromino.position.x = CELL_SIZE * this._playerX
    tetromino.position.y = CELL_SIZE * this._playerY

    // TODO: Check collision and gameover

    return tetromino
  }

  private _updateIdle(frameTime: number): void {
    this._stepTime += frameTime
    if (this._stepTime > this._stepDuration) {
      this._stepTime = this._stepTime % this._stepDuration
      this._performStep()
    }
  }

  private _performStep(): void {
    this._moveDown()
  }

  private _updateRotation(frameTime: number): void {
    this._animationTime += frameTime
  }

  private _updateLineAnimation(frameTime: number): void {
    this._animationTime += frameTime
  }

  private _moveLeft(): void {
    if (this._grid.collidesWith(this._currentTetromino, this._playerX - 1, this._playerY)) {
      // TODO: Play collision sound
      console.debug('THUD!')
    } else {
      this._playerX--
      this._currentTetromino.position.x = this._playerX * CELL_SIZE
    }
  }

  private _moveRight(): void {
    if (this._grid.collidesWith(this._currentTetromino, this._playerX + 1, this._playerY)) {
      // TODO: Play collision sound
      console.debug('THUD!')
    } else {
      this._playerX++
      this._currentTetromino.position.x = this._playerX * CELL_SIZE
    }
  }

  private _moveDown(): void {
    if (this._grid.collidesWith(this._currentTetromino, this._playerX, this._playerY + 1)) {
      this._uniteTetromino()
    } else {
      this._playerY++
      this._currentTetromino.position.y = this._playerY * CELL_SIZE
    }
  }

  private _rotate(): void {
    const nextAngle = (this._currentTetromino.getAngle() + 1) % 4

    let playerX = this._playerX
    let collides = this._grid.collidesWith(this._currentTetromino, playerX, this._playerY, nextAngle)
    const halfSize = Math.floor(this._currentTetromino.getSize() / 2)

    // Check if it still collides if moved n blocks to the left or n blocks to the right
    if (collides && this._hasWallKick) {
      let shiftedPlayerX
      for (let i = 1; i <= halfSize; i++) {
        // Test from the left
        shiftedPlayerX = this._playerX - i
        collides = this._grid.collidesWith(this._currentTetromino, shiftedPlayerX, this._playerY, nextAngle)
        if (!collides) {
          playerX = shiftedPlayerX
          break
        }

        // Test from the right
        shiftedPlayerX = this._playerX + i
        collides = this._grid.collidesWith(this._currentTetromino, shiftedPlayerX, this._playerY, nextAngle)
        if (!collides) {
          playerX = shiftedPlayerX
          break
        }
      }
    }

    // Allow blocks to rotate even if there's not enough space below them by shifting them a bit upward
    // if (collides) {
    //   for (let i = 0; i < halfSize; ++i) {
    //     const playerY = this._playerY - i
    //     collides = this._grid.collidesWith(this._currentTetromino, this._playerX, playerY, nextAngle)
    //     if (!collides) {
    //       this._playerY = playerY
    //       break
    //     }
    //   }
    // }

    if (collides) {
      // TODO: Play collision sound
      console.debug('THUD!')
    } else {
      this._playerX = playerX
      this._currentTetromino.position.x = this._playerX * CELL_SIZE
      this._currentTetromino.setAngle(nextAngle)
      this._currentTetromino.update()

      // Reset step time when rotating if lock delay is on
      if (this._hasLockDelay && this._grid.collidesWith(this._currentTetromino, this._playerX, this._playerY + 1)) {
        this._stepTime = 0
      }
    }
  }

  private _uniteTetromino(): void {
    this._grid.unite(this._currentTetromino, this._playerX, this._playerY)
    this._grid.update()
    this._currentTetromino = this._spawnTetromino()
  }
}
