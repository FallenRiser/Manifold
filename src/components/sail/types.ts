// One recorded race: the boat's state at every second, index 0 = the start.
export type Race = {
  label: string;
  end: "arrived" | "out" | "clock";
  tacks: number;
  x: number[];
  y: number[];
  h: number[];
  u: number[];
  /** table cell the agent saw before each decision (only where a page needs it) */
  cells?: number[];
  /** extra facts some pages attach, e.g. the held-out race index or a checkpoint */
  race?: number;
  practice?: number;
  finishes?: number;
};
