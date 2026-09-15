// One recorded episode of the shipped wildfire world. Frames are 256-character maps, row by row:
// . grass  ^ forest  # rock  ~ lake  H village  * burning  x burnt. frames[t] is the map after step t.
export type FireEpisode = {
  label: string;
  seed: number;
  frames: string[];
  /** helicopter [row, col] at each frame */
  pos: [number, number][] | number[][];
  /** drops left in the bucket at each frame */
  water: number[];
  /** [direction the wind blows toward in radians (0 = toward the top row, clockwise), strength 0..1] */
  wind: number[][];
  /** steps at which a drop landed */
  drops: number[];
  end: "out" | "clock";
  village_damaged: number;
  burnt: number;
  put_out: number;
  steps: number;
};
