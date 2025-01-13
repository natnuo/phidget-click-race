import { useCallback, useEffect, useRef, useState } from "react";
import styles from "../css/index.module.css";
import { Host } from "./Host";
import { Waiting } from "./Waiting";
import { Join } from "./Join";
import { Animated } from "react-animated-css";
import { useNavigate } from "react-router";

export type GameState = "host" | "join" | "waiting";

const MIN_FULL_LOAD_TIME_MS = 2000;
const MIN_TEXT_LOAD_TIME_MS = 500;

const STD_ANIMATION_TIME_MS = 1000;

export const App = () => {
        const __PRODUCTION__ = useRef(window.location.protocol === "https:");

        const [gameState, setGameState] = useState<GameState>("waiting");
        // laggingGameState necessary to keep showing an outgoing gameState (as it moves through the animation)
        const [laggingGameState, setLaggingGameState] = useState<GameState>("waiting");

        ////////////////////////
        // HISTORY MANAGEMENT //
        ////////////////////////
        const popStateListener = useCallback((e: PopStateEvent) => {
                console.log(e.state);
                setGameState(e.state.usr.gameState);
        }, []);

        useEffect(() => {
                window.addEventListener("popstate", popStateListener);
        }, [popStateListener]);

        const navigate = useNavigate();
        useEffect(() => {
                navigate("/", { state: { gameState } });
        }, [gameState, navigate]);
        useEffect(() => {
                setTimeout(() => {
                        setLaggingGameState(gameState);
                }, STD_ANIMATION_TIME_MS);
        }, [gameState]);
        
        return (
                <>
                        <Animated
                                isVisible={gameState === "waiting"}
                                animationIn="fadeIn"
                                animationOut="fadeOut"
                                className={`${gameState === "waiting" ? styles["z-10"] : ""} ${styles["fixed"]}`}
                        >
                                {
                                        gameState === "waiting" || laggingGameState === "waiting"
                                        ? <Waiting setGameState={setGameState} production={__PRODUCTION__}></Waiting>
                                        : null
                                }
                        </Animated>
                        <Animated
                                isVisible={gameState === "host"}
                                animationIn="fadeIn"
                                animationOut="fadeOut"
                                className={`${gameState === "host" ? styles["z-10"] : ""} ${styles["fixed"]}`}
                        >
                                {
                                        gameState === "host" || laggingGameState === "host"
                                        ? <Host setGameState={setGameState} production={__PRODUCTION__}></Host>
                                        : null
                                }
                        </Animated>
                        <Animated
                                isVisible={gameState === "join"}
                                animationIn="fadeIn"
                                animationOut="fadeOut"
                                className={`${gameState === "join" ? styles["z-10"] : ""} ${styles["fixed"]}`}
                        >
                                {
                                        gameState === "join" || laggingGameState === "join"
                                        ? <Join setGameState={setGameState} production={__PRODUCTION__}></Join>
                                        : null
                                }
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
