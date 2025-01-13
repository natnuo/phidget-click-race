import socketio
from Phidget22.Phidget import *
from Phidget22.Devices.DigitalInput import *
from Phidget22.Devices.DigitalOutput import *

SERVER_ADDRESS = "https://phidget1.ntao.dev"

ports = {
    "redButton": 0,
    "greenButton": 5,
    "redLED": 1,
    "greenLED": 4
}

devices = {
    "redButton": DigitalInput(),
    "greenButton": DigitalInput(),
    "redLED": DigitalOutput(),
    "greenLED": DigitalOutput()
}

for name, device in devices.items():
    device.setHubPort(ports[name])
    device.setIsHubPortDevice(True)
    device.openWaitForAttachment(1000)

def pginput():
    lastRedState = False
    lastGreenState = False
    
    redClicked = False
    greenClicked = False
    
    while (True):
        currRedState = devices["redButton"].getState()
        currGreenState = devices["greenButton"].getState()
        
        if (lastRedState and not currRedState):  # register clicks on release
            redClicked = True
        if (lastGreenState and not currGreenState):
            greenClicked = True
        
        if (
            (not currRedState and not currGreenState) and
            (redClicked or greenClicked)
        ):
            return (redClicked, greenClicked)
        
        lastRedState = currRedState
        lastGreenState = currGreenState

with socketio.SimpleClient() as sio:
        sio.connect(SERVER_ADDRESS, headers={ "user": '{ "username": "", "email": "", "type": "clicker" }' })

        while (True):
                red, green = pginput()
                if (red): sio.emit("click", "red")
                if (green): sio.emit("click", "green")
