import os

from dotenv import load_dotenv
from meross_iot.http_api import MerossHttpClient
from meross_iot.manager import MerossManager

from flask import Flask, request, jsonify

load_dotenv()

EMAIL = os.environ.get('MEROSS_EMAIL')
PASSWORD = os.environ.get('MEROSS_PASSWORD')
PORT = os.environ.get('PORT')
HOST = os.environ.get('HOST')

app = Flask(__name__)

startPower=''

async def get_plugs(manager: MerossManager):
    await manager.async_init()
    
    # Retrieve all the MSS310 devices that are registered on this account
    await manager.async_device_discovery()
    return manager.find_devices(device_type="mss310")

async def close_connection(manager: MerossManager, httpClient: MerossHttpClient):
    # Close the manager and logout from http_api
    manager.close()
    await httpClient.async_logout()

def is_authenticated(request):
    headers = request.headers
    auth = headers.get("X-Api-Key")
    return auth == os.environ.get('KEY')

@app.route("/heater")
async def heater_state_update():
    if (not is_authenticated(request)):
        return jsonify({"message": "ERROR: Unauthorized"}), 401
        
    state = request.args.get('state')

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

        if (state):
             print(f"Turning on the {device.name}...")
             await device.async_turn_on(channel=0)
             # Read the electricity power/voltage/current
             startPower = await device.async_get_instant_metrics()
        else:
            print(f"Turning off the {device.name}...")
            await device.async_turn_off(channel=0)
            endPower = await device.async_get_instant_metrics()
            print(f"Electricity consumption since on: {endPower}")

    await close_connection(manager, httpClient)
    return jsonify({"message": "Header turn on"}), 200

if __name__ == "__main__":
    from waitress import serve
    serve(app, host=HOST, port=PORT)