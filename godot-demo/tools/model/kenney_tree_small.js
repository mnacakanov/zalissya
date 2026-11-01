// Kenney's "tree-small" (CC0, cc0/kenney/): a sample of the ready-made-pack
// approach to the forest.
import { gltfModel } from "./gltfModel.js";
const m = gltfModel("./cc0/kenney/tree-small.gltf", 5.5);
export const SIZE = m.SIZE, NO_INTERIOR = true, build = m.build, plan = m.plan;
