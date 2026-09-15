// Moved to the shared figures root: the planning track needs the same log-axis
// line chart (sample mean against the exact value, sweep cost against |S|), and
// a cross-track import from fa/ would be the wrong dependency. Re-exported here
// so the function-approximation pages keep their existing import path.
export { Curve } from "../Curve";
export type { CurveSeries } from "../Curve";
