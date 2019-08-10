// General game constants
export const MaxLocalPlayers = 1

// List of buttons used in the game (up to 32 max)
// Enumerated as powers of 2 to allow combining
export enum Buttons {
  Up     = 1 << 0,
  Left   = 1 << 1,
  Down   = 1 << 2,
  Right  = 1 << 3,
  Rotate = 1 << 4,
  Drop   = 1 << 5,
  Pause  = 1 << 6,
}

// List of axes used in the game
export enum Axis {
  LeftX,
  LeftY,
  RightX,
  RightY,
  TriggerL,
  TriggerR,
}

// Default keyboard key map
export function getDefaultKeyMap(_player: number, _level3Supported: boolean): KeyboardMap {
  return {
    keys: {
      ArrowUp: Buttons.Up,
      ArrowLeft: Buttons.Left,
      ArrowDown: Buttons.Down,
      ArrowRight: Buttons.Right,
      Space: Buttons.Rotate,
      Enter: Buttons.Drop,
      Escape: Buttons.Pause,
    },
    keyAxes: {
      [Buttons.Up]: {
        axis: Axis.LeftY,
        factor: -1,
        opposite: Buttons.Down,
      },
      [Buttons.Down]: {
        axis: Axis.LeftY,
        factor: 1,
        opposite: Buttons.Up,
      },
      [Buttons.Left]: {
        axis: Axis.LeftX,
        factor: -1,
        opposite: Buttons.Right,
      },
      [Buttons.Right]: {
        axis: Axis.LeftX,
        factor: 1,
        opposite: Buttons.Left,
      },
    },
  }
}

// Default gamepad button mapping
export function getDefaultGamepadMap(_player: number, _gamepad: Gamepad): GamepadMap {
  return {
    buttons: {
      [0]: Buttons.Rotate,
      [2]: Buttons.Drop,
      [9]: Buttons.Pause,
      [12]: Buttons.Up,
      [13]: Buttons.Down,
      [14]: Buttons.Left,
      [15]: Buttons.Right,
    },
    axes: {
      [0]: Axis.LeftX,
      [1]: Axis.LeftY,
      [2]: Axis.RightX,
      [3]: Axis.RightY,
    },
    axisButtons: [{
      axis: 0,
      button: Buttons.Left,
      negative: true,
      threshold: 0.35,
    }, {
      axis: 0,
      button: Buttons.Right,
      threshold: 0.35,
    }, {
      axis: 1,
      button: Buttons.Up,
      negative: true,
      threshold: 0.35,
    }, {
      axis: 1,
      button: Buttons.Down,
      threshold: 0.35,
    }],
    buttonAxes: [{
      button: 6,
      axis: Axis.TriggerL,
    }, {
      button: 7,
      axis: Axis.TriggerR,
    }],
  }
}

// Private declataions
export interface GamepadMap {
  buttons?: Record<number, Buttons>;
  axes?: Record<number, DirectMapping | AxisMapping>;
  axisButtons?: AxisToButtonMapping[];
  buttonAxes?: ButtonToAxisMapping[];
}

export interface KeyboardMap {
  keys: Record<string, Buttons>;
  keyAxes: Record<number, KeyToAxisMapping>;
}

type DirectMapping = Axis;

enum AxisRange {
  Full,     // Take the value as is
  Positive, // Only when the value is positive
  Negative, // Only when the value is negative
  Hat,      // Transalte Hat direction into X and Y axes
}

interface AxisMapping {
  target: Axis;      // The axe to translate into
  invert?: boolean;  // Invert value sign
  range?: AxisRange; // How to process the value
  targetY?: Axis;    // If range == Hat, set the axis for Y values
}

interface AxisToButtonMapping {
  axis: Axis;         // The axis to map into a button
  button: Buttons;    // Which button to map to
  threshold?: number; // The minimum value before this axe is counted
  negative?: boolean; // Whether to check on the negative side of the axis
}

interface ButtonToAxisMapping {
  button: number;  // The button to map into an axis
  axis: Axis;      // Which axis to map to
  factor?: number; // The factor of the value of the button to axis (e.g. -1 to invert)
}

interface KeyToAxisMapping {
  axis: Axis;         // Which axis to map the key to
  factor?: number;    // The factor of the value of the button to axis (e.g. -1 to invert)
  opposite?: Buttons; // The key that's the opposite
}
