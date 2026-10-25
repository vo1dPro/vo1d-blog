declare module "three" {
  export const ACESFilmicToneMapping: unknown;
  export const SRGBColorSpace: unknown;

  export const MathUtils: {
    lerp(x: number, y: number, alpha: number): number;
    smoothstep(x: number, min: number, max: number): number;
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
    clone(): Vector3;
    lerp(vector: Vector3, alpha: number): this;
    addScaledVector(vector: Vector3, scale: number): this;
    transformDirection(matrix: Matrix4): this;
  }
  export class Matrix4 {}
  export class Quaternion { identity(): this; }
  export class Plane { constructor(normal: Vector3, constant: number); constant: number; }

  export class Euler {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    copy(euler: Euler): this;
    set(x: number, y: number, z: number): this;
  }

  export class Texture {
    dispose(): void;
  }

  export class BufferGeometry {
    dispose(): void;
  }
  export class CubicBezierCurve3 { constructor(a: Vector3, b: Vector3, c: Vector3, d: Vector3); arcLengthDivisions: number; }
  export class TubeGeometry extends BufferGeometry { constructor(curve: CubicBezierCurve3, segments: number, radius: number, radialSegments: number, closed: boolean); }
  export class MeshStandardMaterial extends Material { constructor(parameters: {color: number; roughness: number}); }

  export class Material {
    [key: string]: unknown;
    dispose(): void;
  }

  export class Object3D {
    name: string;
    parent: Object3D | null;
    quaternion: Quaternion;
    matrixWorld: Matrix4;
    clone(recursive?: boolean): this;
    getObjectByName(name: string): Object3D | undefined;
    updateMatrixWorld(force?: boolean): void;
    localToWorld(vector: Vector3): Vector3;
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
    add(...objects: Object3D[]): this;
    traverse(callback: (child: Object3D) => void): void;
  }

  export class Mesh extends Object3D {
    constructor(geometry: BufferGeometry, material: Material);
    geometry: BufferGeometry;
    material: Material | Material[];
  }

  export class Group extends Object3D {}

  export class Scene extends Object3D { environment: Texture; environmentIntensity: number; }
  export class OrthographicCamera extends Object3D {
    constructor(); left: number; right: number; top: number; bottom: number; near: number; far: number;
    updateProjectionMatrix(): void;
  }
  export class PMREMGenerator { constructor(renderer: WebGLRenderer); fromScene(scene: Scene, sigma: number): {texture: Texture; dispose(): void}; dispose(): void; }

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
    localClippingEnabled: boolean;
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
    render(scene: Scene, camera: PerspectiveCamera | OrthographicCamera): void;
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
    loadAsync(url: string): Promise<GLTF>;
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined,
      onError?: ((error: unknown) => void) | undefined,
    ): void;
  }
}
declare module "three/examples/jsm/environments/RoomEnvironment.js" {
  import { Scene } from 'three';
  export class RoomEnvironment extends Scene { dispose(): void; }
}
