import axios from 'axios';
import { config } from 'dotenv';
import { Server, Socket } from "socket.io";

// Load variables from .env into process
config();

const allowedOrigins = process.env.ALLOWED_ORIGINS;
const port = process.env.PORT;

const io = new Server(parseInt(port), { cors: { origin: "*" } });
const pollingRateInSeconds = 3;

type HeaterState = "Undiscovered" | "On" | "Off"

let stubsInvoked = false;
let heaterState: HeaterState = "Undiscovered";

const deviceMonitoringGroupMetadata: {
    [monitoringGroupId: string]: {
        recordings?: ITemperatureRecording[];
        targetTemperature?: number;
        targetTemperatureTolerance?: number;
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
    targetTemperatureTolerance: number;
}

const updateHeaterState = async (recording: ITemperatureRecording, monitoringGroupId: string) => {
    const { targetTemperature, targetTemperatureTolerance } = deviceMonitoringGroupMetadata[monitoringGroupId];

    if (recording.temperature < targetTemperature && (heaterState == 'Off' || heaterState == 'Undiscovered')) {
        // call api to turn on heater
        const response = await axios.put(`${process.env.MEROSS_HOST}/heater?state=1`);
        if (response.status === 200) {
            heaterState = 'On';
        }
    
    // Only turn off after temperature reaches target temp including the tolerance for buffer to stop turning on / off rapidly
    } else if (recording.temperature > (targetTemperature + targetTemperatureTolerance) && (heaterState == 'On' || heaterState == 'Undiscovered')) {
        // call api to turn off heater
        const response = await axios.put(`${process.env.MEROSS_HOST}/heater?state=0`);
        if (response.status === 200) {
            heaterState = 'Off';
        }
    }
}

const handleUserSettingsChange = async (settings: IUserSettings, monitoringGroupId: string) => {
    await handleTargetTemperatureChange(settings.targetTemperature, monitoringGroupId);
    await handleTargetTemperatureToleranceChange(settings.targetTemperatureTolerance, monitoringGroupId);
}

const handleTargetTemperatureChange = async (targetTemperature: number, monitoringGroupId: string) => {
    deviceMonitoringGroupMetadata[monitoringGroupId] = { ...deviceMonitoringGroupMetadata[monitoringGroupId], targetTemperature };

    if (!deviceMonitoringGroupMetadata[monitoringGroupId] || !deviceMonitoringGroupMetadata[monitoringGroupId]?.recordings) return;

    await updateHeaterState(deviceMonitoringGroupMetadata[monitoringGroupId].recordings[0], monitoringGroupId);
    io.to(monitoringGroupId).emit("heater-state-update", heaterState == 'On');
}

const handleTargetTemperatureToleranceChange = async (targetTemperatureTolerance: number, monitoringGroupId: string) => {
    deviceMonitoringGroupMetadata[monitoringGroupId] = { ...deviceMonitoringGroupMetadata[monitoringGroupId], targetTemperatureTolerance };
}

const handleSendTemperatureRecording = async (recording: ITemperatureRecording, socket: Socket, monitoringGroupId: string) => {    
    if (deviceMonitoringGroupMetadata[monitoringGroupId]) {
        deviceMonitoringGroupMetadata[monitoringGroupId] = { 
            ...deviceMonitoringGroupMetadata[monitoringGroupId], 
            recordings: [recording, ...deviceMonitoringGroupMetadata[monitoringGroupId]?.recordings ?? []] 
        };    
    } else {
        deviceMonitoringGroupMetadata[monitoringGroupId] = { 
            recordings: [recording] 
        };    
    }

    // Only keep the last 4 hours worth of recordings in memory as eco dyno max is 512mb
    // 4 hours worth of recordings every three seconds should be around 312mb
    if (deviceMonitoringGroupMetadata[monitoringGroupId].recordings.length > (4 * 60 * 60) / pollingRateInSeconds) {
        deviceMonitoringGroupMetadata[monitoringGroupId].recordings.pop();
    }

    await updateHeaterState(recording, monitoringGroupId);

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
            (recording: ITemperatureRecording) => handleSendTemperatureRecording(recording, socket, monitoringGroupId));

    } else if (userId) {
        console.log("User connected.");
        socket.join(monitoringGroupId);

        socket.on("user-settings-change", (settings: IUserSettings) => handleUserSettingsChange(settings, monitoringGroupId));

        // Send most recent recordings straight away rathert than waiting for next recording to come through.
        if (deviceMonitoringGroupMetadata[monitoringGroupId]?.recordings) {
            io.to(monitoringGroupId).emit("recieve-temperature-recording", deviceMonitoringGroupMetadata[monitoringGroupId]?.recordings);
        }
    }

    // This will emulate events being recieved and broadcast, for testing purposes only.
    if (process.env.USE_EVENT_STUBS === "true" && !stubsInvoked) {
        console.log("Using event stubs");
        stubsInvoked = true;
        useStubTemperatureRecordingEvents(socket, monitoringGroupId, 5000);
    }

    socket.on("disconnect", () => { });
});

const useStubTemperatureRecordingEvents = async (socket: Socket, roomId: string, delayInMilliseconds: number) => {
    let i = 0;
    while (i++ <= 35) {
        
        i >= 35 ? 0 : i;

        const tr: ITemperatureRecording = {
            id: i.toString(),
            humidity: i + Math.random(),
            temperature: i + Math.random(),
            timeReceived: new Date()
        }

        await handleSendTemperatureRecording(tr, socket, roomId);
        await new Promise(r => setTimeout(r, delayInMilliseconds));
    }
}