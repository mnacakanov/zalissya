// One dub from the tree generator (trees.js), seed 3: a sample for the forest.
import { treeModel } from "./trees.js";
const m = treeModel("dub", 3, 0.6);
export const SIZE = m.SIZE, NO_INTERIOR = true, build = m.build, plan = m.plan;
