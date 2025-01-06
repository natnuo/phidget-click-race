import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../css/index.module.css";
import { io } from "socket.io-client";
import { Animated } from "react-animated-css";
import { createRoot } from "react-dom/client";
import { InitSetup } from "../../../lib/game-types";
import { Chart } from "chart.js/auto";

const RED = "#ff0000";  // no 4 char hex for consistency
const GREEN = "#00dd00";
const SEMITRANSPARENT = "22";

const POP_POSITION_MARGIN_FACTOR = 0.3;

const TW_TEXT_FILTERS = `${styles["opacity-50"]}`;
const TW_CENTER = `${styles["flex"]} ${styles["justify-center"]} ${styles["items-center"]}`;
const TW_MAJOR_CONT = `${styles["w-svw"]} ${styles["h-svh"]} ${styles["fixed"]}
  ${styles["flex"]} ${styles["md:flex-row"]} ${styles["flex-col"]}
  ${styles["-rotate-12"]} ${styles["md:rotate-12"]}
`;
const TW_SETTINGS_CONT = `${styles["flex"]} ${styles["items-center"]} ${styles["gap-4"]}`;
const TW_TRANSITIONS = `${styles["transition-all"]} ${styles["duration-50"]}`;
const TW_INSTR_FOCUS = `${styles["block"]} ${styles["w-full"]} ${styles["m-1"]}
  ${styles["p-2"]} ${styles["rounded"]} ${styles["bg-gray-200"]}
`;

type GameMode = "None" | "First to Target" | "Most in Time" | "Neverending";
type ClickColor = "r" | "g";

Chart.defaults.font.family = "Lexend";

export const sleep = async (ms: number) => { await new Promise(resolve => setTimeout(resolve, ms)); };

