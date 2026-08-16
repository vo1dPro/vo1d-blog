"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const ASCII_CHARSETS = {
  standard: " .,:;i1tfLCG08@",
  blocks: " ░▒▓█",
  binary: " 01",
  dots: " ·•●",
  minimal: " .:░▒",
  dense:
    " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  arrows: " ←↑→↓↔↕↖↗↘↙",
  stars: " ·✦✧★",
  hash: " -=#",
  pipes: " |/─\\│",
  braille: " ⠁⠃⠇⠏⠟⠿⡿⣿",
  circles: " ○◔◑◕●",
  squares: " ▢▣▤▥▦▧▨▩",
  hearts: " ♡♥",
  math: " +-×÷=≠≈∞",
} as const;

type CharsetPreset = keyof typeof ASCII_CHARSETS;

const isCharsetPreset = (value: string): value is CharsetPreset => {
  return value in ASCII_CHARSETS;
};

const resolveCharset = (charset: string): string => {
  if (isCharsetPreset(charset)) {
    return ASCII_CHARSETS[charset];
  }

  return charset;
};

const resolveCssColor = (
  color: string,
  element: HTMLElement | null,
  fallback: string,
): string => {
  if (!color) return fallback;
  if (!element || (!color.includes("var(") && !color.includes("color-mix("))) {
    return color;
  }

  const probe = document.createElement("span");
  probe.style.color = color;
  probe.style.position = "absolute";
  probe.style.pointerEvents = "none";
  probe.style.visibility = "hidden";
  element.appendChild(probe);
  const computedColor = getComputedStyle(probe).color;
  probe.remove();

  return computedColor || fallback;
};

type SourceBounds = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

const getSourceBounds = (
  image: HTMLImageElement,
  trimTransparent: boolean,
): SourceBounds => {
  const fullBounds = {
    sx: 0,
    sy: 0,
    sw: image.naturalWidth,
    sh: image.naturalHeight,
  };

  if (!trimTransparent) return fullBounds;

  const scanCanvas = document.createElement("canvas");
  scanCanvas.width = image.naturalWidth;
  scanCanvas.height = image.naturalHeight;
  const scanContext = scanCanvas.getContext("2d", { willReadFrequently: true });
  if (!scanContext) return fullBounds;

  scanContext.drawImage(image, 0, 0);

  try {
    const { data } = scanContext.getImageData(
      0,
      0,
      scanCanvas.width,
      scanCanvas.height,
    );
    let minX = scanCanvas.width;
    let minY = scanCanvas.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < scanCanvas.height; y += 1) {
      for (let x = 0; x < scanCanvas.width; x += 1) {
        if (data[(y * scanCanvas.width + x) * 4 + 3] <= 8) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) return fullBounds;

    return {
      sx: minX,
      sy: minY,
      sw: maxX - minX + 1,
      sh: maxY - minY + 1,
    };
  } catch {
    return fullBounds;
  }
};

export type AsciiArtProps = {
  src: string;
  /** Number of ASCII columns (character resolution). Higher = more detail. */
  resolution?: number;
  /** Charset preset name ("standard", "blocks", "binary", etc.) or custom character string. */
  charset?: CharsetPreset | string;
  /** Text color for the ASCII art (ignored if colored=true). */
  color?: string;
  /** Background color. */
  backgroundColor?: string;
  /** Convert to inverted colors (dark background, light text). */
  inverted?: boolean;
  /** Enable colored ASCII (uses image colors). */
  colored?: boolean;
  /** Enable animation on load. */
  animated?: boolean;
  /** Animation style. */
  animationStyle?: "fade" | "typewriter" | "matrix" | "none";
  /** Duration for fade animation in seconds. */
  animationDuration?: number;
  /** Font family for ASCII characters. */
  fontFamily?: string;
  /** Width-to-height ratio of each sampled character cell. Use 1 for a square grid. */
  cellAspectRatio?: number;
  /** Container className - use this to control size (for example, w-full h-64). */
  className?: string;
  /** Only animate when in view. */
  animateOnView?: boolean;
  /** How the image should fit within the ASCII grid. */
  objectFit?: "cover" | "contain" | "fill";
  /** Ignore fully transparent padding before sampling the source image. */
  trimTransparent?: boolean;
  /** Highlight nearby characters while the pointer moves over the canvas. */
  interactive?: boolean;
  /** CSS color used by the pointer highlight cluster. */
  interactionColor?: string;
  /** Character color drawn inside highlighted cells. */
  interactionTextColor?: string;
  /** Pointer highlight radius in CSS pixels. */
  interactionRadius?: number;
  /** Accessible description of the rendered image. */
  ariaLabel?: string;
};

