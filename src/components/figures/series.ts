// One named, coloured sequence of numbers. Shared by every multi-series figure
// in src/components/figures — LayerTrace, LearningCurve and the track-local
// data modules that feed them.
export type Series = {
  label: string;
  values: number[];
  color: string;
  dash?: string;
  note?: string;
};
