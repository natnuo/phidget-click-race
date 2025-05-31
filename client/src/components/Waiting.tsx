import { GameState } from "./App"
import styles from "../css/index.module.css";

const TW_ICON = `
        ${styles["block"]} ${styles["md:text-8xl"]} ${styles["lg:text-9xl"]}
        ${styles["text-6xl"]}
`;
const TW_GM_BUTTON = `
        ${styles["text-xl"]} ${styles["max-w-full"]}
        ${styles["aspect-square"]} ${styles["h-min"]}
        ${styles["btn"]} ${styles["glass"]} ${styles["btn-outline"]}
        ${styles["p-20"]}
        ${styles["flex"]} ${styles["flex-col"]} ${styles["gap-8"]}
        ${styles["flex-nowrap"]} ${styles["text-neutral-content"]}
        ${styles["drop-shadow"]}
`;

export const Waiting = (
        {setGameState, production: __PRODUCTION__}:
        {setGameState: React.Dispatch<React.SetStateAction<GameState>>, production: React.MutableRefObject<boolean>}
) => {
        return (
                <div className={`
                        ${styles["w-svw"]} ${styles["h-svh"]}
                        ${styles["overflow-clip"]} ${styles["e-bg-wav"]}
                `}>
                        <div className={`
                                ${styles["flex"]} ${styles["md:flex-row"]} ${styles["flex-col"]}
                                ${styles["w-full"]} ${styles["h-full"]}
                                ${styles["p-10"]}
                                ${styles["items-center"]} ${styles["justify-center"]}
                                ${styles["gap-10"]}
                        `}>
                                <button
                                        className={`${TW_GM_BUTTON}`}
                                        onClick={() => { setGameState("join"); }}
                                >
                                        <span className={`${TW_ICON}`}>🖱️</span>
                                        Player
                                </button>

                                <button
                                        className={`${TW_GM_BUTTON}`}
                                        onClick={() => { setGameState("host"); }}
                                >
                                        <span className={`${TW_ICON}`}>🖥️</span>
                                        Host
                                </button>
                        </div>
                </div>
        );
};
