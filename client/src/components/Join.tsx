import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import styles from "../css/index.module.css";
import { GameState } from "./App";
import { io } from "socket.io-client";

const TW_PGT_BTN_GEN = `
        ${styles["w-44"]} ${styles["h-44"]}
        ${styles["sm:w-64"]} ${styles["sm:h-64"]}
        ${styles["rounded-full"]} ${styles["drop-shadow-xl"]}
        ${styles["text-8xl"]} ${styles["select-none"]}
        ${styles["transition-transform"]}
        ${styles["flex"]} ${styles["items-center"]} ${styles["justify-center"]}
`;

export const Join = (
        {setGameState, production: __PRODUCTION__}:
        {setGameState: React.Dispatch<React.SetStateAction<GameState>>, production: React.MutableRefObject<boolean>}
) => {
        /////////////////
        // SOCKET INIT //
        /////////////////
        const socket = useMemo(() => {
          return io(
            `${__PRODUCTION__.current ? "https://" : "http://"}${window.location.hostname}${__PRODUCTION__.current ? ":443" : ":3001"}`,
            { extraHeaders: { user: JSON.stringify({ username: "", email: "", type: "clicker" }) } }
          );
        }, [__PRODUCTION__]);

        //////////////////////
        // RESIZING HELPERS //
        //////////////////////
        const [medsz, setMedsz] = useState(false);
        useEffect(() => {
          const updMedsz = () => {
            setMedsz(window.innerWidth >= 768);
          };
      
          window.addEventListener("resize", updMedsz)
          updMedsz();
        }, []);
        
        /////////////////////////////
        // COLOR KEYBOARD CONTROLS //
        /////////////////////////////
        const [usingKeyboard, toggleUsingKeyboard] = useReducer((state: boolean) => {
                return !state;
        }, true);
        const [selectedColor, setSelectedColor] = useState<"green" | "red">("red");
        const redButtonRef = useRef<HTMLDivElement>(null);
        const greenButtonRef = useRef<HTMLDivElement>(null);
        const sendClick = useCallback((color: "red" | "green") => {
                socket.emit("click", color);
                new Audio(require("../util/positive.mp3")).play();
        }, [socket]);
        const listenForSpaceUpRed = useCallback((e: KeyboardEvent) => {
                if (e.code === "Space" && redButtonRef.current) {
                        sendClick("red");
                        redButtonRef.current.style.transform = "scale(1)";
                }
        }, [sendClick]);
        const listenForSpaceDownRed = useCallback((e: KeyboardEvent) => {
                if (e.code === "Space" && redButtonRef.current) {
                        redButtonRef.current.style.transform = "scale(0.9)";
                }
        }, []);
        const listenForSpaceUpGreen = useCallback((e: KeyboardEvent) => {  // can't just to one space listener bc then deleting doesn't work for weird reasons
                if (e.code === "Space" && greenButtonRef.current) {
                        sendClick("green");
                        greenButtonRef.current.style.transform = "scale(1)";
                }
        }, [sendClick]);
        const listenForSpaceDownGreen = useCallback((e: KeyboardEvent) => {
                if (e.code === "Space" && greenButtonRef.current) {
                        greenButtonRef.current.style.transform = "scale(0.9)";
                }
        }, []);
        const listenForGreenSwap = useCallback((e: KeyboardEvent) => {
                if (e.code === "ArrowDown" || e.code === "ArrowRight") setSelectedColor("green");
        }, []);
        const listenForRedSwap = useCallback((e: KeyboardEvent) => {
                if (e.code === "ArrowUp" || e.code === "ArrowLeft") setSelectedColor("red");
        }, []);
        useEffect(() => {
                document.removeEventListener("keydown", listenForGreenSwap);
                document.removeEventListener("keydown", listenForRedSwap);
                document.removeEventListener("keydown", listenForSpaceDownRed);
                document.removeEventListener("keydown", listenForSpaceDownGreen);
                document.removeEventListener("keyup", listenForSpaceUpRed);
                document.removeEventListener("keyup", listenForSpaceUpGreen);

                if (usingKeyboard) {
                        if (selectedColor === "red") {
                                document.addEventListener("keydown", listenForGreenSwap);
                                document.addEventListener("keydown", listenForSpaceDownRed);
                                document.addEventListener("keyup", listenForSpaceUpRed);
                        } else if (selectedColor === "green") {
                                document.addEventListener("keydown", listenForRedSwap);
                                document.addEventListener("keydown", listenForSpaceDownGreen);
                                document.addEventListener("keyup", listenForSpaceUpGreen);
                        }
                }
        }, [
                selectedColor,
                listenForRedSwap,
                listenForGreenSwap,
                listenForSpaceUpRed,
                listenForSpaceUpGreen,
                listenForSpaceDownRed,
                listenForSpaceDownGreen,
                usingKeyboard
        ]);

        return (
                <div className={`
                        ${styles["w-svw"]} ${styles["h-svh"]} ${styles["select-none"]}
                        ${styles["overflow-clip"]} ${styles["bg-blue-50"]}
                `}>
                        <div className={`
                                ${styles["fixed"]} ${styles["top-5"]}
                                ${styles["right-5"]} ${styles["z-10"]}
                                ${styles["flex"]} ${styles["gap-2"]}
                        `}>
                                <button
                                        className={`${styles["btn"]} ${styles["btn-warning"]}`}
                                        onClick={() => { setGameState("waiting"); }}
                                >
                                        To Home
                                </button>
                                <button
                                        className={`${styles["btn"]} ${styles["btn-primary"]}`}
                                        onClick={toggleUsingKeyboard}
                                >
                                        {
                                                usingKeyboard
                                                ? "Use Mouse"
                                                : "Use Keyboard"
                                        }
                                </button>
                        </div>
                        <div className={`
                                ${styles["flex"]} ${styles["flex-col"]} ${styles["gap-12"]}
                                ${styles["items-center"]} ${styles["justify-center"]}
                                ${styles["h-full"]}
                        `}>
                                <div className={`
                                        ${styles["flex"]} ${styles["flex-col"]} ${styles["sm:flex-row"]}
                                        ${styles["gap-6"]} ${styles["sm:gap-12"]}
                                        ${styles["items-center"]} ${styles["justify-center"]}
                                `}>
                                        <div
                                                className={`
                                                        ${styles["!bg-[#f00]"]}
                                                        ${usingKeyboard ? styles["cursor-not-allowed"] : styles["btn"]}
                                                        ${TW_PGT_BTN_GEN}
                                                `}
                                                onClick={
                                                        () => {
                                                                if (!usingKeyboard)
                                                                        sendClick("red");
                                                        }
                                                }
                                                ref={redButtonRef}
                                        >{
                                                usingKeyboard
                                                ? (
                                                        selectedColor === "red" ? "•" : (
                                                                medsz ? "🠈" : "🠉"
                                                        )
                                                ) : null
                                        }</div>
                                        <div
                                                className={`
                                                        ${styles["!bg-[#0f0]"]}
                                                        ${usingKeyboard ? styles["cursor-not-allowed"] : styles["btn"]}
                                                        ${TW_PGT_BTN_GEN}
                                                `}
                                                onClick={
                                                        () => {
                                                                if (!usingKeyboard)
                                                                        sendClick("green");
                                                        }
                                                }
                                                ref={greenButtonRef}
                                        >{
                                                usingKeyboard
                                                ? (
                                                        selectedColor === "green" ? "•" : 
                                                        (
                                                                medsz ? "🠊" : "🠋"
                                                        )
                                                ) : null
                                        }</div>
                                </div>
                                <h1 className={`
                                        ${styles["text-3xl"]}
                                        ${styles["sm:text-4xl"]} ${styles["font-semibold"]}
                                `}>
                                        Online Phidget
                                </h1>
                        </div>
                </div>
        );
};
