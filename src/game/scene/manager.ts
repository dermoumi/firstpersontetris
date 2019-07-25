import GameApp from 'game/app'
import SceneBase from './base'

export type SceneConstructor = new (app: GameApp, userdata: Object) => SceneBase

export default class SceneManager {
  sceneStack: SceneBase[] = []
  currentScene: SceneBase | null = null
  app: GameApp
  isDirty = false // True whene scene stack changes during an update

  constructor(app: GameApp) {
    this.app = app
  }

  update(frameTime: number): boolean {
    // Trigger onLeave and onEnter events when there's a new scene
    if (this.sceneStack[0] !== this.currentScene) {
      if (this.currentScene) this.currentScene.onLeave()

      this.currentScene = this.sceneStack[0]
      this.currentScene.onEnter()
    }

    // Reset the dirty flag
    this.isDirty = false

    // Process the input of the current scene
    if (this.currentScene.isInputEnabled()) {
      this.currentScene.onProcessInput(this.app.input, frameTime)
      if (this.isDirty) return false
    }

    // Update all scenes until one of them returns 'false' or sceneStack changes
    this.sceneStack.some((scene) => {
      return scene.onUpdate(frameTime) === false || this.isDirty
    })

    return !this.isDirty
  }

  clear(): SceneManager {
    // Call onLeave on the current scene
    if (this.currentScene) {
      this.currentScene.onLeave()
      this.currentScene = null
    }

    // Call onDestry on all scenes of the current stack
    this.sceneStack.forEach((scene): void => {
      scene.onDestroy()
    })

    // Reset the current stack
    this.sceneStack = []
    this.isDirty = true

    return this
  }

  push(SceneClass: SceneConstructor, userdata: Object = {}): SceneManager {
    // Setup the new scene
    const newScene = new SceneClass(this.app, userdata)

    // Add the scene to the scene stack
    this.sceneStack.unshift(newScene)
    this.isDirty = true

    // Initial resize of the scene
    newScene._resize()

    return this;
  }

  switchTo(SceneClass: SceneConstructor, userdata: Object = {}): SceneManager {
    // Clear all the scenes the push the new one
    return this.clear().push(SceneClass, userdata)
  }

  pop(): SceneManager {
    // Don't do anything if there's no scene
    if (this.sceneStack.length === 0) return this

    // Call onLeave if the current scene is the last scene
    if (this.currentScene == this.sceneStack[0]) {
      this.currentScene.onLeave()
      this.currentScene = null
    }

    // Destroy the current scene
    this.sceneStack[0].onDestroy()
    this.sceneStack.shift()

    return this
  }

  updateScreenSize(width: number, height: number): SceneManager {
    this.sceneStack.forEach((scene) => {
      scene.onResize(width, height)
    })

    return this
  }
}
