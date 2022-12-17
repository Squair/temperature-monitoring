import { Settings as SettingsIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import chroma from "chroma-js";
import { useEffect, useState } from 'react';
import { io, Socket } from "socket.io-client";
import TemperatureDisplay from './components/TemperatureDisplay';
import { getTargetTemperatureCacheKey, unitCacheKey } from './constants';
import { useTemperatureUtilities } from './hooks/useTemperatureUtilities';
import { ITemperatureRecording } from './interface/ITemperatureRecording';
import { IUserSettings } from './interface/IUserSettings';
import SettingsDashboard from './SettingsDashboard';
import { Unit } from './type/Unit';

const App = () => {
  const [socket, setSocket] = useState<Socket>();
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [currentTemperature, setCurrentTemperature] = useState<ITemperatureRecording>({ id: "1", humidity: 2, temperature: 35, timeReceived: new Date() });
  const [userSettings, setUserSettings] = useState<IUserSettings>({ unit: 'celsius', targetTemperature: 70 });
  const [backgroundColour, setBackgroundColour] = useState<string>();

  const deviceId = "1234";

  const targetTemperatureCacheKey = getTargetTemperatureCacheKey(deviceId);

  const totalColourScale = 100;
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

    socket?.on("recieve-temperature-recording", (recording: ITemperatureRecording) => {
      setCurrentTemperature(recording);

    });

    // Disconnect socket when component unmounts
    return () => { socket?.disconnect() }
  }, [socket]);

  useEffect(() => {
    if (!currentTemperature) return;

    // When receiving temperature, calculate the color for the progress
    const progressPercentage = Math.min(colors.length - 1, Math.floor((currentTemperature.temperature / userSettings.targetTemperature) * 100));
    setBackgroundColour(colors[progressPercentage]);
  }, [currentTemperature, userSettings.targetTemperature])

  const toggleSettings = () => setShowSettings(!showSettings);

  // Color shifting background, warm / cool gradiant, dependant on current temp and target temp
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', backgroundColor: backgroundColour }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <IconButton onClick={toggleSettings}>
          <SettingsIcon />
        </IconButton>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', width: '100%' }}>
        <SettingsDashboard open={showSettings} deviceId={deviceId} userSettings={userSettings} setUserSettings={setUserSettings} />
        {currentTemperature && <TemperatureDisplay currentTemperature={currentTemperature} unit={userSettings.unit} />}
      </div>
    </div>
  )
}

export default App;
