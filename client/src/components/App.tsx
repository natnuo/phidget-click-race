import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../css/index.module.css";
import { io } from "socket.io-client";
import { Animated } from "react-animated-css";
import { createRoot } from "react-dom/client";

const RED = "#ff0000";
const GREEN = "#00ff00";
// const NEUTRAL = "#ffffff";

const POP_POSITION_MARGIN_FACTOR = 0.3;

const TW_TEXT_FILTERS = `${styles["opacity-50"]}`;
const TW_CENTER = `${styles["flex"]} ${styles["justify-center"]} ${styles["items-center"]}`;
const TW_MAJOR_CONT = `${styles["w-svw"]} ${styles["h-svh"]} ${styles["fixed"]}
  ${styles["flex"]} ${styles["md:flex-row"]} ${styles["flex-col"]}
  ${styles["-rotate-12"]} ${styles["md:rotate-12"]}
`;
const TW_SETTINGS_CONT = `${styles["flex"]} ${styles["items-center"]} ${styles["gap-4"]}`;

type GameMode = "None" | "First to Target" | "Most in Time" | "Neverending";
type ClickColor = "r" | "g";

export const sleep = async (ms: number) => { await new Promise(resolve => setTimeout(resolve, ms)); };

const App = () => {
  const __PRODUCTION__ = useRef(window.location.hostname !== "localhost");
  const [LOADING, setLoading] = useState(true);

  /////////////////
  // SOCKET INIT //
  /////////////////
  const socket = useMemo(() => {
    return io(
      `ws://${window.location.hostname}${__PRODUCTION__.current ? "" : ":3001"}`,
      { extraHeaders: { user: JSON.stringify({ username: "", email: "", type: "cliciever" }) } }
    );
  }, [__PRODUCTION__]);

  ////////////////////////
  // SETTINGS VARIABLES //
  ////////////////////////
  const [tempGameMode, setTempGameMode] = useState<GameMode>("None");
  const [gameMode, setGameMode] = useState<GameMode>("None");
  const [tempTimer, setTempTimer] = useState(30);
  const [tempTarget, setTempTarget] = useState(100);
  const [timer, setTimer] = useState(30);
  const [target, setTarget] = useState(100);

  ////////////////////
  // POPPING CLICKS //
  ////////////////////
  const greenPopCont = useRef<HTMLDivElement>(null);
  const redPopCont = useRef<HTMLDivElement>(null);

  const showClickSymbol = useCallback((color: ClickColor) => {
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

  /////////////////////////////
  // CLICK AND CPS VARIABLES //
  /////////////////////////////
  const [redClicks, setRedClicks] = useState(0);
  const [greenClicks, setGreenClicks] = useState(0);
  const [redCPS, setRedCPS] = useState(0);
  const [greenCPS, setGreenCPS] = useState(0);

  //////////////////////////////
  // GAME PHASE UPDATER [END] //
  //////////////////////////////
  const end = useCallback((winner: ClickColor | "t") => {

  }, []);

  ////////////////////////////
  // CLICK AND CPS UPDATERS //
  ////////////////////////////

  const sigmoid = (x: number) => { return 1 / (1 + Math.exp(-x)); }

  const onRedClick = useCallback((_redClicks: number) => {
    setRedClicks(_redClicks);
    showClickSymbol("r");
    if (_redClicks >= target) end("r");
  }, [showClickSymbol, end, target]);
  const onGreenClick = useCallback((_greenClicks: number) => {
    setGreenClicks(_greenClicks);
    showClickSymbol("g");
    if (_greenClicks >= target) end("g");
  }, [showClickSymbol, end, target]);
  const onInitialState = useCallback((_redClicks: number, _greenClicks: number, _redCPS: number, _greenCPS: number) => {
    setRedClicks(_redClicks); setGreenClicks(_greenClicks);
    setRedCPS(_redCPS); setGreenCPS(_greenCPS);
    setLoading(false);
  }, []);

  const getRedSizeFactor = useCallback(() => {
    return sigmoid(((redCPS + 1) / (redCPS + greenCPS + 2) - 0.5));
  }, [redCPS, greenCPS]);

  ////////////////////////
  // SETTINGS MODIFIERS //
  ////////////////////////
  const decTimer = useCallback(async () => {
    await sleep(1000);
    if (gameMode !== "Most in Time") return;
    if (timer === 1) {
      if (redClicks > greenClicks) end("r");
      else if (redClicks === greenClicks) end("t");
      else end("g");
      return;
    }
    setTimer(timer - 1);
    decTimer();
  }, [timer, gameMode, end, greenClicks, redClicks]);

  const cancelSettings = useCallback(() => {
    setTempGameMode(gameMode);
    setTempTimer(timer);
    setTempTarget(target);
  }, [gameMode, timer, target]);
  const newGame = useCallback(() => {
    setGameMode(tempGameMode);
    setTimer(tempTimer);
    setTarget(tempTarget);

    switch (tempGameMode) {  // switch for greater scalability in future
      case "Most in Time":
        decTimer();
        break;
    }
  }, [tempGameMode, tempTimer, tempTarget, decTimer]);

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
      <div>
        <label
          htmlFor="settings_modal"
          className={`${styles["btn"]} ${styles["fixed"]} ${styles["top-5"]} ${styles["right-5"]} ${styles["z-10"]}`}
        >Settings</label>

        <input type="checkbox" id="settings_modal" className={`${styles["modal-toggle"]}`} />
        <div className={`${styles["modal"]}`} role="dialog">
          <div className={`${styles["modal-box"]} ${styles["flex"]} ${styles["flex-col"]} ${styles["gap-2"]}`}>
            <h3 className={`${styles["text-lg"]} ${styles["font-bold"]}`}>Settings</h3>
            <select
              className={`${styles["select"]} ${styles["w-full"]} ${styles["max-w-xs"]}`}
              onChange={(e) => { setTempGameMode(e.target.value as GameMode); }}
            >
              <option disabled selected>Game Mode</option>
              <option value={"First to Target" as GameMode}>First to Target</option>
              <option value={"Most in Time" as GameMode}>Most in Time</option>
              <option value={"Neverending" as GameMode}>Neverending</option>
            </select>

            <div className={`${styles["flex"]} ${styles["flex-col"]} ${styles["gap-4"]}`}>
              {
                tempGameMode === "First to Target"
                ? (
                  <div className={`${TW_SETTINGS_CONT}`}>
                    <span>Target</span>
                    <input
                      type="range" min={1} max={500} value={tempTarget} className={`${styles["range"]}`}
                      onChange={(e) => { setTempTarget(parseInt(e.target.value)); }}
                    />
                    <span className={`${styles["text-nowrap"]}`}>{tempTarget} click{tempTarget === 1 ? "" : "s"}</span>
                  </div>
                ) : tempGameMode === "Most in Time"
                ? (
                  <div className={`${TW_SETTINGS_CONT}`}>
                    <span>Timer</span>
                    <input
                      type="range" min={1} max={100} value={tempTimer} className={`${styles["range"]}`}
                      onChange={(e) => { setTempTimer(parseInt(e.target.value)); }}
                    />
                    <span className={`${styles["text-nowrap"]}`}>{tempTimer} second{tempTimer === 1 ? "" : "s"}</span>
                  </div>
                ) : tempGameMode === "Neverending"
                ? (
                  <div className={`${TW_SETTINGS_CONT}`}>
                  </div>
                ) : null
              }

              <div className={`${styles["flex"]} ${styles["gap-2"]}`}>
                {
                  gameMode !== "None"
                  ? (
                    <label
                      className={`${styles["btn"]} ${styles["flex-1"]} ${styles["btn-primary"]}`}
                      htmlFor="settings_modal"
                      onClick={cancelSettings}
                    >Cancel</label>
                  ) : null
                }
                
                {
                  tempGameMode !== "None"
                  ? (
                    <label
                      className={`${styles["btn"]} ${styles["flex-1"]} ${styles["btn-warning"]}`}
                      htmlFor="settings_modal"
                      onClick={newGame}
                    >New Game</label>
                  ) : null
                }
              </div>
            </div>
          </div>
          
          {
            gameMode !== "None" ? (
              <label
                className={`${styles["modal-backdrop"]}`} htmlFor="settings_modal"
                onClick={cancelSettings}
              ></label>
            ) : null
          }
        </div>
      </div>

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
