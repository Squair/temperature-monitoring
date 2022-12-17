import { FunctionComponent } from "react";
import { useTemperatureUtilities } from "../hooks/useTemperatureUtilities";
import { ITemperatureRecording } from "../interface/ITemperatureRecording";
import { Unit } from "../type/Unit";

interface TemperatureDisplayProps {
    currentTemperature: ITemperatureRecording;
    unit: Unit;
}

const TemperatureDisplay: FunctionComponent<TemperatureDisplayProps> = ({ currentTemperature, unit }) => {
    const { getTemperatureUnitSymbol } = useTemperatureUtilities();

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ textAlign: 'center' }}>Temperature: {currentTemperature.temperature.toString()}{getTemperatureUnitSymbol(unit)}</h1>
            <h1 style={{ textAlign: 'center' }}>Humidity: {currentTemperature.humidity.toString()}%</h1>
        </div>
    )
}

export default TemperatureDisplay;