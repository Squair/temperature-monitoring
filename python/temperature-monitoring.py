import time
import socketio
import asyncio
import uuid
from datetime import datetime
from dotenv import load_dotenv
import os
import smbus

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

def read_sensor_values():
    bus = smbus.SMBus(1)
    
    # SHT31 address, 0x44(68)
    bus.write_i2c_block_data(0x44, 0x2C, [0x06])

    time.sleep(0.5)

    # SHT31 address, 0x44(68)
    # Read data back from 0x00(00), 6 bytes
    # Temp MSB, Temp LSB, Temp CRC, Humididty MSB, Humidity LSB, Humidity CRC
    data = bus.read_i2c_block_data(0x44, 0x00, 6)
    
    # Convert the data
    temp = data[0] * 256 + data[1]
    cTemp = -45 + (175 * temp / 65535.0)
    fTemp = -49 + (315 * temp / 65535.0)
    humidity = 100 * (data[3] * 256 + data[4]) / 65535.0
    
    # Output data to screen
    print("Temperature in Celsius is : %.2f C" %cTemp)
    print("Temperature in Fahrenheit is : %.2f F" %fTemp)
    print("Relative Humidity is : %.2f %%RH" %humidity)

    temperatureRecording = {
            'id': str(uuid.uuid4()),
            'temperature': cTemp,
            'humidity': humidity,
            'timeReceived': str(datetime.now())
    }
    return temperatureRecording

async def main():
    socketHost = os.environ.get("SOCKET_HOST")
    
    while(1):
        try:
            if (not sio.connected):
                await sio.connect(f'{socketHost}?deviceId=1&monitoringGroupId=1')
        except:
            print("Something went wrong while trying to connect to socket server.")

        if (sio.connected):
            await sio.emit('send-temperature-recording', read_sensor_values())
        await asyncio.sleep(3)

asyncio.run(main())  # main loop



