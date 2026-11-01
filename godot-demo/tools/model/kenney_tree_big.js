// Kenney's "tree-big" (CC0, cc0/kenney/): a sample of the ready-made-pack
// approach to the forest.
import { gltfModel } from "./gltfModel.js";
const m = gltfModel("./cc0/kenney/tree-big.gltf", 8);
export const SIZE = m.SIZE, NO_INTERIOR = true, build = m.build, plan = m.plan;
