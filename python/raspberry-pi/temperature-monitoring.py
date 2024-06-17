import time
import socketio
import asyncio
import uuid
from datetime import datetime
from dotenv import load_dotenv
import os
import smbus
import RPi.GPIO as GPIO

load_dotenv()
sio = socketio.AsyncClient(False)
i2c_address = 0x44
i2c_clock_pin = 0x03
renew_socket_connection_timeout_in_seconds = 300


def read_sensor_values():
    bus = smbus.SMBus(1)
    
    # We have to first write to the address before we can read it
    # Otherwise it will hold GPIO 3 low and causes timeouts on the i2c scan
    bus.write_i2c_block_data(i2c_address, 0x2C, [0x06])

    time.sleep(0.5)
    
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

async def connect_to_socket_server_with_retry():
    socketHost = os.environ.get("SOCKET_HOST")
    connectTimeoutInSeconds = 10
    connected = False
    
    while(not connected):
        print(f"{str(datetime.now())} - Attempting to connect to socket server...") 

        timeoutTask = asyncio.create_task(asyncio.sleep(connectTimeoutInSeconds))
        socketConnectTask = asyncio.create_task(sio.connect(f'{socketHost}?deviceId=1&monitoringGroupId=1'))

        # Rarely its been seen that attempts to connect to socket server get stuck, despite it having an inbuilt retry mechanism
        # This will prevent that by returning after connectTimeoutInSeconds if the connect task hasnt finished.
        done, pending = await asyncio.wait(
            [timeoutTask, socketConnectTask], 
            return_when=asyncio.FIRST_COMPLETED
        )
        
        # cancel the other tasks
        for task in pending:
            task.cancel()

        for task in done:
            if (task is socketConnectTask):
                connected = True
                return
            elif(task is timeoutTask):
                print(f"{str(datetime.now())} - Timeout task reached after {connectTimeoutInSeconds} seconds while trying to connect to socket server, will retry...")

async def main(sio):
    timeLastConnected = datetime.now()

    while(1):
        try:      

            # After long periods of running, socket reports connected although server does not receive emitted events.
            # This will simply force closing and then re-open a new connection after a certain time has elapsed.
            if(sio.connected and (datetime.now() - timeLastConnected).total_seconds() >= renew_socket_connection_timeout_in_seconds):
                print(f"{str(datetime.now())} - Renew socket timeout reached, disconnecting from socket server")
                await sio.disconnect()      
            if (not sio.connected):
                await connect_to_socket_server_with_retry()
                timeLastConnected = datetime.now()

            if (sio.connected):
                print(f"{str(datetime.now())} - Sending recording to socket server...")
                temperature_recording = read_sensor_values()
                await sio.emit('send-temperature-recording', temperature_recording)
                
                # Sleep in between readings
                await sio.sleep(3)
            
        except IOError as ie:
            print(f"{str(datetime.now())} - I/O error caught: {str(ie)}")
        except Exception as e:
            print(f"{str(datetime.now())} - Exception caught: {str(e)}")

asyncio.run(main(sio))  # main loop