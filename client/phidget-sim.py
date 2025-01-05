import socketio

SERVER_ADDRESS = "https://phidget1.ntao.dev";


with socketio.SimpleClient() as sio:
        sio.connect(SERVER_ADDRESS, headers={ "user": '{ "username": "", "email": "", "type": "clicker" }' })

        while (True):
                red, green = map(bool, map(int, input()))
                if (red): sio.emit("click", "red")
                if (green): sio.emit("click", "green")
