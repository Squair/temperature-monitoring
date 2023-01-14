# temperature-monitoring
A system for monitoring temperature recording devices in real-time.

# PI Setup
 - Copy .env.sample to .env, populate values
 - Install pip and get following modules as root user
    - pip install aiohttp
    - pip install python-socketio
    - pip install python-dotenv

 - Installing the I2C Tools to your Raspberry Pi
    - sudo apt update sudo apt full-upgrade
    - sudo apt install -y i2c-tools python3-smbus
    - sudo raspi-config
    - sudo reboot
    - sudo i2cdetect -y 1
    - sudo i2cdetect -y 0

# Front-end setup

# Back-end setup