import { useRef, useState } from "react";
import styles from "../css/index.module.css";
import { Host } from "./Host";
import { Waiting } from "./Waiting";
import { Join } from "./Join";
import { Animated } from "react-animated-css";

export type GameState = "host" | "join" | "waiting";

const MIN_FULL_LOAD_TIME_MS = 2000;
const MIN_TEXT_LOAD_TIME_MS = 500;

export const App = () => {
        const __PRODUCTION__ = useRef(window.location.hostname !== "localhost");

        const [gameState, setGameState] = useState<GameState>("waiting");
        
        return (
                <>
                        { /*
                                Three <Animated>'s forces each option to load, which, admittedly, is quite inefficient
                                and is room for improvement
                        */ }
                        <Animated
                                isVisible={gameState === "waiting"}
                                animationIn="fadeIn"
                                animationOut="fadeOut"
                                className={`${gameState === "waiting" ? styles["z-10"] : ""} ${styles["fixed"]}`}
                        >
                                <Waiting setGameState={setGameState} production={__PRODUCTION__}></Waiting>
                        </Animated>
                        <Animated
                                isVisible={gameState === "host"}
                                animationIn="fadeIn"
                                animationOut="fadeOut"
                                className={`${gameState === "host" ? styles["z-10"] : ""} ${styles["fixed"]}`}
                        >
                                <Host setGameState={setGameState} production={__PRODUCTION__}></Host>
                        </Animated>
                        <Animated
                                isVisible={gameState === "join"}
                                animationIn="fadeIn"
                                animationOut="fadeOut"
                                className={`${gameState === "join" ? styles["z-10"] : ""} ${styles["fixed"]}`}
                        >
                                <Join setGameState={setGameState} production={__PRODUCTION__}></Join>
                        </Animated>

                        {/* Extra animated to hide initial mess */}
                        <Animated
                                isVisible={false}
                                animationIn="fadeIn"
                                animationOut="fadeOut"
                                animationOutDelay={MIN_FULL_LOAD_TIME_MS}
                                className={`
                                        ${styles["fixed"]} ${styles["bg-black"]}
                                        ${styles["w-svw"]} ${styles["h-svh"]}
                                        ${styles["!pointer-events-none"]} ${styles["z-20"]}
                                `}
                        >
                                <div className={`
                                        ${styles["flex"]} ${styles["items-center"]} ${styles["justify-center"]}
                                        ${styles["w-full"]} ${styles["h-full"]}
                                `}>
                                        <Animated
                                                isVisible={true}
                                                animationIn="fadeIn"
                                                animationOut="fadeOut"
                                                animationInDelay={MIN_TEXT_LOAD_TIME_MS}
                                                animationOutDuration={0}
                                                className={`${styles["!pointer-events-none"]}`}
                                        >
                                                <h1 className={`${styles["text-4xl"]} ${styles["text-white"]} ${styles["font-bold"]}`}>
                                                        Phidget Tug-of-War
                                                </h1>
                                        </Animated>
                                </div>
                        </Animated>
                </>
        );
};

export default App;
