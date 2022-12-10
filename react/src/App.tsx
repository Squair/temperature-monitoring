import { useEffect, useState } from 'react'
import './App.css'
import { io, Socket } from "socket.io-client";
import { ITemperatureRecording } from './interface/ITemperatureRecording';

const App = () => {
  const [socket, setSocket] = useState<Socket>();
  const [temperatureRecording, setTemperatureRecording] = useState<ITemperatureRecording>();

  useEffect(() => {
    // Connect to socket server
    if (!socket) {
      setSocket(io(import.meta.env.VITE_SOCKET_HOST));
      return;
    }

    socket.on("send-temperature-recording", (recording: ITemperatureRecording) => setTemperatureRecording(recording));
  }, [socket]);

  return (
    <div className="App">
      {temperatureRecording && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <p>Temperature: {temperatureRecording.temperature.toString()}</p>
          <p>Humidity: {temperatureRecording.humidity.toString()}</p>
        </div>
      )}
    </div>
  )
}

export default App
