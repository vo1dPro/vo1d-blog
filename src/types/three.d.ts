declare module "three" {
  export const ACESFilmicToneMapping: unknown;
  export const SRGBColorSpace: unknown;

  export const MathUtils: {
    clamp(value: number, min: number, max: number): number;
    degToRad(degrees: number): number;
    radToDeg(radians: number): number;
  };

  export class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    copy(vector: Vector3): this;
    set(x: number, y: number, z: number): this;
    setScalar(value: number): this;
    sub(vector: Vector3): this;
  }

  export class Euler {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    copy(euler: Euler): this;
  }

  export class Texture {
    dispose(): void;
  }

  export class BufferGeometry {
    dispose(): void;
  }

  export class Material {
    [key: string]: unknown;
    dispose(): void;
  }

  export class Object3D {
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
    add(...objects: Object3D[]): this;
    traverse(callback: (child: Object3D) => void): void;
  }

  export class Mesh extends Object3D {
    geometry: BufferGeometry;
    material: Material | Material[];
  }

  export class Group extends Object3D {}

  export class Scene extends Object3D {}

  export class Clock {
    getElapsedTime(): number;
  }

  export class PerspectiveCamera extends Object3D {
    aspect: number;
    fov: number;
    constructor(fov: number, aspect: number, near: number, far: number);
    updateProjectionMatrix(): void;
  }

  export class WebGLRenderer {
    outputColorSpace: unknown;
    toneMapping: unknown;
    toneMappingExposure: number;
    constructor(parameters: {
      canvas: HTMLCanvasElement;
      alpha?: boolean;
      antialias?: boolean;
      powerPreference?: "default" | "high-performance" | "low-power";
    });
    dispose(): void;
    render(scene: Scene, camera: PerspectiveCamera): void;
    setClearColor(color: number, alpha?: number): void;
    setPixelRatio(value: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
  }

  export class AmbientLight extends Object3D {
    constructor(color?: number | string, intensity?: number);
  }

  export class HemisphereLight extends Object3D {
    constructor(skyColor?: number | string, groundColor?: number | string, intensity?: number);
  }

  export class DirectionalLight extends Object3D {
    constructor(color?: number | string, intensity?: number);
  }

  export class Box3 {
    setFromObject(object: Object3D): this;
    getCenter(target: Vector3): Vector3;
    getSize(target: Vector3): Vector3;
  }
}

declare module "three/examples/jsm/loaders/GLTFLoader.js" {
  import type { Object3D } from "three";

  export interface GLTF {
    scene: Object3D;
  }

  export class GLTFLoader {
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined,
      onError?: ((error: unknown) => void) | undefined,
    ): void;
  }
}
