import socketio
import asyncio

sio = socketio.AsyncClient()

@sio.event
def connect():
    print("I'm connected!")

@sio.event
def connect_error(data):
    print("The connection failed!")

@sio.event
def disconnect():
    print("I'm disconnected!")

async def Main():
    await sio.connect('http://localhost:3001?deviceId=1&monitoringGroupId=1')

    i = 0
    while(1):
        i += 1
        temperatureRecording = {
            'id': '1',
            'temperature': i,
            'humidity': '25',
            'timeReceived': '2022-12-19'
        }
        await sio.emit('send-temperature-recording', temperatureRecording)
        await asyncio.sleep(3)

asyncio.run(Main())  # main loop