const MATRIX_CHARSET = "ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ";
const INTERACTION_FRAME_INTERVAL = 1000 / 30;

type AsciiPixel = {
  char: string;
  r: number;
  g: number;
  b: number;
  a: number;
};

type ResolvedColors = {
  background: string;
  text: string;
  interaction: string;
  interactionText: string;
};

type PointerPosition = {
  x: number;
  y: number;
  active: boolean;
};

export const AsciiArt: React.FC<AsciiArtProps> = ({
  src,
  resolution = 80,
  charset = "standard",
  color = "#ffffff",
  backgroundColor = "transparent",
  inverted = false,
  colored = false,
  animated = true,
  animationStyle = "fade",
  animationDuration = 1,
  fontFamily = "monospace",
  cellAspectRatio = 0.55,
  className,
  animateOnView = true,
  objectFit = "cover",
  trimTransparent = false,
  interactive = false,
  interactionColor = "#2563eb",
  interactionTextColor = "#000000",
  interactionRadius = 76,
  ariaLabel = "ASCII art rendering of image",
}) => {
  const uniqueId = useId();
  const [asciiData, setAsciiData] = useState<AsciiPixel[][]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const interactionFrameRef = useRef<number | null>(null);
  const pointerRef = useRef<PointerPosition>({ x: 0, y: 0, active: false });
  const resolvedColorsRef = useRef<ResolvedColors>({
    background: "transparent",
    text: "#ffffff",
    interaction: "#2563eb",
    interactionText: "#000000",
  });
  const isInView = useInView(containerRef, { once: true, amount: 0.1 });

  const shouldStartAnimation = animated && animateOnView ? isInView : animated;
  const shouldShowStatic = !animated || animationStyle === "none";

  const resolvedCharset = resolveCharset(charset);
  const effectiveCharset = inverted
    ? resolvedCharset.split("").reverse().join("")
    : resolvedCharset;
  const interactionCharacters = effectiveCharset.replace(/\s/g, "") || "01";

  const defaultColor = inverted ? "#ffffff" : "#000000";
  const textColor = color || defaultColor;

  const refreshResolvedColors = useCallback(() => {
    const container = containerRef.current;
    resolvedColorsRef.current = {
      background: resolveCssColor(
        backgroundColor,
        container,
        "transparent",
      ),
      text: resolveCssColor(textColor, container, defaultColor),
      interaction: resolveCssColor(
        interactionColor,
        container,
        "#2563eb",
      ),
      interactionText: resolveCssColor(
        interactionTextColor,
        container,
        "#000000",
      ),
    };
  }, [
    backgroundColor,
    defaultColor,
    interactionColor,
    interactionTextColor,
    textColor,
  ]);

  useEffect(() => {
    let isCancelled = false;
    pointerRef.current.active = false;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = src;

    image.onload = () => {
      if (isCancelled) return;

      setError(null);
      setHasAnimated(false);

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        setError("Canvas context not available");
        return;
      }

      const source = getSourceBounds(image, trimTransparent);
      const imageAspect = source.sw / source.sh;
      const container = containerRef.current;
      const containerWidth = container?.clientWidth ?? 0;
      const containerHeight = container?.clientHeight ?? 0;
      const visualAspect =
        containerWidth > 0 && containerHeight > 0
          ? containerWidth / containerHeight
          : imageAspect;
      const safeCellAspectRatio = Math.max(0.1, cellAspectRatio);
      const columns = Math.max(8, Math.round(resolution));
      const rows = Math.max(
        2,
        Math.round((columns * safeCellAspectRatio) / visualAspect),
      );

      canvas.width = columns;
      canvas.height = rows;
      context.clearRect(0, 0, columns, rows);

      let sx = source.sx;
      let sy = source.sy;
      let sw = source.sw;
      let sh = source.sh;

      if (objectFit === "cover") {
        if (imageAspect > visualAspect) {
          sw = source.sh * visualAspect;
          sx = source.sx + (source.sw - sw) / 2;
        } else {
          sh = source.sw / visualAspect;
          sy = source.sy + (source.sh - sh) / 2;
        }
      }

      if (objectFit === "contain") {
        let drawWidth: number;
        let drawHeight: number;
        let drawX: number;
        let drawY: number;

        if (imageAspect > visualAspect) {
          drawWidth = columns;
          drawHeight = (columns / imageAspect) * safeCellAspectRatio;
          drawX = 0;
          drawY = (rows - drawHeight) / 2;
        } else {
          drawHeight = rows;
          drawWidth = (rows * imageAspect) / safeCellAspectRatio;
          drawX = (columns - drawWidth) / 2;
          drawY = 0;
        }

        context.drawImage(
          image,
          source.sx,
          source.sy,
          source.sw,
          source.sh,
          drawX,
          drawY,
          drawWidth,
          drawHeight,
        );
      } else {
        context.drawImage(
          image,
          sx,
          sy,
          sw,
          sh,
          0,
          0,
          columns,
          rows,
        );
      }

      let imageData: ImageData;
      try {
        imageData = context.getImageData(0, 0, columns, rows);
      } catch {
        setError("Unable to read image data (CORS issue)");
        return;
      }

      const { data } = imageData;
      const result: AsciiPixel[][] = [];

      for (let y = 0; y < rows; y += 1) {
        const row: AsciiPixel[] = [];
        for (let x = 0; x < columns; x += 1) {
          const index = (y * columns + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          const adjustedBrightness = a <= 8 ? 0 : brightness * (a / 255);
          const characterIndex = Math.floor(
            adjustedBrightness * (effectiveCharset.length - 1),
          );

          row.push({
            char: a <= 8 ? " " : effectiveCharset[characterIndex] || " ",
            r,
            g,
            b,
            a,
          });
        }
        result.push(row);
      }

      setAsciiData(result);
      setIsLoaded(true);
    };

    image.onerror = () => {
      if (isCancelled) return;
      setAsciiData([]);
      setIsLoaded(false);
      setError("Failed to load image");
    };

    return () => {
      isCancelled = true;
    };
  }, [
    src,
    resolution,
    effectiveCharset,
    objectFit,
    trimTransparent,
    cellAspectRatio,
  ]);

  const drawCanvas = useCallback(
    (progress = 1, matrixProgress?: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container || asciiData.length === 0) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      const devicePixelRatio = window.devicePixelRatio || 1;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      if (containerWidth === 0 || containerHeight === 0) return;

      const pixelWidth = Math.max(
        1,
        Math.round(containerWidth * devicePixelRatio),
      );
      const pixelHeight = Math.max(
        1,
        Math.round(containerHeight * devicePixelRatio),
      );

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerHeight}px`;
      }

      context.setTransform(
        devicePixelRatio,
        0,
        0,
        devicePixelRatio,
        0,
        0,
      );

      const colors = resolvedColorsRef.current;
      if (colors.background !== "transparent") {
        context.fillStyle = colors.background;
        context.fillRect(0, 0, containerWidth, containerHeight);
      } else {
        context.clearRect(0, 0, containerWidth, containerHeight);
      }

      const rows = asciiData.length;
      const columns = asciiData[0]?.length ?? 0;
      if (columns === 0) return;

      const characterWidth = containerWidth / columns;
      const characterHeight = containerHeight / rows;
      const fontSize = Math.min(
        characterWidth * 1.85,
        characterHeight * 1.18,
      );

      context.font = `${fontSize}px ${fontFamily}`;
      context.textBaseline = "top";
      context.textAlign = "center";

      const totalCharacters = rows * columns;
      const revealedCharacters = Math.floor(progress * totalCharacters);
      const pointer = pointerRef.current;
      const pointerColumn = pointer.x / characterWidth - 0.5;
      const pointerRow = pointer.y / characterHeight - 0.5;
      const clusterColumns = Math.max(3, interactionRadius / characterWidth);
      const clusterRows = Math.max(2, interactionRadius / characterHeight);
      let characterIndex = 0;

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
          const pixel = asciiData[y][x];
          const centerX = x * characterWidth + characterWidth / 2;
          const centerY = y * characterHeight;

          if (
            animationStyle === "typewriter" &&
            characterIndex >= revealedCharacters
          ) {
            characterIndex += 1;
            continue;
          }

          if (pixel.char === " ") {
            characterIndex += 1;
            continue;
          }

          let displayCharacter = pixel.char;
          let displayColor = colored
            ? `rgb(${pixel.r}, ${pixel.g}, ${pixel.b})`
            : colors.text;

          if (animationStyle === "matrix" && matrixProgress !== undefined) {
            const characterProgress = (x * 0.02 + y * 0.01) / 2;
            if (matrixProgress < characterProgress) {
              characterIndex += 1;
              continue;
            }

            if (matrixProgress < characterProgress + 0.15) {
              displayCharacter =
                MATRIX_CHARSET[
                  Math.floor(Math.random() * MATRIX_CHARSET.length)
                ];
              displayColor = "#00ff00";
              context.shadowColor = "#00ff00";
              context.shadowBlur = 5;
            } else {
              context.shadowBlur = 0;
            }
          }

          const fadeAlpha = animationStyle === "fade" ? progress : 1;
          const sourceAlpha = Math.max(0.18, pixel.a / 255);
          context.fillStyle = displayColor;
          context.globalAlpha = fadeAlpha * sourceAlpha;
          context.fillText(displayCharacter, centerX, centerY);

          if (interactive && pointer.active && progress >= 1) {
            const horizontalDistance = (x - pointerColumn) / clusterColumns;
            const verticalDistance = (y - pointerRow) / clusterRows;
            const clusterDistance = Math.hypot(
              horizontalDistance,
              verticalDistance,
            );
            const boundaryNoiseValue =
              Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) *
              43758.5453;
            const boundaryNoise =
              boundaryNoiseValue - Math.floor(boundaryNoiseValue);
            const densityNoiseValue =
              Math.sin((x + 7) * 39.3468 + (y + 11) * 11.1351) *
              96321.517;
            const densityNoise =
              densityNoiseValue - Math.floor(densityNoiseValue);
            const irregularDistance =
              clusterDistance + (boundaryNoise - 0.5) * 0.32;
            const innerStrength = Math.max(0, 1 - clusterDistance);
            const density = 0.38 + innerStrength * 0.56;
            const isHighlightedCell =
              irregularDistance < 1 && densityNoise < density;

            if (isHighlightedCell) {
              const interactionCharacter =
                interactionCharacters[
                  Math.floor(Math.random() * interactionCharacters.length)
                ] ?? displayCharacter;
              const leftPixel = Math.round(
                x * characterWidth * devicePixelRatio,
              );
              const topPixel = Math.round(
                y * characterHeight * devicePixelRatio,
              );
              const rightPixel = Math.max(
                leftPixel + 1,
                Math.round((x + 1) * characterWidth * devicePixelRatio) - 1,
              );
              const bottomPixel = Math.max(
                topPixel + 1,
                Math.round((y + 1) * characterHeight * devicePixelRatio) - 1,
              );

              context.fillStyle = colors.interaction;
              context.globalAlpha = fadeAlpha;
              context.fillRect(
                leftPixel / devicePixelRatio,
                topPixel / devicePixelRatio,
                (rightPixel - leftPixel) / devicePixelRatio,
                (bottomPixel - topPixel) / devicePixelRatio,
              );

              context.fillStyle = colors.interactionText;
              context.globalAlpha = fadeAlpha;
              context.fillText(interactionCharacter, centerX, centerY);
            }
          }

          characterIndex += 1;
        }
      }

      context.globalAlpha = 1;
      context.shadowBlur = 0;
      context.setTransform(1, 0, 0, 1, 0, 0);
    },
    [
      animationStyle,
      asciiData,
      colored,
      fontFamily,
      interactionCharacters,
      interactionRadius,
      interactive,
    ],
  );

  useEffect(() => {
    if (!isLoaded || asciiData.length === 0) return;

    refreshResolvedColors();

    if (shouldShowStatic || hasAnimated) {
      drawCanvas(1);
      return;
    }

    if (!shouldStartAnimation) {
      drawCanvas(0);
      return;
    }

    const startTime = performance.now();
    const duration =
      animationStyle === "fade"
        ? animationDuration * 1000
        : animationStyle === "typewriter"
          ? asciiData.length * (asciiData[0]?.length ?? 0) * 2
          : animationStyle === "matrix"
            ? 3000
            : 1000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / Math.max(duration, 1), 1);

      if (animationStyle === "matrix") {
        drawCanvas(1, progress);
      } else {
        drawCanvas(progress);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
        setHasAnimated(true);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [
    animationDuration,
    animationStyle,
    asciiData,
    drawCanvas,
    hasAnimated,
    isLoaded,
    refreshResolvedColors,
    shouldShowStatic,
    shouldStartAnimation,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (!isLoaded || asciiData.length === 0) return;
    refreshResolvedColors();
    drawCanvas(shouldShowStatic || hasAnimated ? 1 : 0);
  }, [
    asciiData,
    drawCanvas,
    hasAnimated,
    isLoaded,
    refreshResolvedColors,
    shouldShowStatic,
  ]);

  useEffect(() => {
    if (!isLoaded || asciiData.length === 0) return;

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(() => {
      refreshResolvedColors();
      drawCanvas(1);
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [asciiData, drawCanvas, isLoaded, refreshResolvedColors]);

  useEffect(() => {
    if (!isLoaded || asciiData.length === 0) return;

    const redrawForTheme = () => {
      refreshResolvedColors();
      drawCanvas(1);
    };
    const observer = new MutationObserver(redrawForTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, [asciiData, drawCanvas, isLoaded, refreshResolvedColors]);

  useEffect(() => {
    const isReadyForInteraction =
      interactive &&
      isLoaded &&
      asciiData.length > 0 &&
      (shouldShowStatic || hasAnimated);
    const container = containerRef.current;
    if (!container || !isReadyForInteraction) return;

    let lastDrawTime = 0;

    const animateInteraction = (timestamp: number) => {
      if (!pointerRef.current.active) {
        interactionFrameRef.current = null;
        drawCanvas(1);
        return;
      }

      if (timestamp - lastDrawTime >= INTERACTION_FRAME_INTERVAL) {
        lastDrawTime = timestamp;
        drawCanvas(1);
      }

      interactionFrameRef.current = requestAnimationFrame(animateInteraction);
    };

    const startInteractionLoop = () => {
      if (interactionFrameRef.current !== null) return;
      lastDrawTime = 0;
      interactionFrameRef.current = requestAnimationFrame(animateInteraction);
    };

    const stopInteractionLoop = () => {
      pointerRef.current.active = false;
      if (interactionFrameRef.current !== null) {
        cancelAnimationFrame(interactionFrameRef.current);
        interactionFrameRef.current = null;
      }
      drawCanvas(1);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const bounds = container.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;

      pointerRef.current = { x, y, active: true };
      startInteractionLoop();
    };

    const handlePointerLeave = () => stopInteractionLoop();

    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);
    container.addEventListener("pointercancel", handlePointerLeave);
    window.addEventListener("blur", handlePointerLeave);

    return () => {
      pointerRef.current.active = false;
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      container.removeEventListener("pointercancel", handlePointerLeave);
      window.removeEventListener("blur", handlePointerLeave);
      if (interactionFrameRef.current !== null) {
        cancelAnimationFrame(interactionFrameRef.current);
        interactionFrameRef.current = null;
      }
    };
  }, [
    asciiData,
    drawCanvas,
    hasAnimated,
    interactive,
    isLoaded,
    shouldShowStatic,
  ]);

  if (error) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "flex items-center justify-center text-red-500 text-sm font-mono",
          className,
        )}
      >
        Error: {error}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "flex items-center justify-center text-neutral-500 text-sm font-mono animate-pulse",
          className,
        )}
        style={{ backgroundColor }}
      >
        Loading...
      </div>
    );
  }

  const canvasElement = (
    <canvas
      key={uniqueId}
      id={`ascii-canvas-${uniqueId}`}
      ref={canvasRef}
      className="block h-full w-full"
      aria-label={ariaLabel}
      role="img"
    />
  );

  if (animationStyle === "fade" && animated && !hasAnimated) {
    return (
      <motion.div
        ref={containerRef}
        data-ascii-interactive={interactive ? "" : undefined}
        className={cn("overflow-hidden", className)}
        style={{ backgroundColor }}
        initial={{ opacity: 0 }}
        animate={shouldStartAnimation ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: animationDuration * 0.3 }}
      >
        {canvasElement}
      </motion.div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-ascii-interactive={interactive ? "" : undefined}
      className={cn("overflow-hidden", className)}
      style={{ backgroundColor }}
    >
      {canvasElement}
    </div>
  );
};

export const AsciiArtStatic: React.FC<
  Omit<AsciiArtProps, "animated" | "animationStyle">
> = (props) => {
  return <AsciiArt {...props} animated={false} animationStyle="none" />;
};
