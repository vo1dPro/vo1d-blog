import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "./index.css";

gsap.registerPlugin(ScrollTrigger);

const MODEL_URL = "/models/ghost-protocol-glock.glb";

const GLOCK_VIEW = {
  scale: 3.5,
  position: new THREE.Vector3(0.08, -0.18, 0),
  // The source model points toward the camera by default; this turns it
  // toward the phone so the silhouette mirrors the left-side controller.
  rotation: new THREE.Euler(
    THREE.MathUtils.degToRad(-6),
    THREE.MathUtils.degToRad(-92),
    THREE.MathUtils.degToRad(6),
  ),
  cameraZ: 5.45,
};

const GLOCK_ENTRANCE = {
  x: 260,
  y: 88,
  scale: 0.62,
  rotation: 18,
  blur: 16,
  shadowX: 64,
};

// Glock-only lighting. Tune these values without changing the Xbox controller.
const GLOCK_LIGHTING = {
  toneMappingExposure: 1.15,
  ambient: {
    color: 0x2a050d,
    intensity: 0.48,
  },
  hemisphere: {
    skyColor: 0xffc5ce,
    groundColor: 0x07020a,
    intensity: 1.5,
  },
  key: {
    color: 0xfff4ea,
    intensity: 6.2,
    position: new THREE.Vector3(-3.6, 4.8, 5.7),
  },
  fill: {
    color: 0x9eb4ff,
    intensity: 2.5,
    position: new THREE.Vector3(2, 1.5, 4.8),
  },
  rim: {
    color: 0xff1e4d,
    intensity: 5.3,
    position: new THREE.Vector3(4.5, 2.8, 1.8),
  },
};

const BASE_CAMERA_FOV = 28;
const MODEL_PIXEL_LOCK_HEIGHT = 320;

const POINTER_ROTATION_LIMIT = {
  pitch: THREE.MathUtils.degToRad(190),
  yaw: THREE.MathUtils.degToRad(190),
};

const DRAG_ROTATION_SPEED = 0.7;

interface GlockModelProps {
  className?: string;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry.dispose();
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose();
      });
      material.dispose();
    });
  });
}

