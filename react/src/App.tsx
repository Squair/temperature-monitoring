import { Settings as SettingsIcon, QueryStats as QueryStatsIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import chroma from "chroma-js";
import { useEffect, useState } from 'react';
import { io, Socket } from "socket.io-client";
import RealtimeTemperatureChart from './components/RealtimeTemperatureChart';
import TemperatureDisplay from './components/TemperatureDisplay';
import { getTargetTemperatureCacheKey, getTargetTemperatureToleranceCacheKey, unitCacheKey } from './constants';
import { ITemperatureRecording } from './interface/ITemperatureRecording';
import { IUserSettings } from './interface/IUserSettings';
import SettingsDashboard from './SettingsDashboard';
import { Unit } from './type/Unit';

const App = () => {
  const [socket, setSocket] = useState<Socket>();
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showChart, setShowChart] = useState<boolean>(false);
  const [heaterState, setHeaterState] = useState<boolean>();
  const [temperatures, setTemperatures] = useState<ITemperatureRecording[]>();
  const [userSettings, setUserSettings] = useState<IUserSettings>({ unit: 'celsius', targetTemperature: 18, targetTemperatureTolerance: 1 });
  const [backgroundColor, setBackgroundColor] = useState<string>();

  const [isTrendingHigher, setIsTrendingHigher] = useState<{ temperature: boolean, humidity: boolean }>({ temperature: false, humidity: false });

  const currentTemperature = temperatures ? temperatures[0] : undefined;

  const deviceId = "1";

  const targetTemperatureCacheKey = getTargetTemperatureCacheKey(deviceId);
  const targetTemperatureToleranceCacheKey = getTargetTemperatureToleranceCacheKey(deviceId);

  const totalColourScale = 100;
  const minimumTemperature = 13;
  const colors = chroma.scale(["#4287f5", "#f54242"]).colors(totalColourScale);

  // Read existing settings on mount.
  useEffect(() => {
    const cachedTargetTemperature = localStorage.getItem(targetTemperatureCacheKey);
    const cacheTargetTemperatureTolerance = localStorage.getItem(targetTemperatureToleranceCacheKey);
    const cachedUnit = localStorage.getItem(unitCacheKey) as Unit;
    const parsedTargetTemperature = parseInt(cachedTargetTemperature ?? "0");
    const parsedTargetTemperatureTolerance = parseInt(cacheTargetTemperatureTolerance ?? "0");

    setUserSettings({
      targetTemperature: parsedTargetTemperature,
      targetTemperatureTolerance: parsedTargetTemperatureTolerance,
      unit: cachedUnit
    });
  }, []);

  useEffect(() => {
    // Connect to socket server
    if (!socket) {
      setSocket(io(import.meta.env.VITE_SOCKET_HOST, { query: { userId: "1", monitoringGroupId: "1" } }));
    }

    socket?.on("recieve-temperature-recording",
      (recording: ITemperatureRecording | ITemperatureRecording[]) => Array.isArray(recording)
        ? setTemperatures(temps => [...recording, ...temps ?? []])
        : setTemperatures(temps => [recording, ...temps ?? []])
    );

    socket?.on("heater-state-update", (state: boolean) => setHeaterState(state));

    // Disconnect socket when component unmounts
    return () => { socket?.disconnect() }
  }, [socket]);

  useEffect(() => {
    if (!temperatures) return;

    // When receiving temperature, calculate the color for the progress

    const range = Math.max(1, userSettings.targetTemperature - minimumTemperature);
    const correctedValue = temperatures[0].temperature - minimumTemperature;
    const progressPercentage = Math.max(0, Math.floor((correctedValue * 100) / range));

    setBackgroundColor(colors[Math.min(colors.length - 1, progressPercentage)]);
  }, [temperatures, userSettings.targetTemperature])

  const toggleSettings = () => setShowSettings(!showSettings);
  const toggleChart = () => setShowChart(!showChart);

  const handleUserSettingsChange = async (settings: IUserSettings, emit: boolean) => {
    setUserSettings(settings);
    if (emit) {
      socket?.emit("user-settings-change", { ...userSettings, targetTemperatureTolerance: userSettings.targetTemperatureTolerance / 2 });
    }
  }

  const averageTemperatures = (temperatures: ITemperatureRecording[]) => temperatures.map(t => t.temperature).reduce((x, i) => x + i, 0) / temperatures.length;
  const averageHumidities = (temperatures: ITemperatureRecording[]) => temperatures.map(t => t.humidity).reduce((x, i) => x + i, 0) / temperatures.length;

  useEffect(() => {
    if (!temperatures || !currentTemperature) return;
    const isTemperatureTrendingHigher = currentTemperature.temperature >= averageTemperatures(temperatures);
    const isHumidityTrendingHigher = currentTemperature.humidity >= averageHumidities(temperatures);

    if (temperatures.length == 1 || temperatures.length % 3 === 0) {
      setIsTrendingHigher({ temperature: isTemperatureTrendingHigher, humidity: isHumidityTrendingHigher });
    }

  }, [temperatures]);


  // Color shifting background, warm / cool gradiant, dependant on current temp and target temp
  return (
    <div style={{ display: 'flex', gap: '1em', flexDirection: 'column', height: '100%', width: '100%', backgroundColor }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'absolute' }}>
        <h4 style={{ paddingLeft: '0.5em' }}>Last received: {temperatures ? new Date(temperatures[0].timeReceived).toLocaleString() : "unknown"}</h4>

        <div>
          <IconButton onClick={toggleChart} >
            <QueryStatsIcon />
          </IconButton>
          <IconButton onClick={toggleSettings} >
            <SettingsIcon />
          </IconButton>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', width: '100%' }}>
        <SettingsDashboard open={showSettings} deviceId={deviceId} userSettings={userSettings} handleUserSettingsChange={handleUserSettingsChange} />
        {socket && temperatures && !showSettings && !showChart && <TemperatureDisplay temperatures={temperatures} unit={userSettings.unit} isTrendingHigher={isTrendingHigher} />}
        {(!socket || !socket.connected) && <h3 style={{ textAlign: 'center' }}>Searching for devices...</h3>}
        {temperatures && showChart && <RealtimeTemperatureChart series={[{ data: temperatures.map(t => ({ x: t.timeReceived, y: t.temperature })) }]} />}

        {!showChart && <h4 style={{ position: 'absolute', bottom: 0, right: 0, paddingRight: '0.5em' }}>Heating {heaterState ? 'on 🔥' : 'off ❄️'}</h4>}
      </div>


    </div>
  )
}

export default App;
