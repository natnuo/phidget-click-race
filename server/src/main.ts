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

const __PRODUCTION__ = process.env.PRODUCTION === "Y";

const SSL_KEY = fs.readFileSync(process.env.SSL_KEY ?? path.resolve(__dirname, "../key.pem"));
const SSL_CERT = fs.readFileSync(process.env.SSL_CERT ?? path.resolve(__dirname, "../cert.pem"));
const PORT = __PRODUCTION__ ? 443 : 3001;

const app = express();

const server = __PRODUCTION__
  ? https.createServer({ key: SSL_KEY, cert: SSL_CERT }, app)
  : http.createServer(app);

const io = new Server(server);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, "../../client/build")));
app.use("/public", express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, `../../client/build`, "index.html"));
});

/////////////////////////////
// OPERATIONAL INFORMATION //
/////////////////////////////
let ONLINE_USERS: Set<User> = new Set();

io.on("connection", (socket) => {
  assert(typeof socket.handshake.query.user === "string");

  const user = JSON.parse(socket.handshake.query.user);
  assert(isUser(user));

  ONLINE_USERS.add(user);

  socket.on("disconnect", () => { ONLINE_USERS.delete(user); })
});


server.listen(PORT, () => {
  if (__PRODUCTION__) console.log("App listening on port", PORT);
  else console.log(`App listening at http://localhost:3001`);
});
