// A ready-made glTF model (cc0/) as a model for render.cjs: loaded, stood on
// the ground at the origin, scaled to a real height in metres. The footprint
// is its trunk.
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

export function gltfModel(file, height, trunk = 0.6) {
  return {
    SIZE: { x: trunk, z: trunk },
    NO_INTERIOR: true,
    build: async (THREE) => {
      // (some packs ship Draco-compressed meshes: three's own decoder reads them)
      const draco = new DRACOLoader().setDecoderPath("./node_modules/three/examples/jsm/libs/draco/gltf/");
      const gl = await new GLTFLoader().setDRACOLoader(draco).loadAsync(file);
      const m = gl.scene;
      const box = new THREE.Box3().setFromObject(m);
      const s = height / (box.max.y - box.min.y);
      m.scale.setScalar(s);
      const b2 = new THREE.Box3().setFromObject(m);
      const c = b2.getCenter(new THREE.Vector3());
      m.position.set(trunk / 2 - c.x, -b2.min.y, -trunk / 2 - c.z);
      const g = new THREE.Group();
      g.add(m);
      g.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true; o.receiveShadow = true;
          // (their own colours, matte: the same light as ours)
          o.material = new THREE.MeshStandardMaterial({ color: o.material.color, roughness: 1, metalness: 0, flatShading: true });
        }
      });
      return g;
    },
    plan: () => ({ footprint: [[0, 0, 0], [trunk, 0, 0], [trunk, 0, -trunk]], partitions: [] }),
  };
}
