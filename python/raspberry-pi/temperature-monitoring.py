import time
import socketio
import asyncio
import uuid
from datetime import datetime
from dotenv import load_dotenv
import os
import smbus
import RPi.GPIO as GPIO
import requests

load_dotenv()
sio = socketio.AsyncClient()
i2c_address = 0x44
i2c_clock_pin = 0x03

@sio.event
def connect():
    print("Successfully connected to socket server.")

@sio.event
def connect_error(data):
    print("Could not connect to socket server")

@sio.event
def disconnect():
    print("Disconnected from socket server")

def reset_i2c_bus():
    # ideas: 
    # restart i2c drivers / modules
    # cycle power with another smart switch (bad)
    # try clock bit banging approach further
    # try a different lib other than smbus
    # write reset command to i2c address

    # GPIO.setmode(GPIO.BCM)
    # GPIO.setup(5, GPIO.OUT)
    # GPIO.output(5, GPIO.HIGH)

    # for i in range(10):
    #     time.sleep(0.35 / 1000000.0)  
    #     GPIO.output(5, GPIO.LOW)
    #     time.sleep(0.35 / 1000000.0)  
    #     GPIO.output(5, GPIO.HIGH)
    
    # Yes this is gross, but only way I've found to potentially recover i2c bus
    requests.put(f'{os.environ.get("MEROSS_FLASK_HOST")}/reset', headers={'X-API-KEY': os.environ.get("MEROSS_FLASK_API_KEY")})

def read_sensor_values():
    bus = smbus.SMBus(1)
    
    # SHT31 address, 0x44(68)
    bus.write_i2c_block_data(i2c_address, 0x2C, [0x06])

    time.sleep(0.5)
    # SHT31 address, 0x44(68)
    # Read data back from 0x00(00), 6 bytes
    # Temp MSB, Temp LSB, Temp CRC, Humididty MSB, Humidity LSB, Humidity CRC
    data = bus.read_i2c_block_data(i2c_address, 0x00, 6)
    
    # Convert the data
    temp = data[0] * 256 + data[1]
    cTemp = -45 + (175 * temp / 65535.0)
    fTemp = -49 + (315 * temp / 65535.0)
    humidity = 100 * (data[3] * 256 + data[4]) / 65535.0
    
    # Output data to screen
    print(f"{str(datetime.now())} - Temperature in Celsius is : %.2f C" %cTemp)
    print(f"{str(datetime.now())} - Temperature in Fahrenheit is : %.2f F" %fTemp)
    print(f"{str(datetime.now())} - Relative Humidity is : %.2f %%RH" %humidity)

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
            await asyncio.sleep(3)
            if (not sio.connected):
                await sio.connect(f'{socketHost}?deviceId=1&monitoringGroupId=1')

            if (sio.connected):
                await sio.emit('send-temperature-recording', read_sensor_values())
        except IOError:
            # I2c bus will start timing out as clock pin can get stuck low, 
            print(f"{str(datetime.now())} - I/O error, likely i2c bus is dead, attempting to reset...")
            reset_i2c_bus()
            print(f"{str(datetime.now())} - Reset complete")
        except Exception as e:
            print(f"{str(datetime.now())} - Exception caught: {str(e)}")
            await sio.disconnect()

asyncio.run(main())  # main loop