const App = () => {
  const __PRODUCTION__ = useRef(window.location.hostname !== "localhost");
  const [LOADING, setLoading] = useState(true);

  const [medsz, setMedsz] = useState(false);
  useEffect(() => {
    window.addEventListener("resize", () => { setMedsz(window.innerWidth >= 768); })
  }, []);

  /////////////////
  // SOCKET INIT //
  /////////////////
  const socket = useMemo(() => {
    return io(
      `${__PRODUCTION__.current ? "https://" : "http://"}${window.location.hostname}${__PRODUCTION__.current ? ":443" : ":3001"}`,
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

  ////////////////////////////
  // CLICK AND CPS UPDATERS //
  ////////////////////////////

  const sigmoid = (x: number) => { return 1 / (1 + Math.exp(-x)); }

  const onRedClick = useCallback((_redClicks: number) => {
    setRedClicks(_redClicks);
    showClickSymbol("r");
  }, [showClickSymbol]);
  const onGreenClick = useCallback((_greenClicks: number) => {
    setGreenClicks(_greenClicks);
    showClickSymbol("g");
  }, [showClickSymbol]);
  const onInitialState = useCallback((_redClicks: number, _greenClicks: number, _redCPS: number, _greenCPS: number, gameSetup: InitSetup) => {
    if (!gameSetup) return;
    setRedClicks(_redClicks); setGreenClicks(_greenClicks);
    setRedCPS(_redCPS); setGreenCPS(_greenCPS);
    switch (gameSetup.gameMode) {
      case "Most in Time":
        setTempTimer(gameSetup.time);
        break;
    }
    setLoading(false);
  }, []);

  const getRedSizeFactor = useCallback(() => {
    return sigmoid(((redCPS + 1) / (redCPS + greenCPS + 2) - 0.5));
  }, [redCPS, greenCPS]);

  ////////////////////////
  // SETTINGS MODIFIERS //
  ////////////////////////
  const cancelSettings = useCallback(() => {
    setTempGameMode(gameMode);
    setTempTimer(timer);
    setTempTarget(target);
  }, [gameMode, timer, target]);
  const forceGameEnd = useCallback(() => {
    socket.emit("forceGameEnd");
  }, [socket]);
  const newGame = useCallback(() => {
    if (tempGameMode === "None") return;

    setGameMode(tempGameMode);
    setTimer(tempTimer);
    setTarget(tempTarget);

    switch (tempGameMode) {  // switch for greater scalability in future
      case "Most in Time":
        socket.emit("init", {
          gameMode: "Most in Time",
          time: tempTimer,
        } as InitSetup);
        break;
      case "First to Target":
        socket.emit("init", {
          gameMode: "First to Target",
          target: tempTarget,
        } as InitSetup);
        break;
      case "Neverending":
        socket.emit("init", {
          gameMode: "Neverending",
        } as InitSetup);
        break;
    }
  }, [tempGameMode, tempTimer, tempTarget, socket]);

  const phidgetSetupModalRef = useRef<HTMLDialogElement>(null);
  const settingsModalOpenerRef = useRef<HTMLInputElement>(null);
  const gameOverOpenerRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (gameMode === "None" && settingsModalOpenerRef.current && (!gameOverOpenerRef.current || !gameOverOpenerRef.current.checked))
      settingsModalOpenerRef.current.checked = true;
  }, [gameMode]);

  const cumChartRef = useRef<HTMLCanvasElement>(null);
  const cpsChartRef = useRef<HTMLCanvasElement>(null);

  const gameModeChoiceInputRef = useRef<HTMLSelectElement>(null);
  const onEnd = useCallback((redClickHist: number[], greenClickHist: number[], redCPSHist: number[], greenCPSHist: number[]) => {
    if (gameOverOpenerRef.current) gameOverOpenerRef.current.checked = true;
    if (gameModeChoiceInputRef.current) gameModeChoiceInputRef.current.value = "None";

    setTempGameMode("None");
    setGameMode("None");
    setTimer(tempTimer);
    setTarget(tempTarget);

    if (cumChartRef.current) {
      const cumChartStatus = Chart.getChart(cumChartRef.current);
      cumChartStatus?.destroy();

      new Chart(cumChartRef.current, {
        type: "line",
        data: {
          labels: redClickHist.map((_, i) => { return i; }),
          datasets: [
            {
              label: "Red",
              data: redClickHist,
              fill: true,
              borderColor: RED,
              pointRadius: 0,
              backgroundColor: RED + SEMITRANSPARENT,
              tension: 0.1
            }, {
              label: "Green",
              data: greenClickHist,
              fill: true,
              borderColor: GREEN,
              backgroundColor: GREEN + SEMITRANSPARENT,
              pointRadius: 0,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
            },
            x: {
              ticks: {
                callback: (value, index, ticks) => { return ""; }
              },
              grid: {
                display: false,
              },
              beginAtZero: true,
            }
          },
          plugins: {
            legend: {
              position: "top",
            },
            title: {
              display: true,
              text: "Cumulative Clicks"
            }
          }
        }
      });
    }
    
    if (cpsChartRef.current) {
      const cpsChartStatus = Chart.getChart(cpsChartRef.current);
      cpsChartStatus?.destroy();

      new Chart(cpsChartRef.current, {
        type: "line",
        data: {
          labels: redCPSHist.map((_, i) => { return i; }),
          datasets: [
            {
              label: "Red",
              data: redCPSHist,
              fill: true,
              borderColor: RED,
              pointRadius: 0,
              backgroundColor: RED + SEMITRANSPARENT,
              tension: 0.1
            }, {
              label: "Green",
              data: greenCPSHist,
              fill: true,
              borderColor: GREEN,
              backgroundColor: GREEN + SEMITRANSPARENT,
              pointRadius: 0,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
            },
            x: {
              ticks: {
                callback: (value, index, ticks) => { return ""; }
              },
              grid: {
                display: false,
              },
              beginAtZero: true,
            }
          },
          plugins: {
            legend: {
              position: "top",
            },
            title: {
              display: true,
              text: "Clicks per Second"
            }
          }
        }
      });
    }
  }, [tempTimer, tempTarget]);
  const onTimer = useCallback((t: number) => {
    setTimer(tempTimer - t)
  }, [tempTimer]);

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
    socket.on("timer", onTimer);
    socket.on("end", onEnd);

    return () => {
      socket.off();
    };
  }, [socket, onRedClick, onGreenClick, setRedCPS, setGreenCPS, onInitialState, onTimer, onEnd]);

  return (
    <div className={`
      ${styles["w-svw"]} ${styles["h-svh"]}
      ${styles["overflow-clip"]}
    `}>
      <div>
        <div className={`${styles["fixed"]} ${styles["top-5"]} ${styles["right-5"]} ${styles["z-10"]} ${styles["flex"]} ${styles["gap-2"]}`}>
          <button
            onClick={() => { phidgetSetupModalRef.current?.showModal(); }}
            className={`${styles["btn"]} ${styles["btn-warning"]}`}
          >Phidget Setup</button>
          <label
            htmlFor="settings_modal"
            className={`${styles["btn"]}`}
          >Settings</label>
          <button
            className={`${styles["btn"]} ${styles["btn-error"]}`}
            onClick={forceGameEnd}
          >End Game</button>
        </div>

        <dialog ref={phidgetSetupModalRef} className={`${styles["modal"]}`}>
          <div className={`${styles["modal-box"]} ${styles["flex"]} ${styles["flex-col"]} ${styles["gap-3"]}`}>
            <h3 className={`${styles["text-lg"]} ${styles["font-bold"]}`}>Phidget Setup Instructions</h3>

            <section className={`${styles["flex"]} ${styles["flex-col"]} ${styles["gap-1"]}`}>
              <h4 className={`${styles["font-bold"]}`}>1. Downloading the Python File</h4>

              <p>Python file download link:</p>

              <a
                className={`${TW_INSTR_FOCUS}`}
                href="https://phidget1.ntao.dev/phidget-client"
              >
                https://phidget1.ntao.dev/phidget-client
              </a>
            </section>

            <section className={`${styles["flex"]} ${styles["flex-col"]} ${styles["gap-1"]}`}>
              <h4 className={`${styles["font-bold"]}`}>2. Running the Python File</h4>

              <p>
                Download <a href="https://www.python.org/downloads/">Python</a> if you have not already.
              </p>

              <p>
                Using PIP, install <code>"python-socketio[client]"</code>,{" "}
                <code>websocket-client</code>, <code>requests</code>, and <code>Phidget22</code>.
              </p>

              <p>
                <i>Option 1: In the console:</i>
              </p>

              <div className={`${TW_INSTR_FOCUS}`}>
                <code>pip install "python-socketio[client]"</code><br/>
                <code>pip install websocket-client</code><br/>
                <code>pip install requests</code><br/>
                <code>pip install Phidget22</code>
              </div>

              <p>
                <i>Option 2: In Thonny:</i>
              </p>

              <p>
                Go to <u>Tools {">"} Manage Packages</u>
              </p>
              <p>
                Search for and install "python-socketio". Do the same for "websocket-client",
                "requests", "phidget22", <b>and "phidget22native"</b>.
              </p>
              <p>
                You can now successfully execute the Python file! 🎉
              </p>
            </section>

            <section className={`${styles["flex"]} ${styles["flex-col"]} ${styles["gap-1"]}`}>
              <h4 className={`${styles["font-bold"]}`}>3. Configuring the Phidget</h4>

              <p>
                Final step... Ensure your Phidget ports are properly configured.
              </p>
              <p>
                The Python program expects the following configuration:
              </p>
                
              <div className={`${TW_INSTR_FOCUS}`}>
                Red Button → Port 0<br/>
                Green Button → Port 5<br/>
                Red LED → Port 1<br/>
                Green LED → Port 4
              </div>

              <p>
                Ensure your Phidget matches the expected setup. Once it does,
                you should be ready to play <b>Phidget Tug-Of-War!</b>
              </p>
            </section>
          </div>
          <form method="dialog" className={`${styles["modal-backdrop"]}`}>
            <button>Close</button>
          </form>
        </dialog>

        <input type="checkbox" id="settings_modal" ref={settingsModalOpenerRef} className={`${styles["modal-toggle"]}`} />
        <div className={`${styles["modal"]}`} role="dialog">
          <div className={`${styles["modal-box"]} ${styles["flex"]} ${styles["flex-col"]} ${styles["gap-2"]}`}>
            <h3 className={`${styles["text-lg"]} ${styles["font-bold"]}`}>Settings</h3>
            <select
              className={`${styles["select"]} ${styles["w-full"]} ${styles["max-w-xs"]} ${styles["mb-4"]}`}
              onChange={(e) => { setTempGameMode(e.target.value as GameMode); }} ref={gameModeChoiceInputRef}
            >
              <option value={"None" as GameMode} disabled selected>Game Mode</option>
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

        <input type="checkbox" id="game_over_modal" ref={gameOverOpenerRef} className={`${styles["modal-toggle"]}`} />
        <div className={`${styles["modal"]}`} role="dialog">
          <div className={`${styles["modal-box"]} ${styles["flex"]} ${styles["flex-col"]} ${styles["gap-2"]}`}>
            <h3 className={`${styles["text-xl"]}`}>
              {
                redClicks === greenClicks
                ? (
                  <span className={`${styles["text-warning"]} ${styles["text-bold"]} ${styles["brightness-75"]}`}>Tie!</span>
                ) : (
                  redClicks > greenClicks
                  ? (
                    <><span className={`${styles["text-bold"]}`} style={{color: RED}}>Red</span> wins{"!"}</>
                  ) : (
                    <><span className={`${styles["text-bold"]}`} style={{color: GREEN}}>Green</span> wins{"!"}</>
                  )
                )
              }
            </h3>
            <canvas ref={cumChartRef}></canvas>
            <canvas ref={cpsChartRef}></canvas>
          </div>
          <label
            className={`${styles["modal-backdrop"]}`} htmlFor="game_over_modal"
            onClick={() => { if (settingsModalOpenerRef.current) settingsModalOpenerRef.current.checked = true; }}
          ></label>
        </div>
      </div>

      {
        gameMode === "Most in Time"
        ? (<div className={`
          ${styles["fixed"]} ${styles["text-4xl"]}
          ${styles["md:top-1/2"]} ${styles["left-1/2"]}
          ${styles["-translate-x-1/2"]} ${styles["-translate-y-1/2"]}
          ${styles["z-20"]} ${styles["bg-neutral"]} ${styles["text-neutral-content"]}
          ${styles["drop-shadow"]} ${styles["p-4"]} ${styles["rounded"]}
          ${styles["min-w-20"]} ${TW_TRANSITIONS}
          ${styles["flex"]} ${styles["justify-center"]}
        `} style={medsz ? { left: `${getRedSizeFactor() * 100}%` } : { top: `${getRedSizeFactor() * 100}%` }}>
          {timer}
        </div>) : null
      }

      <div className={`${TW_MAJOR_CONT}`}>
        <div
          className={`
            ${TW_TRANSITIONS}
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
            ${TW_TRANSITIONS} ${styles["cursor-pointer"]}
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
