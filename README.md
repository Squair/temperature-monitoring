# temperature-monitoring
A system for monitoring temperature recording devices in real-time.

# PI Setup
 - Copy .env.sample to .env, populate values
 - Install pip and get following modules as root user (Will put into requirements.txt eventually)
    - pip install aiohttp
    - pip install python-socketio
    - pip install python-dotenv
    - pip install requests

 ## Config setup   
   ### How to run script on startup of raspberry-pi
      - `sudo nano /etc/rc.local`
    
      Add following line just before `exit 0`:
      - `sudo python3 /home/pi/temperature-monitoring.py > /home/pi/output.log &`

   ### Installing the I2C Tools to your Raspberry Pi
      - Edit the boot config file with: `sudo nano /boot/config.txt`
      - Add `dtparam=i2c1=on` and save to enable i2c on the pi.

      Run the following commands to install the required packages that the script requires to interact with GPIO pins over the i2c interface.
      - `sudo apt update sudo apt full-upgrade`
      - `sudo apt install -y i2c-tools python3-smbus`
      - `sudo reboot` 

      #### View devices listening on addresses
      - `sudo i2cdetect -y 1`
      - `sudo i2cdetect -y 0`

# PI diagnosing issues
## See events raised
dmesg

## I/O Timeout errors
If you get connection timeout errors [110] from the python script, it's likely that the clock pin was held in a low state and a value was attempted to be read from it. When this happens, the i2c bus fails to scan and the only way to resolve is via a hard reset. This typically happens if there are two scripts running, both interacting with the same pin, you'll enter a race condition where one script writes to the pin and another reads the value, when the other scripts goes to read the value again it can't and causes a world of hurt, can't recover without a hard reboot.

## See gpio pin values
raspi-gpio get 2-3


# Front-end setup
TBC

# Back-end setup
TBC