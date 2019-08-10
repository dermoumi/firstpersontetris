import Player from './player'

export default interface Device {
  destroy(): void;
  setPlayer(player?: Player): void;
}
