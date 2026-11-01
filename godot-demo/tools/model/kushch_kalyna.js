// One kalyna from the tree generator (trees.js), seed 4: a sample for the forest.
import { treeModel } from "./trees.js";
const m = treeModel("kalyna", 4, 0.9);
export const SIZE = m.SIZE, NO_INTERIOR = true, build = m.build, plan = m.plan;
