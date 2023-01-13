import os

from dotenv import load_dotenv
from meross_iot.http_api import MerossHttpClient
from meross_iot.manager import MerossManager

from flask import Flask

load_dotenv()

EMAIL = os.environ.get('MEROSS_EMAIL') or "YOUR_MEROSS_CLOUD_EMAIL"
PASSWORD = os.environ.get('MEROSS_PASSWORD') or "YOUR_MEROSS_CLOUD_PASSWORD"

app = Flask(__name__)

@app.route("/turnOn")
async def turnOn():
    # Setup the HTTP client API from user-password
    http_api_client = await MerossHttpClient.async_from_user_password(email=EMAIL, password=PASSWORD)
    
    # Setup and start the device manager
    manager = MerossManager(http_client=http_api_client)
    await manager.async_init()
    
    # Retrieve all the MSS310 devices that are registered on this account
    await manager.async_device_discovery()
    plugs = manager.find_devices(device_type="mss310")

    if len(plugs) < 1:
        print("No MSS310 plugs found...")
    else:
        # Turn it on channel 0
        # Note that channel argument is optional for MSS310 as they only have one channel
        dev = plugs[0]

        # The first time we play with a device, we must update its status
        await dev.async_update()

        # We can now start playing with that
        print(f"Turning on {dev.name}...")
        await dev.async_turn_on(channel=0)

    # Close the manager and logout from http_api
    manager.close()
    await http_api_client.async_logout()
    return "Turned on heater"

@app.route("/turnOff")
async def turnOff():
    # Setup the HTTP client API from user-password
    http_api_client = await MerossHttpClient.async_from_user_password(email=EMAIL, password=PASSWORD)
    
    # Setup and start the device manager
    manager = MerossManager(http_client=http_api_client)
    await manager.async_init()
    
    # Retrieve all the MSS310 devices that are registered on this account
    await manager.async_device_discovery()
    plugs = manager.find_devices(device_type="mss310")

    if len(plugs) < 1:
        print("No MSS310 plugs found...")
    else:
        # Turn it on channel 0
        # Note that channel argument is optional for MSS310 as they only have one channel
        dev = plugs[0]

        # The first time we play with a device, we must update its status
        await dev.async_update()

        # We can now start playing with that
        print(f"Turning off {dev.name}...")
        await dev.async_turn_off(channel=0)

    # Close the manager and logout from http_api
    manager.close()
    await http_api_client.async_logout()
    return "Turned off heater"

if __name__ == "__main__":
    from waitress import serve
    serve(app, host="localhost", port=8080)