// One verba from the tree generator (trees.js), seed 2: a sample for the forest.
import { treeModel } from "./trees.js";
const m = treeModel("verba", 2, 0.6);
export const SIZE = m.SIZE, NO_INTERIOR = true, build = m.build, plan = m.plan;
