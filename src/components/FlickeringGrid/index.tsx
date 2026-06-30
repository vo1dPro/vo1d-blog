import { cn } from "@/lib/utils";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";

interface FlickeringGridProps extends HTMLAttributes<HTMLDivElement> {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  width?: number;
  height?: number;
  maxOpacity?: number;
}

export default function FlickeringGrid({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.05,
  color = "#6b7280",
  width,
  height,
  className,
  maxOpacity = 0.2,
  ...props
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const memoizedColor = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) return "rgba(107, 114, 128,";
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = Array.from(
      context.getImageData(0, 0, 1, 1).data,
    );
    return `rgba(${red}, ${green}, ${blue},`;
  }, [color]);

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, nextWidth: number, nextHeight: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = nextWidth * dpr;
      canvas.height = nextHeight * dpr;
      canvas.style.width = `${nextWidth}px`;
      canvas.style.height = `${nextHeight}px`;

      const cols = Math.floor(nextWidth / (squareSize + gridGap));
      const rows = Math.floor(nextHeight / (squareSize + gridGap));
      const squares = new Float32Array(cols * rows);

      for (let index = 0; index < squares.length; index += 1) {
        squares[index] = Math.random() * maxOpacity;
      }

      return { cols, rows, squares, dpr };
    },
    [gridGap, maxOpacity, squareSize],
  );

  const updateSquares = useCallback(
    (squares: Float32Array, deltaTime: number) => {
      for (let index = 0; index < squares.length; index += 1) {
        if (Math.random() < flickerChance * deltaTime) {
          squares[index] = Math.random() * maxOpacity;
        }
      }
    },
    [flickerChance, maxOpacity],
  );

  const drawGrid = useCallback(
    (
      context: CanvasRenderingContext2D,
      canvasWidth: number,
      canvasHeight: number,
      cols: number,
      rows: number,
      squares: Float32Array,
      dpr: number,
    ) => {
      context.clearRect(0, 0, canvasWidth, canvasHeight);

      for (let col = 0; col < cols; col += 1) {
        for (let row = 0; row < rows; row += 1) {
          const opacity = squares[col * rows + row];
          context.fillStyle = `${memoizedColor}${opacity})`;
          context.fillRect(
            col * (squareSize + gridGap) * dpr,
            row * (squareSize + gridGap) * dpr,
            squareSize * dpr,
            squareSize * dpr,
          );
        }
      }
    },
    [gridGap, memoizedColor, squareSize],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrameId = 0;
    let gridParams = setupCanvas(
      canvas,
      width || container.clientWidth,
      height || container.clientHeight,
    );

    const updateCanvasSize = () => {
      const nextWidth = width || container.clientWidth;
      const nextHeight = height || container.clientHeight;
      setCanvasSize({ width: nextWidth, height: nextHeight });
      gridParams = setupCanvas(canvas, nextWidth, nextHeight);
    };

    updateCanvasSize();

    let lastTime = 0;
    const animate = (time: number) => {
      if (!isInView) return;

      const deltaTime = (time - lastTime) / 1000;
      lastTime = time;
      updateSquares(gridParams.squares, deltaTime);
      drawGrid(
        context,
        canvas.width,
        canvas.height,
        gridParams.cols,
        gridParams.rows,
        gridParams.squares,
        gridParams.dpr,
      );
      animationFrameId = requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    if (isInView) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [drawGrid, height, isInView, setupCanvas, updateSquares, width]);

  return (
    <div
      ref={containerRef}
      className={cn("h-full w-full", className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />
    </div>
  );
}
