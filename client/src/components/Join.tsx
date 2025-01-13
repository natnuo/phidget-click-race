import { useMemo } from "react";
import styles from "../css/index.module.css";
import { GameState } from "./App";
import { io } from "socket.io-client";

const TW_PGT_BTN_GEN = `
        ${styles["w-44"]} ${styles["h-44"]}
        ${styles["sm:w-64"]} ${styles["sm:h-64"]}
        ${styles["rounded-full"]} ${styles["drop-shadow-xl"]}
        ${styles["btn"]}
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
                                        `} onClick={() => { socket.emit("click", "red"); }}></button>
                                        <button className={`
                                                ${styles["!bg-[#0f0]"]} ${TW_PGT_BTN_GEN}
                                        `} onClick={() => { socket.emit("click", "green"); }}></button>
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
