import type { Game } from "@/types";
import { Star } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "motion/react";
import type { KeyboardEvent, PointerEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import "./island.css";

interface DynamicIslandProps {
  game: Game | null;
  totalGameHours: number;
}
const HOLD_MS = 500;

function formatHours(hours: number) {
  return `${hours}h`;
}

function SuppliedIcon({
  name,
  className = "",
}: {
  name: "game-controller" | "game-controller-off" | "airpods-max";
  className?: string;
}) {
  return (
    <img
      className={`island-supplied-icon ${className}`}
      src={`/images/apple-icons/${name}.png`}
      alt=""
      draggable={false}
    />
  );
}

export default function DynamicIsland({
  game,
  totalGameHours,
}: DynamicIslandProps) {
  const reduceMotion = useReducedMotion();
  const controls = useAnimationControls();
  const [expandedGameId, setExpandedGameId] = useState<number | null>(null);
  const expanded = game !== null && expandedGameId === game.id;
  const [liked, setLiked] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const gesture = useRef({
    active: false,
    held: false,
    canceled: false,
    x: 0,
    y: 0,
  });
  const expandedRef = useRef(false);
  const spring = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 410, damping: 34, mass: 0.85 };
  const progress =
    totalGameHours > 0 && game
      ? Math.min(100, Math.round((game.playtimeHours / totalGameHours) * 100))
      : 0;
  const controllerIcon = game?.usesController
    ? "game-controller"
    : "game-controller-off";

  function clearHold() {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  }
  function changeExpanded(value: boolean) {
    clearHold();
    expandedRef.current = value;
    setExpandedGameId(value && game ? game.id : null);
    if (!value) trigger.current?.focus();
  }
  function pulse() {
    if (reduceMotion) return;
    void controls.start({
      scaleX: [1, 1.055, 0.985, 1],
      scaleY: [1, 0.92, 1.025, 1],
      transition: { duration: 0.34, ease: "easeOut" },
    });
  }
  function beginHold() {
    clearHold();
    if (!game || expanded) return;
    timer.current = window.setTimeout(() => {
      if (!gesture.current.active || gesture.current.canceled) return;
      gesture.current.held = true;
      changeExpanded(true);
    }, HOLD_MS);
  }
  function pointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || !event.isPrimary) return;
    gesture.current = {
      active: true,
      held: false,
      canceled: false,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    beginHold();
  }
  function pointerEnd(event: PointerEvent<HTMLButtonElement>) {
    clearHold();
    const current = gesture.current;
    if (
      current.active &&
      !current.held &&
      !current.canceled &&
      event.type === "pointerup"
    )
      pulse();
    current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (![" ", "Enter", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowDown") {
      if (game) changeExpanded(true);
      return;
    }
    if (event.repeat) return;
    gesture.current = {
      active: true,
      held: false,
      canceled: false,
      x: 0,
      y: 0,
    };
    beginHold();
  }

  useEffect(() => {
    function cancelHold() {
      window.clearTimeout(timer.current);
      gesture.current.active = false;
    }
    window.addEventListener("blur", cancelHold);
    document.addEventListener("visibilitychange", cancelHold);
    return () => {
      cancelHold();
      window.removeEventListener("blur", cancelHold);
      document.removeEventListener("visibilitychange", cancelHold);
    };
  }, []);
  useEffect(() => {
    if (!expanded) return;
    function dismiss(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      expandedRef.current = false;
      setExpandedGameId(null);
      trigger.current?.focus();
    }
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [expanded]);

  return (
    <>
      <AnimatePresence>
        {expanded && (
          <motion.button
            type="button"
            className="island-backdrop"
            aria-label="收起灵动岛"
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            onClick={() => changeExpanded(false)}
          />
        )}
      </AnimatePresence>
      <motion.div className="island-anchor" animate={controls}>
        <motion.section
          className={`dynamic-island ${expanded ? "is-expanded" : ""} ${game ? "is-playing" : "is-idle"}`}
          aria-label="游戏灵动岛"
          data-phase={expanded ? "expanded" : game ? "playing" : "idle"}
          initial={false}
          animate={{
            width: expanded ? 310 : game ? 154 : 100,
            height: expanded ? 166 : 30,
            borderRadius: expanded ? 44 : 18,
          }}
          transition={spring}
        >
          <div className="island-pulse-surface">
            <button
              ref={trigger}
              type="button"
              className="island-trigger"
              aria-label={game ? "长按展开正在游戏详情" : "灵动岛待机"}
              aria-expanded={expanded}
              aria-controls={id}
              aria-description="短按回弹，长按半秒展开；键盘可按住空格或按向下键展开。"
              onPointerDown={pointerDown}
              onPointerUp={pointerEnd}
              onPointerCancel={pointerEnd}
              onLostPointerCapture={() => {
                clearHold();
                gesture.current.active = false;
              }}
              onPointerMove={(event) => {
                if (
                  Math.hypot(
                    event.clientX - gesture.current.x,
                    event.clientY - gesture.current.y,
                  ) > 10
                ) {
                  gesture.current.canceled = true;
                  clearHold();
                }
              }}
              onContextMenu={(event) => event.preventDefault()}
              onKeyDown={keyDown}
              onKeyUp={(event) => {
                if (![" ", "Enter"].includes(event.key)) return;
                event.preventDefault();
                clearHold();
                if (!gesture.current.held) pulse();
                gesture.current.active = false;
              }}
              onBlur={() => {
                clearHold();
                gesture.current.active = false;
              }}
              onClick={(event) => {
                event.preventDefault();
                if (event.detail === 0 && !gesture.current.held) pulse();
              }}
            >
              <motion.span
                className="island-compact-content"
                initial={false}
                animate={{ opacity: game && !expanded ? 1 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.1 }}
              >
                {game && (
                  <>
                    <span className="island-mini-cover">
                      {game.cover && !coverFailed ? (
                        <img
                          src={game.cover}
                          alt=""
                          draggable={false}
                          onError={() => setCoverFailed(true)}
                        />
                      ) : (
                        <SuppliedIcon name={controllerIcon} />
                      )}
                    </span>
                    <SuppliedIcon
                      name={controllerIcon}
                      className="island-mini-controller"
                    />
                  </>
                )}
              </motion.span>
            </button>
            <div id={id} inert={!expanded} aria-hidden={!expanded}>
              <motion.div
                className="island-details"
                initial={false}
                animate={{
                  opacity: expanded ? 1 : 0,
                  y: expanded ? 0 : -5,
                  filter: expanded ? "blur(0px)" : "blur(4px)",
                }}
                transition={{
                  duration: reduceMotion ? 0 : expanded ? 0.19 : 0.08,
                  delay: expanded && !reduceMotion ? 0.08 : 0,
                }}
              >
                {game && (
                  <>
                    <div className="island-now-playing">
                      <div className="island-cover">
                        {game.cover && !coverFailed ? (
                          <img
                            src={game.cover}
                            alt={`${game.title} 封面`}
                            draggable={false}
                            onError={() => setCoverFailed(true)}
                          />
                        ) : (
                          <SuppliedIcon name={controllerIcon} />
                        )}
                      </div>
                      <div className="island-game-copy">
                        <strong title={game.title}>{game.title}</strong>
                        <span title={game.platform ?? undefined}>
                          {game.platform || "发行商未知"}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="island-game-status"
                        onClick={() => changeExpanded(false)}
                        aria-label="正在游戏，收起详情"
                        title={`${game.usesController ? "使用手柄游玩" : "不使用手柄游玩"} · 点击收起`}
                      >
                        <SuppliedIcon name={controllerIcon} />
                      </button>
                    </div>
                    <div
                      className="island-playtime"
                      title="本游戏游玩时长 / 全部游戏总时长"
                    >
                      <span
                        aria-label={`本游戏 ${formatHours(game.playtimeHours)}`}
                      >
                        {formatHours(game.playtimeHours)}
                      </span>
                      <div
                        className="island-time-track"
                        role="meter"
                        aria-label="本游戏游玩时长占全部游戏总时长"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                      >
                        <span style={{ width: `${progress}%` }} />
                      </div>
                      <span
                        aria-label={`全部游戏 ${formatHours(totalGameHours)}`}
                      >
                        {formatHours(totalGameHours)}
                      </span>
                    </div>
                    <div className="island-controls">
                      <button
                        type="button"
                        className={`island-favorite ${liked ? "is-liked" : ""}`}
                        aria-label="收藏正在玩的游戏"
                        aria-pressed={liked}
                        onClick={() => setLiked((value) => !value)}
                      >
                        <Star
                          size={23}
                          strokeWidth={1.8}
                          fill={liked ? "currentColor" : "none"}
                        />
                      </button>
                      <button
                        type="button"
                        className="island-transport"
                        aria-label="上一款（Steam 不支持远程切换）"
                        disabled
                        title="Steam 状态只读，无法远程切换游戏"
                      >
                        <span className="apple-icon apple-icon-previous" />
                      </button>
                      <button
                        type="button"
                        className="island-transport island-pause"
                        aria-label="正在游戏（Steam 不支持远程暂停）"
                        disabled
                        title="Steam 状态只读，无法远程暂停游戏"
                      >
                        <span className="apple-icon apple-icon-pause" />
                      </button>
                      <button
                        type="button"
                        className="island-transport"
                        aria-label="下一款（Steam 不支持远程切换）"
                        disabled
                        title="Steam 状态只读，无法远程切换游戏"
                      >
                        <span className="apple-icon apple-icon-next" />
                      </button>
                      <span
                        className="island-headphones"
                        role="img"
                        aria-label="AirPods Max 图标"
                      >
                        <SuppliedIcon name="airpods-max" />
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </>
  );
}
