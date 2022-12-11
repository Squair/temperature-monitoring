import { useEffect, useState } from 'react'
import { io, Socket } from "socket.io-client";
import { ITemperatureRecording } from './interface/ITemperatureRecording';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import SettingsDashboard from './SettingsDashboard';

const App = () => {
  const [socket, setSocket] = useState<Socket>();
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [temperatureRecording, setTemperatureRecording] = useState<ITemperatureRecording>();
  const deviceId = "1234";

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

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <IconButton onClick={toggleSettings}>
          <SettingsIcon />
        </IconButton>
      </div>

      <SettingsDashboard open={showSettings} deviceId={deviceId} />

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
