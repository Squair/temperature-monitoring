import { Settings as SettingsIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import chroma from "chroma-js";
import { useEffect, useState } from 'react';
import { io, Socket } from "socket.io-client";
import TemperatureDisplay from './components/TemperatureDisplay';
import { getTargetTemperatureCacheKey, unitCacheKey } from './constants';
import { ITemperatureRecording } from './interface/ITemperatureRecording';
import { IUserSettings } from './interface/IUserSettings';
import SettingsDashboard from './SettingsDashboard';
import { Unit } from './type/Unit';

const App = () => {
  const [socket, setSocket] = useState<Socket>();
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [heaterState, setHeaterState] = useState<boolean>();
  const [currentTemperature, setCurrentTemperature] = useState<ITemperatureRecording>();
  const [userSettings, setUserSettings] = useState<IUserSettings>({ unit: 'celsius', targetTemperature: 70 });
  const [backgroundColor, setBackgroundColor] = useState<string>();

  const deviceId = "1234";

  const targetTemperatureCacheKey = getTargetTemperatureCacheKey(deviceId);

  const totalColourScale = 100;
  const minimumTemperature = 13;
  const colors = chroma.scale(["#4287f5", "#f54242"]).colors(totalColourScale);

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
      setSocket(io(import.meta.env.VITE_SOCKET_HOST, { query: { userId: "1", monitoringGroupId: "1" } }));
    }

    socket?.on("recieve-temperature-recording", (recording: ITemperatureRecording) => setCurrentTemperature(recording));
    socket?.on("heater-state-update", (state: boolean) => setHeaterState(state));

    // Disconnect socket when component unmounts
    return () => { socket?.disconnect() }
  }, [socket]);
  
  useEffect(() => {
    if (!currentTemperature) return;

    // When receiving temperature, calculate the color for the progress

    const range = Math.max(1, userSettings.targetTemperature - minimumTemperature);
    const correctedValue = currentTemperature.temperature - minimumTemperature;
    const progressPercentage = Math.max(0, Math.floor((correctedValue * 100) / range));

    setBackgroundColor(colors[Math.min(colors.length - 1, progressPercentage)]);
  }, [currentTemperature, userSettings.targetTemperature])

  const toggleSettings = () => setShowSettings(!showSettings);

  const handleUserSettingsChange = async (settings: IUserSettings, emit: boolean) => {
    setUserSettings(settings);
    if (emit) {
      socket?.emit("target-temperature-change", { targetTemperature: settings.targetTemperature });
    }
  }

  // Color shifting background, warm / cool gradiant, dependant on current temp and target temp
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'absolute' }}>
        {currentTemperature && <h4 style={{ paddingLeft: '0.5em' }}>Last received: {new Date(currentTemperature.timeReceived).toLocaleString()}</h4>}
        <IconButton onClick={toggleSettings} >
          <SettingsIcon />
        </IconButton>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', width: '100%' }}>
        <SettingsDashboard open={showSettings} deviceId={deviceId} userSettings={userSettings} handleUserSettingsChange={handleUserSettingsChange} />
        {socket && currentTemperature && !showSettings && <TemperatureDisplay currentTemperature={currentTemperature} unit={userSettings.unit} />}
        {(!socket || !socket.connected) && <h3 style={{ textAlign: 'center'}}>Searching for devices...</h3>}
      </div>

      <h4 style={{ position: 'absolute', bottom: 0, right: 0, paddingRight: '0.5em' }}>Heating {heaterState ? 'on 🔥' : 'off ❄️'}</h4>
    </div>
  )
}

export default App;
