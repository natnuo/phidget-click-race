import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "node:path";
import * as fs from "fs";
import http from "node:http";
import https from "node:https";
import { Server } from "socket.io";
import assert from "node:assert";
import { isUser, User } from "../../lib/user-types";
import { Color } from "../../lib/phidget-types";

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

/////////////////////
// RESOURCE CONSTS //
/////////////////////
const CPS_UPD_INTERVAL_MS = 100;

/////////////////////////////
// OPERATIONAL INFORMATION //
/////////////////////////////
let ONLINE_USERS: Set<User> = new Set();

let redClicks = 0, greenClicks = 0;

const DNE = -1;
const CLICK_HIST_SIZE = 10;
// no queue impl rip
let redClickHist = Array(CLICK_HIST_SIZE).fill(DNE), greenClickHist = Array(CLICK_HIST_SIZE).fill(DNE);

//////////////////////
// HELPER FUNCTIONS //
//////////////////////
const getCPS = (clickHist: number[]) => {
  return (clickHist[CLICK_HIST_SIZE - 1] - clickHist[0]) / (CPS_UPD_INTERVAL_MS / 1000 * (CLICK_HIST_SIZE - 1));
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
io.on("connection", (socket) => {
  const rawuser = socket.handshake.headers.user;
  assert(typeof rawuser === "string");
  
  const user = JSON.parse(rawuser);
  assert(isUser(user));

  ONLINE_USERS.add(user);
  
  if (user.type === "reciever")
    socket.emit("initialState", redClicks, greenClicks, getCPS(redClickHist), getCPS(greenClickHist));

  //////////////////////////
  // POST-INTITIALIZATION //
  //////////////////////////

  socket.on("disconnect", () => { ONLINE_USERS.delete(user); });  
  if (user.type === "clicker") {
    socket.on("click", (color: Color) => {
      if (color === "red") {
        io.emit("redClick", ++redClicks);
        socket.emit("redCPS", getCPS(redClickHist));  // socket to maintain only impactful transmission
      } else {
        io.emit("greenClick", ++greenClicks);
        socket.emit("greenCPS", getCPS(greenClickHist));
      }
    });
  }
});

// update click history for cps calc
setInterval(() => {
  redClickHist = [...redClickHist, redClicks].slice(1);
  greenClickHist = [...greenClickHist, greenClicks].slice(1);
  io.emit("redCPS", getCPS(redClickHist));
  io.emit("greenCPS", getCPS(greenClickHist));
}, CPS_UPD_INTERVAL_MS);

server.listen(PORT, () => {
  if (__PRODUCTION__) console.log("App listening on port", PORT);
  else console.log(`App listening at http://localhost:3001`);
});
