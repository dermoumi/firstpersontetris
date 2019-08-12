import 'pixi-sound'
import GameApp from './app'

export default class Sound {
  private _music?: HTMLAudioElement
  private _musicFast?: HTMLAudioElement
  private _sfxEnabled = true

  public setMusic(urlSlow: string, urlFast: string): void {
    this.stopMusic()

    this._music = new Audio(urlSlow)
    this._music.loop = true
    this._music.volume = 0.5

    this._musicFast = new Audio(urlFast)
    this._musicFast.loop = true
    this._musicFast.volume = 0.5
  }

  public removeMusic(): void {
    this.stopMusic()

    this._music = undefined
    this._musicFast = undefined
  }

  public playSlowMusic(): void {
    if (!this._music) return
    const promise = this._music.play()
    if (promise !== null) {
      promise.catch((): void => {})
    }
  }

  public playFastMusic(): void {
    if (!this._musicFast) return
    this._musicFast.play()
  }

  public stopMusic(): void {
    if (this._music) {
      this._music.pause()
      this._music.currentTime = 0
    }

    if (this._musicFast) {
      this._musicFast.pause()
      this._musicFast.currentTime = 0
    }
  }

  public setSfxEnabled(enabled: boolean): void {
    this._sfxEnabled = enabled
  }

  public isSfxEnabled(): boolean {
    return this._sfxEnabled
  }

  public playSfx(name?: string, res: string = 'sfxSprites'): void {
    if (!this._sfxEnabled) return
    GameApp.resources[res].sound.play(name)
  }

  public isMusicPlaying(): boolean {
    if (this._music && !this._music.paused) {
      return true
    }

    if (this._musicFast && !this._musicFast.paused) {
      return true
    }

    return false
  }
}