export default function GlockModel({ className = "" }: GlockModelProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const interactionRef = useRef({
    currentPitch: 0,
    currentYaw: 0,
    targetPitch: 0,
    targetYaw: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    startPitch: 0,
    startYaw: 0,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const ctx = gsap.context(() => {
      gsap.set(root, {
        autoAlpha: prefersReducedMotion ? 1 : 0,
        x: prefersReducedMotion ? 0 : GLOCK_ENTRANCE.x,
        y: prefersReducedMotion ? 0 : GLOCK_ENTRANCE.y,
        scale: prefersReducedMotion ? 1 : GLOCK_ENTRANCE.scale,
        rotation: prefersReducedMotion ? 0 : GLOCK_ENTRANCE.rotation,
        filter: prefersReducedMotion
          ? "blur(0px)"
          : `blur(${GLOCK_ENTRANCE.blur}px)`,
      });

      if (prefersReducedMotion) return;

      gsap
        .timeline({
          scrollTrigger: {
            trigger: root.closest(".game-showcase") ?? root,
            start: "top 35%",
            end: "bottom 45%",
            toggleActions: "play reverse play reverse",
          },
          defaults: {
            ease: "expo.out",
          },
        })
        .to(root, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          filter: "blur(0px)",
          duration: 1.35,
        })
        .fromTo(
          ".glock-model-shadow",
          {
            autoAlpha: 0,
            scale: 0.45,
            x: GLOCK_ENTRANCE.shadowX,
          },
          { autoAlpha: 0.72, scale: 1, x: 0, duration: 1.05 },
          "<0.16",
        );
    }, root);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const container = root;

    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(BASE_CAMERA_FOV, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    const glockPivot = new THREE.Group();

    camera.position.set(0, 0, GLOCK_VIEW.cameraZ);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = GLOCK_LIGHTING.toneMappingExposure;

    scene.add(glockPivot);
    scene.add(
      new THREE.AmbientLight(
        GLOCK_LIGHTING.ambient.color,
        GLOCK_LIGHTING.ambient.intensity,
      ),
    );

    const hemisphereLight = new THREE.HemisphereLight(
      GLOCK_LIGHTING.hemisphere.skyColor,
      GLOCK_LIGHTING.hemisphere.groundColor,
      GLOCK_LIGHTING.hemisphere.intensity,
    );
    scene.add(hemisphereLight);

    const keyLight = new THREE.DirectionalLight(
      GLOCK_LIGHTING.key.color,
      GLOCK_LIGHTING.key.intensity,
    );
    keyLight.position.copy(GLOCK_LIGHTING.key.position);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(
      GLOCK_LIGHTING.fill.color,
      GLOCK_LIGHTING.fill.intensity,
    );
    fillLight.position.copy(GLOCK_LIGHTING.fill.position);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(
      GLOCK_LIGHTING.rim.color,
      GLOCK_LIGHTING.rim.intensity,
    );
    rimLight.position.copy(GLOCK_LIGHTING.rim.position);
    scene.add(rimLight);

    function resizeRenderer() {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = THREE.MathUtils.radToDeg(
        2 *
          Math.atan(
            Math.tan(THREE.MathUtils.degToRad(BASE_CAMERA_FOV) / 2) *
              (height / MODEL_PIXEL_LOCK_HEIGHT),
          ),
      );
      camera.updateProjectionMatrix();
    }

    const resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(container);
    resizeRenderer();

    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene);
          return;
        }

        const modelGroup = new THREE.Group();
        modelGroup.add(gltf.scene);

        const box = new THREE.Box3().setFromObject(modelGroup);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z) || 1;

        // Center the complete source hierarchy before applying the display pose.
        // The GLB root has its own rotation, so adjusting the child directly
        // would offset the gun further as its display scale increases.
        modelGroup.position.sub(center);
        glockPivot.scale.setScalar(GLOCK_VIEW.scale / maxDimension);
        glockPivot.position.copy(GLOCK_VIEW.position);
        glockPivot.rotation.copy(GLOCK_VIEW.rotation);
        glockPivot.add(modelGroup);
        container.classList.add("is-loaded");
      },
      undefined,
      () => {
        container.classList.add("has-model-error");
      },
    );

    function render() {
      const elapsed = clock.getElapsedTime();
      const interaction = interactionRef.current;

      interaction.currentPitch +=
        (interaction.targetPitch - interaction.currentPitch) * 0.085;
      interaction.currentYaw +=
        (interaction.targetYaw - interaction.currentYaw) * 0.085;

      glockPivot.rotation.x =
        GLOCK_VIEW.rotation.x +
        interaction.currentPitch +
        Math.sin(elapsed * 1.2) * 0.15;
      glockPivot.rotation.y =
        GLOCK_VIEW.rotation.y +
        interaction.currentYaw +
        Math.sin(elapsed * 0.78) * 0.15;
      glockPivot.rotation.z =
        GLOCK_VIEW.rotation.z -
        interaction.currentYaw * 0.08 +
        Math.sin(elapsed * 1.05) * 0.1;
      glockPivot.position.y =
        GLOCK_VIEW.position.y + Math.sin(elapsed * 1.18) * 0.15;

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    }

    render();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      disposeObject(scene);
      renderer.dispose();
    };
  }, []);

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const root = rootRef.current;
    const interaction = interactionRef.current;
    if (!root || !interaction.isDragging) return;

    const bounds = root.getBoundingClientRect();
    const x = (event.clientX - interaction.startX) / bounds.width;
    const y = (event.clientY - interaction.startY) / bounds.height;
    const nextYaw = THREE.MathUtils.clamp(
      interaction.startYaw +
        x * POINTER_ROTATION_LIMIT.yaw * DRAG_ROTATION_SPEED,
      -POINTER_ROTATION_LIMIT.yaw,
      POINTER_ROTATION_LIMIT.yaw,
    );
    const nextPitch = THREE.MathUtils.clamp(
      interaction.startPitch +
        y * POINTER_ROTATION_LIMIT.pitch * DRAG_ROTATION_SPEED,
      -POINTER_ROTATION_LIMIT.pitch,
      POINTER_ROTATION_LIMIT.pitch,
    );

    interaction.targetYaw = nextYaw;
    interaction.targetPitch = nextPitch;
  }

  function resetPointerRotation() {
    const interaction = interactionRef.current;
    interaction.isDragging = false;
    interaction.targetPitch = 0;
    interaction.targetYaw = 0;
    rootRef.current?.classList.remove("is-rotating");
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const interaction = interactionRef.current;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-rotating");
    interaction.isDragging = true;
    interaction.startX = event.clientX;
    interaction.startY = event.clientY;
    interaction.startPitch = interaction.targetPitch;
    interaction.startYaw = interaction.targetYaw;
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resetPointerRotation();
  }

  function handlePointerLeave() {
    if (!interactionRef.current.isDragging) resetPointerRotation();
  }

  return (
    <div
      ref={rootRef}
      className={`glock-model-stage ${className}`}
      aria-label="Interactive Ghost Protocol Glock model"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="glock-model-shadow" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="glock-model-canvas"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
