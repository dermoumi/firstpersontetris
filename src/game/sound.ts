import * as Pixi from 'pixi.js'
import sound from 'pixi-sound'
import GameApp from './app'

export default class Sound {
  private _music?: sound.Sound
  private _musicFast?: sound.Sound
  private _sfxEnabled = true

  public setMusic(urlSlow: string, urlFast: string, options: Pixi.sound.Options = {}): void {
    this._music = sound.Sound.from({ ...options, url: urlSlow })
    this._musicFast = sound.Sound.from({ ...options, url: urlFast })
  }

  public playSlowMusic(): void {
    if (!this._music) return
    this._music.play()
  }

  public playFastMusic(): void {
    if (!this._musicFast) return
    this._musicFast.play()
  }

  public stopMusic(): void {
    this._music && this._music.stop()
    this._musicFast && this._musicFast.stop()
  }

  public setSfxEnabled(enabled: boolean): void {
    this._sfxEnabled = enabled
  }

  public isSfxEnabled(): boolean {
    return this._sfxEnabled
  }

  public playSfx(name: string): void {
    if (!this._sfxEnabled) return
    GameApp.resources[`sfx_${name}`].sound.play()
  }
}
