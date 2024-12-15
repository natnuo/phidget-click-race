export type InitSetup = {
  gameMode: "First to Target",
  target: number,
} | {
  gameMode: "Most in Time",
  time: number,
} | {
  gameMode: "Neverending",
};
