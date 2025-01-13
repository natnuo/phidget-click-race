import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "../css/index.module.css";
import { GameState } from "./App";
import { io } from "socket.io-client";

const TW_PGT_BTN_GEN = `
        ${styles["w-44"]} ${styles["h-44"]}
        ${styles["sm:w-64"]} ${styles["sm:h-64"]}
        ${styles["rounded-full"]} ${styles["drop-shadow-xl"]}
        ${styles["btn"]} ${styles["select-none"]}
        ${styles["text-8xl"]}
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
        const [selectedColor, setSelectedColor] = useState<"green" | "red">("red");
        const redButtonRef = useRef<HTMLButtonElement>(null);
        const greenButtonRef = useRef<HTMLButtonElement>(null);
        const listenForSpaceClickRed = useCallback((e: KeyboardEvent) => {
                if (e.code === "Space" && redButtonRef.current) {
                        redButtonRef.current.click();
                        redButtonRef.current.style.transform = "scale(0.9)";
                        setTimeout(() => {
                                if (redButtonRef.current)
                                        redButtonRef.current.style.transform = "scale(1)";
                        }, 100);
                }
        }, []);
        const listenForSpaceClickGreen = useCallback((e: KeyboardEvent) => {  // can't just to one space listener bc then deleting doesn't work for weird reasons
                if (e.code === "Space" && greenButtonRef.current) {
                        greenButtonRef.current?.click();
                        greenButtonRef.current.style.transform = "scale(0.9)";
                        setTimeout(() => {
                                if (greenButtonRef.current)
                                        greenButtonRef.current.style.transform = "scale(1)";
                        }, 100);  // setTimeout here -- a bit sketch
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
                document.removeEventListener("keydown", listenForSpaceClickRed);
                document.removeEventListener("keydown", listenForSpaceClickGreen);

                if (selectedColor === "red") {
                        document.addEventListener("keydown", listenForGreenSwap);
                        document.addEventListener("keydown", listenForSpaceClickRed);
                } else if (selectedColor === "green") {
                        document.addEventListener("keydown", listenForRedSwap);
                        document.addEventListener("keydown", listenForSpaceClickGreen);
                }
        }, [selectedColor, listenForRedSwap, listenForGreenSwap, listenForSpaceClickRed, listenForSpaceClickGreen]);

        return (
                <div className={`
                        ${styles["w-svw"]} ${styles["h-svh"]}
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
                                        <button className={`
                                                        ${styles["!bg-[#f00]"]} ${TW_PGT_BTN_GEN}
                                                `}
                                                onClick={() => {
                                                        socket.emit("click", "red");
                                                        new Audio(require("../util/positive.mp3")).play();
                                                }}
                                                ref={redButtonRef}
                                        >{
                                                selectedColor === "red" ? "•" : (
                                                        medsz ? "🠈" : "🠉"
                                                )
                                        }</button>
                                        <button className={`
                                                        ${styles["!bg-[#0f0]"]} ${TW_PGT_BTN_GEN}
                                                `}
                                                onClick={() => {
                                                        socket.emit("click", "green");
                                                        new Audio(require("../util/positive.mp3")).play();
                                                }}
                                                ref={greenButtonRef}
                                        >{
                                                selectedColor === "green" ? "•" : 
                                                (
                                                        medsz ? "🠊" : "🠋"
                                                )
                                        }</button>
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
