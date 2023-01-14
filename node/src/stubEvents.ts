import { Socket } from "socket.io";
import { ITemperatureRecording } from "..";

const useStubTemperatureRecordingEvents = async (socket: Socket, roomId: string, delayInMilliseconds: number) => {
    let i = 35;
    while (i++ <= 70) {
        
        i == 70 ? 35 : i;

        const tr: ITemperatureRecording = {
            id: i.toString(),
            humidity: i + Math.random(),
            temperature: i + Math.random(),
            timeReceived: new Date()
        }

        socket.to(roomId).emit("recieve-temperature-recording", tr);
        await new Promise(r => setTimeout(r, delayInMilliseconds));
    }
}

export { useStubTemperatureRecordingEvents }