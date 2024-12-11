import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../css/index.module.css";
import { io } from "socket.io-client";
import { Animated } from "react-animated-css";
import { createRoot } from "react-dom/client";

const RED = "#ff0000";
const GREEN = "#00ff00";
// const NEUTRAL = "#ffffff";

const POP_POSITION_MARGIN_FACTOR = 0.3;
// const POP_SYMBOL_SHOW_TIME_MS = 1000;  // must match equivalent variable in index.module.css
// const POP_SYMBOL_ATTEMPT_ELEMENT_CLEAR_TIME_INTERVAL_MS = 10000; const _PSAECTI = POP_SYMBOL_ATTEMPT_ELEMENT_CLEAR_TIME_INTERVAL_MS;

const TW_TEXT_FILTERS = `${styles["opacity-50"]}`;
const TW_CENTER = `${styles["flex"]} ${styles["justify-center"]} ${styles["items-center"]}`;
const TW_MAJOR_CONT = `${styles["w-svw"]} ${styles["h-svh"]} ${styles["fixed"]}
  ${styles["flex"]} ${styles["md:flex-row"]} ${styles["flex-col"]}
  ${styles["-rotate-12"]} ${styles["md:rotate-12"]}
`;

const App = () => {
  const __PRODUCTION__ = useRef(window.location.hostname !== "localhost");
  const [LOADING, setLoading] = useState(true);

  ///////// SOCKET INIT
  const socket = useMemo(() => {
    return io(
      `ws://${window.location.hostname}${__PRODUCTION__.current ? "" : ":3001"}`,
      { extraHeaders: { user: JSON.stringify({ username: "", email: "", type: "cliciever" }) } }
    );
  }, [__PRODUCTION__]);

  ///////// POPPING CLICKS
  const greenPopCont = useRef<HTMLDivElement>(null);
  const redPopCont = useRef<HTMLDivElement>(null);

  const showClickSymbol = useCallback((color: "r" | "g") => {
    const tgtRef = color === "g" ? greenPopCont : redPopCont;

    if (!tgtRef.current) return;

    const newElement = document.createElement("div"); tgtRef.current.appendChild(newElement);
    newElement.style.position = "absolute"; newElement.style.width = "100%"; newElement.style.height = "100%";
    const root = createRoot(newElement);

    root.render(
      <div
        style={{
          left: `${((1 - 2*POP_POSITION_MARGIN_FACTOR) * Math.random() + POP_POSITION_MARGIN_FACTOR) * 100}%`,
          top: `${((1 - 2*POP_POSITION_MARGIN_FACTOR) * Math.random() + POP_POSITION_MARGIN_FACTOR) * 100}%`
        }}
        key={`e-pop${color}-${Date.now()}-${Math.random()}`}
        className={`
          ${styles["w-44"]} ${styles["sm:w-52"]} ${styles["md:w-60"]} ${styles["aspect-square"]} ${styles["absolute"]}
          ${styles["-translate-x-1/2"]} ${styles["-translate-y-1/2"]}
        `}
      >
        <div className={`
          ${styles["w-full"]} ${styles["h-full"]} ${styles["rounded-full"]}
          ${styles["origin-center"]}
          ${styles["bg-[#fffa]"]} ${styles["e-pop-obj"]}
        `}></div>
      </div>
    );
  }, []);

  ////////////////////////////
  // CLICK AND CPS UPDATERS //
  ////////////////////////////
  const [redClicks, setRedClicks] = useState(0);
  const [greenClicks, setGreenClicks] = useState(0);
  const [redCPS, setRedCPS] = useState(0);
  const [greenCPS, setGreenCPS] = useState(0);

  const sigmoid = (x: number) => { return 1 / (1 + Math.exp(-x)); }

  const onRedClick = useCallback((_redClicks: number) => {
    setRedClicks(_redClicks);
    showClickSymbol("r");
  }, [showClickSymbol]);
  const onGreenClick = useCallback((_greenClicks: number) => {
    setGreenClicks(_greenClicks);
    showClickSymbol("g");
  }, [showClickSymbol]);
  const onInitialState = useCallback((_redClicks: number, _greenClicks: number, _redCPS: number, _greenCPS: number) => {
    setRedClicks(_redClicks); setGreenClicks(_greenClicks);
    setRedCPS(_redCPS); setGreenCPS(_greenCPS);
    setLoading(false);
  }, []);

  const getRedSizeFactor = useCallback(() => {
    return sigmoid(((redCPS + 1) / (redCPS + greenCPS + 2) - 0.5));
  }, [redCPS, greenCPS]);

  /////////////////////
  // SOCKET EMITTERS //
  /////////////////////
  const clickGreen = useCallback(() => { socket.emit("click", "green"); }, [socket]);
  const clickRed = useCallback(() => { socket.emit("click", "red"); }, [socket]);

  //////////////////////
  // SOCKET LISTENERS //
  //////////////////////
  useEffect(() => {
    socket.on("redClick", onRedClick);
    socket.on("greenClick", onGreenClick);
    socket.on("redCPS", setRedCPS);
    socket.on("greenCPS", setGreenCPS);
    socket.on("initialState", onInitialState);

    return () => {
      socket.off();
    };
  }, [socket, onRedClick, onGreenClick, setRedCPS, setGreenCPS, onInitialState]);

  return (
    <div className={`
      ${styles["w-svw"]} ${styles["h-svh"]}
      ${styles["overflow-clip"]}
    `}>
      <div className={`${TW_MAJOR_CONT}`}>
        <div
          className={`
            ${styles["transition-all"]} ${styles["duration-50"]}
            ${TW_CENTER} ${styles["origin-bottom"]} ${styles["md:origin-right"]} ${styles["scale-150"]}
          `}
          style={{ backgroundColor: RED, flex: `${getRedSizeFactor() * 100}%` }}
        ></div>
        <div
          className={
            `${TW_CENTER} ${styles["origin-top"]} ${styles["md:origin-left"]} ${styles["scale-150"]}`
          }
          style={{ backgroundColor: GREEN, flex: `${(1 - getRedSizeFactor()) * 100}%` }}
        ></div>
      </div>
      <div className={`${TW_MAJOR_CONT}`}>
        <div
          className={`
            ${styles["transition-all"]} ${styles["duration-50"]} ${styles["cursor-pointer"]}
            ${TW_CENTER} ${styles["relative"]}
          `}
          style={{ backgroundColor: RED, flex: `${getRedSizeFactor() * 100}%` }}
          onClick={clickRed}
        >
          <div className={
            `${styles["w-full"]} ${styles["h-full"]} ${styles["absolute"]} ${styles["pointer-events-none"]}`
          } ref={redPopCont}></div>
          
          <Animated
            animationIn="fadeInUp" animationOut="fadeOutDown" animationOutDuration={0} isVisible={!LOADING}
            className={`${styles["select-none"]}`}
          >
            <div className={`${styles["md:-rotate-12"]} ${styles["rotate-12"]} ${styles["translate-y-1/4"]} ${TW_CENTER} ${styles["flex-col"]}`}>
              <span
                className={
                  `${styles["font-bold"]}
                  ${styles["text-7xl"]} ${styles["sm:text-8xl"]} ${styles["md:text-9xl"]}
                  ${TW_TEXT_FILTERS}`
                }
              >{redClicks}</span>
              <span className={`${styles["text-lg"]} ${styles["sm:text-xl"]} ${TW_TEXT_FILTERS}`}>{redCPS.toPrecision(2)} cps</span>
            </div>
          </Animated>
        </div>
        <div
          className={
            `${styles["cursor-pointer"]}
            ${TW_CENTER} ${styles["flex-col"]} ${styles["relative"]}`
          }
          style={{ backgroundColor: GREEN, flex: `${(1 - getRedSizeFactor()) * 100}%` }}
          onClick={clickGreen}
        >
          <div className={
            `${styles["w-full"]} ${styles["h-full"]} ${styles["absolute"]} ${styles["pointer-events-none"]} ${styles["e-pop-cont"]}`
          } ref={greenPopCont}></div>

          <Animated
            animationIn="fadeInUp" animationOut="fadeOutDown" animationOutDuration={0} isVisible={!LOADING}
            className={`${styles["select-none"]}`}
          >
            <div className={`${styles["md:-rotate-12"]} ${styles["rotate-12"]} ${styles["-translate-y-1/4"]} ${TW_CENTER} ${styles["flex-col"]}`}>
              <span
                className={
                  `${styles["font-bold"]}
                  ${styles["text-7xl"]} ${styles["sm:text-8xl"]} ${styles["md:text-9xl"]}
                  ${TW_TEXT_FILTERS}`
                }
              >{greenClicks}</span>
              <span className={`
                ${styles["text-lg"]} ${styles["sm:text-xl"]} ${TW_TEXT_FILTERS}
              `}>{greenCPS.toPrecision(2)} cps</span>
            </div>
          </Animated>
        </div>
      </div>
    </div>
  );
};

export default App;
