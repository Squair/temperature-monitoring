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

type HeaterState = "Undiscovered" | "On" | "Off"

let heaterState: HeaterState = "Undiscovered";

const deviceMetadata: {
    [key: string]: {
        mostRecentRecording?: ITemperatureRecording;
        targetTemperature?: number
    }
} = {}

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

const updateHeaterState = async (recording: ITemperatureRecording, deviceId: string) => {
    const targetTemperature = deviceMetadata[deviceId].targetTemperature;

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

const handleTargetTemperatureChange = async (targetTemperature: number, monitoringGroupId: string, deviceId: string) => {
    targetTemperature = targetTemperature;
    deviceMetadata[deviceId] = { ...deviceMetadata[deviceId], targetTemperature };

    if (!deviceMetadata[deviceId] || !deviceMetadata[deviceId]?.mostRecentRecording) return;

    await updateHeaterState(deviceMetadata[deviceId].mostRecentRecording, deviceId);
    io.to(monitoringGroupId).emit("heater-state-update", heaterState == 'On');    
}

const handleSendTemperatureRecording = async (recording: ITemperatureRecording, socket: Socket, deviceId: string, monitoringGroupId: string) => {
    deviceMetadata[deviceId] = { ...deviceMetadata[deviceId], mostRecentRecording: recording };
    await updateHeaterState(recording, deviceId);
    
    socket.to(monitoringGroupId).emit("recieve-temperature-recording", recording);
    socket.to(monitoringGroupId).emit("heater-state-update", heaterState == 'On');
}

io.on("connection", (socket) => {
    // Determine who is connecting
    const deviceId = socket.handshake.query.deviceId as string;
    const userId = socket.handshake.query.userId as string;
    const monitoringGroupId = socket.handshake.query.monitoringGroupId as string;

    console.log("Incoming connection...");

    if (deviceId) {
        console.log("Temperature node connected.");
        socket.join(monitoringGroupId);

        socket.on("send-temperature-recording",
            (recording: ITemperatureRecording) => handleSendTemperatureRecording(recording, socket, deviceId, monitoringGroupId));

    } else if (userId) {
        console.log("User connected.");
        socket.join(monitoringGroupId);

        socket.on("target-temperature-change", (settings) => handleTargetTemperatureChange(settings.targetTemperature, monitoringGroupId, "1"));
    }

    // This will emulate events being recieved and broadcast, for testing purposes only.
    if (process.env.USE_EVENT_STUBS === "true") {
        console.log("Using event stubs");

        useStubTemperatureRecordingEvents(socket, monitoringGroupId, 5000);
    }

    socket.on("disconnect", () => { });
});