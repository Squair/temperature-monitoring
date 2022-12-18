import { FunctionComponent } from "react";
import { useTemperatureUtilities } from "../hooks/useTemperatureUtilities";
import { ITemperatureRecording } from "../interface/ITemperatureRecording";
import { Unit } from "../type/Unit";
import Measurement from "./Measurement";

interface TemperatureDisplayProps {
    currentTemperature: ITemperatureRecording;
    unit: Unit;
}

const TemperatureDisplay: FunctionComponent<TemperatureDisplayProps> = ({ currentTemperature, unit }) => {
    const { getTemperatureUnitSymbol } = useTemperatureUtilities();

    return (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <Measurement name='Temperature' value={`${currentTemperature.temperature.toString()}${getTemperatureUnitSymbol(unit)}`} centerOffset='-10em' />
            
            <div style={{ height: '105%', width: '0.25em', borderRadius: '1em', backgroundColor: 'white', margin: '1em', transform: 'rotate(20deg)' }} />
            
            <Measurement name='Humidity' value={`${currentTemperature.humidity.toString()}%`} centerOffset='10em' />
        </div>
    )
}

export default TemperatureDisplay;