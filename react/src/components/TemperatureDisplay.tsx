import { FunctionComponent, useEffect, useState } from "react";
import { useTemperatureUtilities } from "../hooks/useTemperatureUtilities";
import { ITemperatureRecording } from "../interface/ITemperatureRecording";
import { Unit } from "../type/Unit";
import Measurement from "./Measurement";

interface TemperatureDisplayProps {
    temperatures: ITemperatureRecording[];
    unit: Unit;
}

const TemperatureDisplay: FunctionComponent<TemperatureDisplayProps> = ({ temperatures, unit }) => {
    const [isTrendingHigher, setIsTrendingHigher] = useState<{ temperature: boolean, humidity: boolean }>();
    const { getTemperatureUnitSymbol } = useTemperatureUtilities();

    const currentTemperature = temperatures[0];

    const temperatureDisplay = `${currentTemperature.temperature.toFixed(2).toString()}${getTemperatureUnitSymbol(unit)}`;
    const humidityDisplay = `${currentTemperature.humidity.toFixed(2).toString()}%`;

    const averageTemperatures = (temperatures: ITemperatureRecording[]) => temperatures.map(t => t.temperature).reduce((x, i) => x + i, 0) / temperatures.length;
    const averageHumidities = (temperatures: ITemperatureRecording[]) => temperatures.map(t => t.humidity).reduce((x, i) => x + i, 0) / temperatures.length;

    useEffect(() => {
        const isTemperatureTrendingHigher = currentTemperature.temperature >= averageTemperatures(temperatures);
        const isHumidityTrendingHigher = currentTemperature.temperature >= averageHumidities(temperatures);

        if (temperatures.length == 1 || temperatures.length % 3 === 0) {
            setIsTrendingHigher({ temperature: isTemperatureTrendingHigher, humidity: isHumidityTrendingHigher });
        }

    }, [temperatures]);

    return (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            
            <Measurement name='Temperature' value={temperatureDisplay} centerOffset='-10em' isTrendingHigher={isTrendingHigher?.temperature} align='left' />

            <div style={{ height: '105%', width: '0.25em', borderRadius: '1em', backgroundColor: 'white', transform: 'rotate(20deg)' }} />

            <Measurement name='Humidity' value={humidityDisplay} centerOffset='10em' isTrendingHigher={isTrendingHigher?.humidity} align='right' />
        </div>
    )
}

export default TemperatureDisplay;