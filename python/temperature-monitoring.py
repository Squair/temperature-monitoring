import socketio
import asyncio
import uuid
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()
sio = socketio.AsyncClient()

@sio.event
def connect():
    print("Successfully connected to socket server.")

@sio.event
def connect_error(data):
    print("Could not connect to socket server")

@sio.event
def disconnect():
    print("Disconnected from socket server")

def read_sensor_values(i):
    temperatureRecording = {
            'id': str(uuid.uuid4()),
            'temperature': i,
            'humidity': i,
            'timeReceived': str(datetime.now())
    }
    return temperatureRecording

async def main():
    socketHost = os.environ.get("SOCKET_HOST")
    socketPort = os.environ.get("SOCKET_PORT")

    await sio.connect(f'http://{socketHost}:{socketPort}?deviceId=1&monitoringGroupId=1')
    
    i = 0
    while(1):
        i += 1

        if (sio.connected):
            await sio.emit('send-temperature-recording', read_sensor_values(i))
        await asyncio.sleep(3)

asyncio.run(main())  # main loop



