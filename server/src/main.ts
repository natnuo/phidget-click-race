import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "node:path";
import * as fs from "fs";
import http from "node:http";
import https from "node:https";
import { Server, Socket } from "socket.io";
import assert from "node:assert";
import { isUser, User } from "../../lib/user-types";
import { Color } from "../../lib/phidget-types";
import { InitSetup } from "../../lib/game-types";

const __PRODUCTION__ = process.env.PRODUCTION === "Y";

const SSL_KEY = fs.readFileSync(process.env.SSL_KEY ?? path.resolve(__dirname, "../key.pem"));
const SSL_CERT = fs.readFileSync(process.env.SSL_CERT ?? path.resolve(__dirname, "../cert.pem"));
const PORT = __PRODUCTION__ ? 443 : 3001;

const app = express();

const server = __PRODUCTION__
  ? https.createServer({ key: SSL_KEY, cert: SSL_CERT }, app)
  : http.createServer(app);

const io = new Server(server, {
  cors: { 
    origin: '*'
  }
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, "../../client/build")));
app.use("/public", express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, `../../client/build`, "index.html"));
});

app.get("/phidget-client", (req, res) => {
  const filePath = path.join(__dirname, "../../client/phidget.py");
  res.download(filePath);
});

/////////////////////
// RESOURCE CONSTS //
/////////////////////
const CPS_SERVERUPDATE_INTERVAL_MS = 100;
const CPS_EMIT_INTERVAL_MS = 100;
const GENERAL_UPDATE_INTERVAL_MS = 100;

/////////////////////////////
// OPERATIONAL INFORMATION //
/////////////////////////////
let ONLINE_USERS: Set<User> = new Set();

let redClicks: number, greenClicks: number;

const DNE = -1;
const MIN_CLICK_HIST_SIZE = 10;
const MAX_CLICK_HIST_SIZE = 100000000;
let timer: number;
let redClickHist: number[], greenClickHist: number[];

const initResources = () => {
  redClicks = 0, greenClicks = 0;
  redClickHist = [], greenClickHist = [];
  timer = 0;
};
initResources();

const NO_GAME_MODE_SETUP: InitSetup = { gameMode: "None" };
let gameSetup: InitSetup = NO_GAME_MODE_SETUP;

//////////////////////
// HELPER FUNCTIONS //
//////////////////////
const getCPS = (clickHist: number[]) => {
  return ((clickHist.at(-1)??0) - (clickHist.at(-MIN_CLICK_HIST_SIZE)??0)) / (CPS_SERVERUPDATE_INTERVAL_MS / 1000 * (MIN_CLICK_HIST_SIZE - 1));
  // return (-clickHist[4] + 8*clickHist[3] - 8*clickHist[1] + clickHist[0]) / (12 * (CPS_UPD_INTERVAL_MS / 1000));
};

////////////
// LOGGER //
////////////

type Loggable = "onlineUserCount";
const log = (action: Loggable) => {
  switch (action) {
    case "onlineUserCount":
      console.log("Users Online:", ONLINE_USERS.size);
      break;
  }
};

///////////////////////////////////
// SOCKET LISTENERS AND EMITTERS //
///////////////////////////////////
const initSocket = (user: User, socket: Socket) => {
  if (user.type === "reciever" || user.type === "cliciever")
    socket.emit(
      "initialState",
      redClicks,
      greenClicks,
      getCPS(redClickHist),
      getCPS(greenClickHist),
      gameSetup
    );
};
const end = (socket: Socket) => {
  socket.emit("end",
    redClickHist, greenClickHist,
    redClickHist.map((_, i) => { return getCPS(redClickHist.slice(0, i)); }),
    greenClickHist.map((_, i) => { return getCPS(greenClickHist.slice(0, i)); })
  );
  gameSetup = NO_GAME_MODE_SETUP;
};
let itv: NodeJS.Timeout | undefined = undefined;
io.on("connection", (socket) => {
  const rawuser = socket.handshake.headers.user;
  assert(typeof rawuser === "string");
  
  const user = JSON.parse(rawuser);
  assert(isUser(user));

  ONLINE_USERS.add(user);
  
  initSocket(user, socket);

  //////////////////////////
  // POST-INTITIALIZATION //
  //////////////////////////
  socket.on("disconnect", () => { ONLINE_USERS.delete(user); });
  if (user.type === "reciever" || user.type === "cliciever") {
    socket.on("init", (options: InitSetup) => {
      if (options === undefined) return;
      clearInterval(itv);
      gameSetup = options;
      initResources();
      initSocket(user, socket);
      
      switch (gameSetup.gameMode) {
        case "Most in Time":
          itv = setInterval(() => {
            if (gameSetup?.gameMode !== "Most in Time") { clearInterval(itv); return; }
            if (++timer >= gameSetup.time) {
              end(socket);
              clearInterval(itv);
            } else {
              socket.emit("timer", timer)
            }
          }, 1000);
          break;
      }
    });

    socket.on("forceGameEnd", () => { end(socket); });
  }
  if (user.type === "clicker" || user.type === "cliciever") {  // always true, but including line so don't forget this check in the future
    socket.on("click", (color: Color) => {
      if (gameSetup === undefined) return;
      if (color === "red") {
        io.emit("redClick", ++redClicks);
        socket.emit("redCPS", getCPS(redClickHist));  // socket to maintain only impactful transmission
      } else {
        io.emit("greenClick", ++greenClicks);
        socket.emit("greenCPS", getCPS(greenClickHist));
      }

      if (gameSetup.gameMode === "First to Target" && Math.max(redClicks, greenClicks) >= gameSetup.target) end(socket);
    });
  }
});

// update click history for cps calc
setInterval(() => {
  redClickHist.push(redClicks);
  greenClickHist.push(greenClicks);
  if (redClickHist.length > MAX_CLICK_HIST_SIZE) redClickHist.slice(1);
  if (greenClickHist.length > MAX_CLICK_HIST_SIZE) greenClickHist.slice(1);
}, CPS_SERVERUPDATE_INTERVAL_MS);

setInterval(() => {
  io.emit("redCPS", getCPS(redClickHist));
  io.emit("greenCPS", getCPS(greenClickHist));
}, CPS_EMIT_INTERVAL_MS);

server.listen(PORT, () => {
  if (__PRODUCTION__) console.log("App listening on port", PORT);
  else console.log(`App listening at http://localhost:3001`);
});
