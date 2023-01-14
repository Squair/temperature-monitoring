import { config } from 'dotenv';
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from 'uuid';
import { useStubTemperatureRecordingEvents } from './src/stubEvents';
import axios from 'axios';

// Load variables from .env into process
config();

const allowedOrigins = process.env.ALLOWED_ORIGINS;
const port = process.env.PORT;

const io = new Server(parseInt(port), { cors: { origin: "*" } });
let targetTemperature = 18;

type HeaterState = "Undiscovered" | "On" | "Off"

let heaterState: HeaterState = "Undiscovered";

const deviceMostRecentTemperature: { [key: string]: ITemperatureRecording } = {}

axios.defaults.headers.common = {
    "X-API-Key": process.env.KEY,
};

export interface ITemperatureRecording {
    id: string;
    temperature: number;
    humidity: number;
    timeReceived: Date;
}

export interface IUserSettings {
    targetTemperature: number;
}

const updateHeaterState = async (recording: ITemperatureRecording) => {
    if (recording.temperature < targetTemperature && (heaterState == 'Off' || heaterState == 'Undiscovered')) {
        // call api to turn on heater
        const response = await axios.put(`${process.env.MEROSS_HOST}/heater?state=1`);
        if (response.status === 200) {
            heaterState = 'On';
        }
    } else if (recording.temperature > targetTemperature && (heaterState == 'On' || heaterState == 'Undiscovered')) {
        // call api to turn off heater
        const response = await axios.put(`${process.env.MEROSS_HOST}/heater?state=0`);
        if (response.status === 200) {
            heaterState = 'Off';
        }
    }
}

const handleTargetTemperatureChange = async (settings: IUserSettings, deviceId: string) => {
    targetTemperature = settings.targetTemperature;
    const recording = deviceMostRecentTemperature[deviceId];

    if (!recording) return;
    
    await updateHeaterState(recording);
}

const handleSendTemperatureRecording = async (recording: ITemperatureRecording, socket: Socket, deviceId: string, monitoringGroupId: string) => {
    socket.to(monitoringGroupId).emit("recieve-temperature-recording", recording);
    deviceMostRecentTemperature[deviceId] = recording;

    await updateHeaterState(recording);
}

io.on("connection", (socket) => {
    // Determine who is connecting
    const deviceId = socket.handshake.query.deviceId as string;
    const userId = socket.handshake.query.userId as string;
    const monitoringGroupId = socket.handshake.query.monitoringGroupId as string;

    console.log("Incoming connection...");

    deviceMostRecentTemperature[deviceId] = { id: "1", temperature: 12, humidity: 12, timeReceived: new Date() }

    if (deviceId) {
        console.log("Temperature node connected.");
        socket.join(monitoringGroupId);

        socket.on("send-temperature-recording",
            (recording: ITemperatureRecording) => handleSendTemperatureRecording(recording, socket, deviceId, monitoringGroupId));

    } else if (userId) {
        console.log("User connected.");
        socket.join(monitoringGroupId);

        socket.on("target-temperature-change", handleTargetTemperatureChange);
    }

    // This will emulate events being recieved and broadcast, for testing purposes only.
    if (process.env.USE_EVENT_STUBS === "true") {
        console.log("Using event stubs");

        useStubTemperatureRecordingEvents(socket, monitoringGroupId, 5000);
    }

    socket.on("disconnect", () => { });
});