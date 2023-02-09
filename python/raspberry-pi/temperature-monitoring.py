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
renew_socket_connection_timeout_in_seconds = 300

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
    requests.put(f'{os.environ.get("MEROSS_FLASK_HOST")}/raspberry-pi/reset', headers={'X-API-KEY': os.environ.get("MEROSS_FLASK_API_KEY")})

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
    print(f"{str(datetime.now())} - C: {cTemp} | F: {fTemp} | H: {humidity}")

    temperatureRecording = {
            'id': str(uuid.uuid4()),
            'temperature': cTemp,
            'humidity': humidity,
            'timeReceived': str(datetime.now())
    }
    return temperatureRecording

async def main():
    socketHost = os.environ.get("SOCKET_HOST")
    timeLastConnected = datetime.now()

    while(1):
        try:
            await asyncio.sleep(3)

            # Try read temperature first, i2c bus might be stuck and causing chaos, so this will at least cause a reset if it throws
            temperature_recording = read_sensor_values()

            # After long periods of running, socket reports connected although server does not receive emitted events.
            # This will simply force closing and then re-open a new connection after a certain time has elapsed.
            if(sio.connected and (datetime.now() - timeLastConnected).total_seconds() >= renew_socket_connection_timeout_in_seconds):
                print(f"{str(datetime.now())} - Renew socket timeout reached, disconnecting from socket server")
                await sio.disconnect()

            if (not sio.connected):
                print(f"{str(datetime.now())} - Attempting to connect to socket server...")
                await sio.connect(f'{socketHost}?deviceId=1&monitoringGroupId=1')
                timeLastConnected = datetime.now()

            if (sio.connected):
                await sio.emit('send-temperature-recording', temperature_recording)

        except IOError:
            # I2c bus will start timing out as clock pin can get stuck low, 
            print(f"{str(datetime.now())} - I/O error, likely i2c bus is dead, attempting to reset...")
            reset_i2c_bus()
            print(f"{str(datetime.now())} - Reset complete")
        except Exception as e:
            print(f"{str(datetime.now())} - Exception caught: {str(e)}")

asyncio.run(main())  # main loop