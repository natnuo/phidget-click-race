import React, { useRef } from "react";
import styles from "../css/index.module.css";
import { io } from "socket.io-client";

const App = () => {
  const __PRODUCTION__ = useRef(window.location.hostname !== "localhost");

  const socket = io(`ws://${window.location.hostname}:`)

  return (
    <div className={`${styles["w-full"]} ${styles["h-full"]}`}>
      HI!
    </div>
  );
};

export default App;
