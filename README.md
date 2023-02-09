# temperature-monitoring
A system for monitoring temperature recording devices in real-time.


# PI Setup
 - Copy .env.sample to .env, populate values
 - Install pip and get following modules as root user
    - pip install aiohttp
    - pip install python-socketio
    - pip install python-dotenv
    - pip install requests

 - Config stuff
    - sudo nano /boot/config.txt
    - dtparam=i2c_arm=on,i2c_arm_baudrate=400000

 - Ensure script runs on boot:
    - sudo nano /etc/rc.local
    
    Add following line just before exit 0:
    - sudo python3 /home/pi/temperature-monitoring.py > /home/pi/output.log &

 - Installing the I2C Tools to your Raspberry Pi
    - sudo apt update sudo apt full-upgrade
    - sudo apt install -y i2c-tools python3-smbus
    - sudo raspi-config
    - sudo reboot
    - sudo i2cdetect -y 1
    - sudo i2cdetect -y 0
    # This might be be important, i2c actually dies after running for ages, no idea why but install this and soft reboot revived it...
    - sudo rpi-update 


# Front-end setup

# Back-end setup