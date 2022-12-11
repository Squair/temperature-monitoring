import { useEffect, useState } from 'react'
import { io, Socket } from "socket.io-client";
import { ITemperatureRecording } from './interface/ITemperatureRecording';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import SettingsDashboard from './SettingsDashboard';
import chroma from "chroma-js";
import { IUserSettings } from './interface/IUserSettings';
import { getTargetTemperatureCacheKey, unitCacheKey } from './constants';
import { Unit } from './type/Unit';

const App = () => {
  const [socket, setSocket] = useState<Socket>();
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [temperatureRecording, setTemperatureRecording] = useState<ITemperatureRecording>();
  const [userSettings, setUserSettings] = useState<IUserSettings>({ unit: 'celsius', targetTemperature: 70 });

  const deviceId = "1234";

  const targetTemperatureCacheKey = getTargetTemperatureCacheKey(deviceId);

  const totalColourScale = 100;
  const colours = chroma.scale(["#4287f5", "#f54242"]).colors(totalColourScale);

  // Read existing settings on mount.
  useEffect(() => {    
    const cachedTargetTemperature = localStorage.getItem(targetTemperatureCacheKey);
    const cachedUnit = localStorage.getItem(unitCacheKey) as Unit;
    const parsedTargetTemperature = parseInt(cachedTargetTemperature ?? "0");

    setUserSettings({ targetTemperature: parsedTargetTemperature, unit: cachedUnit });
  }, []);

  useEffect(() => {
    // Connect to socket server
    if (!socket) {
      setSocket(io(import.meta.env.VITE_SOCKET_HOST));
    }

    socket?.on("send-temperature-recording", (recording: ITemperatureRecording) => setTemperatureRecording(recording));

    // Disconnect socket when component unmounts
    return () => { socket?.disconnect() }
  }, [socket]);

  const toggleSettings = () => setShowSettings(!showSettings);

  // Color shifting background, warm / cool gradiant, dependant on current temp and target temp
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <IconButton onClick={toggleSettings}>
          <SettingsIcon />
        </IconButton>
      </div>

      <SettingsDashboard open={showSettings} deviceId={deviceId} userSettings={userSettings} setUserSettings={setUserSettings} />

      {temperatureRecording && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <p>Temperature: {temperatureRecording.temperature.toString()}</p>
          <p>Humidity: {temperatureRecording.humidity.toString()}</p>
        </div>
      )}
    </div>
  )
}

export default App;
