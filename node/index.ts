import { config } from 'dotenv';
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from 'uuid';

// Load variables from .env into process
config();

const allowedOrigins = process.env.ALLOWED_ORIGINS;
const port = process.env.PORT;

const io = new Server(parseInt(port), { cors: { origin: allowedOrigins } });

interface ITemperatureRecording {

}

io.on("connection", (socket) => {
    // Determine who is connecting
    const deviceId = socket.handshake.query.deviceId as string;
    const userId = socket.handshake.query.userId as string;
    const monitoringGroupId = socket.handshake.query.monitoringGroupId as string;

    if (deviceId) {
        socket.on("send-temperature-recording", 
                 (recording: ITemperatureRecording) => io.to(monitoringGroupId).emit("recieve-temperature-recording", recording));

    } else if (userId) {
        socket.join(monitoringGroupId);
    }

    socket.on("disconnect", () => {});
});