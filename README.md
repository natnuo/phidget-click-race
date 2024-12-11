<div align="center">
  <h1>Phlickr: <b>Ph</b>idget C<b>lick</b> <b>R</b>ace</h1>
  <p>An implementation for a multiplayer click race on the Phidget!</p>
</div>

## Running the Program

- First, you must have [Python3](https://www.python.org/downloads/) and [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed.
- Next, navigate to `./scripts`.
- If you just installed or updated Phlickr, run `install.bash`, then `build.bash`.
- Once the above steps are complete, create three terminals:
  - in one terminal, run `start_server.bash`, then
  - in the second terminal, run `start_client.bash`, and finally
  - in the third terminal, run `start_phidget.bash`.
  - If you do not have a Phidget on-hand, you may omit the `start_phidget.bash` script. Clicking on the colors of the client display can emulate the Phidget.

Congrats! You should now have Phlickr running.
