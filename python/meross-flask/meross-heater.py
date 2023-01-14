import os

from dotenv import load_dotenv
from meross_iot.http_api import MerossHttpClient
from meross_iot.manager import MerossManager

from flask import Flask

load_dotenv()

EMAIL = os.environ.get('MEROSS_EMAIL')
PASSWORD = os.environ.get('MEROSS_PASSWORD')
PORT = os.environ.get('PORT')
HOST = os.environ.get('HOST')

print(EMAIL)
print(PASSWORD)

app = Flask(__name__)

async def get_plugs(manager: MerossManager):
    await manager.async_init()
    
    # Retrieve all the MSS310 devices that are registered on this account
    await manager.async_device_discovery()
    return manager.find_devices(device_type="mss310")

async def close_connection(manager: MerossManager, httpClient: MerossHttpClient):
    # Close the manager and logout from http_api
    manager.close()
    await httpClient.async_logout()

@app.route("/heater/on")
async def heater_on():
    httpClient = await MerossHttpClient.async_from_user_password(email=EMAIL, password=PASSWORD)
    manager = MerossManager(http_client=httpClient)

    plugs = await get_plugs(manager)

    if len(plugs) < 1:
        print("No MSS310 plugs found...")
    else:
        # Turn it on channel 0
        # Note that channel argument is optional for MSS310 as they only have one channel
        device = plugs[0]

        # The first time we play with a device, we must update its status
        await device.async_update()

        print(f"Turning on {device.name}...")
        await device.async_turn_on(channel=0)

    await close_connection(manager, httpClient)
    return "Turned on heater"

@app.route("/heater/off")
async def heater_off():
    httpClient = await MerossHttpClient.async_from_user_password(email=EMAIL, password=PASSWORD)
    manager = MerossManager(http_client=httpClient)

    plugs = await get_plugs(manager)

    if len(plugs) < 1:
        print("No MSS310 plugs found...")
    else:
        # Turn it on channel 0
        # Note that channel argument is optional for MSS310 as they only have one channel
        device = plugs[0]

        # The first time we play with a device, we must update its status
        await device.async_update()

        print(f"Turning on {device.name}...")
        await device.async_turn_off(channel=0)

    await close_connection(manager, httpClient)
    return "Turned off heater"

if __name__ == "__main__":
    from waitress import serve
    serve(app, host=HOST, port=PORT)