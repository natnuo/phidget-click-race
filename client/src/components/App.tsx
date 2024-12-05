import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../css/index.module.css";
import { io } from "socket.io-client";
import { Animated } from "react-animated-css";

const RED = "#ff0000";
const GREEN = "#00ff00";
// const NEUTRAL = "#ffffff";

const TW_TEXT_FILTERS = `${styles["opacity-50"]}`;
const TW_CENTER = `${styles["flex"]} ${styles["justify-center"]} ${styles["items-center"]}`;

// TODO: MOBILE COMPATIBILITY
const App = () => {
  const __PRODUCTION__ = useRef(window.location.hostname !== "localhost");
  const [LOADING, setLoading] = useState(true);

  const socket = useMemo(() => {
    return io(
      `ws://${window.location.hostname}${__PRODUCTION__.current ? "" : ":3001"}`,
      { query: { user: JSON.stringify({ username: "", email: "" }) } }
    );
  }, [__PRODUCTION__]);

  const [redClicks, setRedClicks] = useState(1);
  const [greenClicks, setGreenClicks] = useState(1);
  const [redCPS, setRedCPS] = useState(0);
  const [greenCPS, setGreenCPS] = useState(0);

  const sigmoid = (x: number) => { return 1 / (1 + Math.exp(-x)); }

  useEffect(() => {
    socket.on("redClick", (_redClicks) => { setRedClicks(_redClicks); setLoading(false); });
    socket.on("greenClick", (_greenClicks) => { setGreenClicks(_greenClicks); setLoading(false); });
    socket.on("redCPS", setRedCPS);
    socket.on("greenCPS", setGreenCPS);
  }, [socket]);

  const clickGreen = useCallback(() => { socket.emit("click", "green"); }, [socket]);
  const clickRed = useCallback(() => { socket.emit("click", "red"); }, [socket]);

  return (
    <div
      className={`${styles["w-svw"]} ${styles["h-svh"]} ${styles["flex"]}`}
    >
      <div
        className={
          `${styles["transition-all"]} ${styles["duration-300"]} ${styles["cursor-pointer"]}
          ${TW_CENTER} ${styles["relative"]}`
        }
        style={{ backgroundColor: RED, width: `${
          sigmoid((redClicks / (redClicks + greenClicks) - 0.5)) * 100
        }%` }}
        onClick={clickRed}
      >
        <div className={
          `${styles["w-full"]} ${styles["h-full"]} ${styles["absolute"]} ${styles["pointer-events-none"]} ${styles["e-pop-cont"]}`
        }>

        </div>
        <Animated
          animationIn="fadeInUp" animationOut="fadeOutDown" animationOutDuration={0} isVisible={!LOADING}
          className={`${TW_CENTER} ${styles["flex-col"]} ${styles["select-none"]}`}
        >
          <span
            className={
              `${styles["font-bold"]} ${styles["text-9xl"]} ${TW_TEXT_FILTERS}`
            }
          >{redClicks}</span>
          <span className={`${styles["text-xl"]} ${TW_TEXT_FILTERS}`}>{redCPS.toPrecision(2)} cps</span>
        </Animated>
      </div>
      <div
        className={
          `${styles["flex-1"]} ${styles["cursor-pointer"]}
          ${TW_CENTER} ${styles["flex-col"]} ${styles["relative"]}`
        }
        style={{ backgroundColor: GREEN }}
        onClick={clickGreen}
      >
        <div className={
          `${styles["w-full"]} ${styles["h-full"]} ${styles["absolute"]} ${styles["pointer-events-none"]} ${styles["e-pop-cont"]}`
        }>

        </div>
        <Animated
          animationIn="fadeInUp" animationOut="fadeOutDown" animationOutDuration={0} isVisible={!LOADING}
          className={`${TW_CENTER} ${styles["flex-col"]} ${styles["select-none"]}`}
        >
          <span
            className={
              `${styles["font-bold"]} ${styles["text-9xl"]}
              ${TW_TEXT_FILTERS}`
            }
          >{greenClicks}</span>
          <span className={`${styles["text-xl"]} ${TW_TEXT_FILTERS}`}>{greenCPS.toPrecision(2)} cps</span>
        </Animated>
      </div>
    </div>
  );
};

export default App;
