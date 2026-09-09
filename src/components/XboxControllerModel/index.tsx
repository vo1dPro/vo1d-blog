import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { animateWhileVisible } from "@/lib/visible-animation";
import "./index.css";

gsap.registerPlugin(ScrollTrigger);

const MODEL_URL = "/models/xbox.glb";

// Adjust the default controller pose here. rotation values use degrees via degToRad().
const CONTROLLER_VIEW = {
  scale: 3.4,
  position: new THREE.Vector3(0.12, -0.12, 0),
  rotation: new THREE.Euler(
    THREE.MathUtils.degToRad(4),
    THREE.MathUtils.degToRad(16),
    THREE.MathUtils.degToRad(4),
  ),
  cameraZ: 5.45,
};

const BASE_CAMERA_FOV = 28;
const MODEL_PIXEL_LOCK_HEIGHT = 320;

const POINTER_ROTATION_LIMIT = {
  pitch: THREE.MathUtils.degToRad(190),
  yaw: THREE.MathUtils.degToRad(190),
};

const DRAG_ROTATION_SPEED = 0.7;

const DRAG_DIRECTION = {
  yaw: 1,
  pitch: 1,
};

interface XboxControllerModelProps {
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

export default function XboxControllerModel({
  className = "",
}: XboxControllerModelProps) {
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
        x: prefersReducedMotion ? 0 : -260,
        y: prefersReducedMotion ? 0 : 88,
        scale: prefersReducedMotion ? 1 : 0.62,
        rotation: prefersReducedMotion ? 0 : -18,
        filter: prefersReducedMotion ? "blur(0px)" : "blur(16px)",
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
          ".xbox-controller-shadow",
          {
            autoAlpha: 0,
            scale: 0.45,
            x: -64,
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

    let disposed = false;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(BASE_CAMERA_FOV, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    const controllerPivot = new THREE.Group();

    camera.position.set(0, 0, CONTROLLER_VIEW.cameraZ);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    scene.add(controllerPivot);
    scene.add(new THREE.AmbientLight(0xffffff, 1.65));

    const hemiLight = new THREE.HemisphereLight(0xf7f9ff, 0x26314a, 2.35);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.8);
    keyLight.position.set(-2.8, 4.6, 5.4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdceeff, 2.25);
    fillLight.position.set(1.8, 1.2, 4.8);
    scene.add(fillLight);

    const edgeLight = new THREE.DirectionalLight(0x7eb6ff, 2.1);
    edgeLight.position.set(4.3, 2.2, 3.2);
    scene.add(edgeLight);

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

        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z) || 1;

        model.position.sub(center);
        controllerPivot.scale.setScalar(CONTROLLER_VIEW.scale / maxDimension);
        controllerPivot.position.copy(CONTROLLER_VIEW.position);
        controllerPivot.rotation.copy(CONTROLLER_VIEW.rotation);
        controllerPivot.add(model);
        container.classList.add("is-loaded");
      },
      undefined,
      () => {
        container.classList.add("has-model-error");
      },
    );

    function render(elapsed: number) {
      const interaction = interactionRef.current;

      interaction.currentPitch +=
        (interaction.targetPitch - interaction.currentPitch) * 0.085;
      interaction.currentYaw +=
        (interaction.targetYaw - interaction.currentYaw) * 0.085;

      controllerPivot.rotation.x =
        CONTROLLER_VIEW.rotation.x +
        interaction.currentPitch +
        Math.sin(elapsed * 1.2) * 0.15;
      controllerPivot.rotation.y =
        CONTROLLER_VIEW.rotation.y +
        interaction.currentYaw +
        Math.sin(elapsed * 0.78) * 0.15;
      controllerPivot.rotation.z =
        CONTROLLER_VIEW.rotation.z -
        interaction.currentYaw * 0.08 +
        Math.sin(elapsed * 1.05) * 0.1;
      controllerPivot.position.y =
        CONTROLLER_VIEW.position.y + Math.sin(elapsed * 1.18) * 0.15;

      renderer.render(scene, camera);

    }

    const stopAnimation = animateWhileVisible(container.closest(".game-showcase") ?? container, render);

    return () => {
      disposed = true;
      stopAnimation();
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
        x *
          POINTER_ROTATION_LIMIT.yaw *
          DRAG_ROTATION_SPEED *
          DRAG_DIRECTION.yaw,
      -POINTER_ROTATION_LIMIT.yaw,
      POINTER_ROTATION_LIMIT.yaw,
    );
    const nextPitch = THREE.MathUtils.clamp(
      interaction.startPitch +
        y *
          POINTER_ROTATION_LIMIT.pitch *
          DRAG_ROTATION_SPEED *
          DRAG_DIRECTION.pitch,
      -POINTER_ROTATION_LIMIT.pitch,
      POINTER_ROTATION_LIMIT.pitch,
    );

    root.style.setProperty(
      "--controller-pointer-x",
      (nextYaw / POINTER_ROTATION_LIMIT.yaw).toFixed(3),
    );
    root.style.setProperty(
      "--controller-pointer-y",
      (nextPitch / POINTER_ROTATION_LIMIT.pitch).toFixed(3),
    );
    interaction.targetYaw = nextYaw;
    interaction.targetPitch = nextPitch;
  }

  function resetPointerRotation() {
    const interaction = interactionRef.current;
    interaction.isDragging = false;
    interaction.targetPitch = 0;
    interaction.targetYaw = 0;
    rootRef.current?.style.setProperty("--controller-pointer-x", "0");
    rootRef.current?.style.setProperty("--controller-pointer-y", "0");
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
      className={`xbox-controller-stage ${className}`}
      aria-label="Interactive Xbox controller model"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="xbox-controller-shadow" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="xbox-controller-canvas"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
