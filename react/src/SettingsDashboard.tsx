import { Container, Slider, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { FunctionComponent } from "react";
import { getTargetTemperatureCacheKey, getTargetTemperatureToleranceCacheKey, unitCacheKey } from "./constants";
import { useTemperatureUtilities } from "./hooks/useTemperatureUtilities";
import { IUserSettings } from "./interface/IUserSettings";
import { Unit } from "./type/Unit";

interface SettingsDashboardProps {
    open?: boolean;
    deviceId: string;
    userSettings: IUserSettings;
    handleUserSettingsChange: (settings: IUserSettings, emit: boolean) => Promise<void>;
}

const SettingsDashboard: FunctionComponent<SettingsDashboardProps> = ({ open, deviceId, userSettings, handleUserSettingsChange }) => {
    const { getTemperatureUnitSymbol } = useTemperatureUtilities();
    const targetTemperatureCacheKey = getTargetTemperatureCacheKey(deviceId);
    const targetTemperatureToleranceCacheKey = getTargetTemperatureToleranceCacheKey(deviceId);
    const temperatureUnitSymbol = getTemperatureUnitSymbol(userSettings.unit);

    const onTargetTemperatureChange = (event: Event) => {
        const parsedTargetTemperature = parseInt((event.target as any).value);
        const value = isNaN(parsedTargetTemperature) ? 0 : parsedTargetTemperature;
        handleUserSettingsChange(({ ...userSettings, targetTemperature: value }), false);
    }

    const onTargetTemperatureToleranceChange = (event: Event) => {
        // We have to divide by 2 here to work out MUI slider only able to handle discrete values
        const parsedTargetTemperatureTolerance = parseInt((event.target as any).value);
        const value = isNaN(parsedTargetTemperatureTolerance) ? 0 : parsedTargetTemperatureTolerance;
        handleUserSettingsChange(({ ...userSettings, targetTemperatureTolerance: value }), false);
    }

    const onTargetTemperatureChangeCommit = () => {
        handleUserSettingsChange(({ ...userSettings }), true);
        localStorage.setItem(targetTemperatureCacheKey, userSettings.targetTemperature.toString());
    }

    const onTargetTemperatureToleranceChangeCommit = () => {
        handleUserSettingsChange(({ ...userSettings }), true);
        localStorage.setItem(targetTemperatureToleranceCacheKey, userSettings.targetTemperatureTolerance.toString());
    }

    const handleUnitChange = (_: React.MouseEvent<HTMLElement>, newUnit: Unit,) => {
        handleUserSettingsChange({ ...userSettings, unit: newUnit }, false);
        localStorage.setItem(unitCacheKey, newUnit);
    }

    if (!open) return (null);

    const targetTemperatureMarks = [0, 5, 10, 15, 20, 25, 30].map(x => ({ value: x, label: `${x}${temperatureUnitSymbol}` }));
    const targetTemperatureToleranceMarks = [0, 1, 2, 3, 4].map(x => ({ value: x, label: `${x / 2}${temperatureUnitSymbol}` }));

    return (
        <Container maxWidth='md' sx={{ display: 'flex', gap: '3em', flexDirection: 'row', height: '70%', width: '100%', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1em', justifyContent: 'center' }}>
                <ToggleButtonGroup
                    value={userSettings.unit}
                    exclusive
                    onChange={handleUnitChange}
                    aria-label="Unit selection"
                    sx={{ alignItems: 'center' }}
                >
                    <ToggleButton value="celsius" aria-label="celsius" children="Celsius" />
                    <ToggleButton value="fahrenheit" aria-label="fahrenheit" children="Fahrenheit" />
                </ToggleButtonGroup>
                <div>
                    <Typography gutterBottom>Target temperature tolerance</Typography>
                    <Slider
                        aria-label="tolerance"
                        orientation="horizontal"
                        valueLabelDisplay="auto"
                        defaultValue={userSettings.targetTemperatureTolerance ?? 0.5}
                        value={userSettings.targetTemperatureTolerance ?? 0.5}
                        getAriaValueText={temp => `${temp / 2}${temperatureUnitSymbol}`}
                        valueLabelFormat={(temp) => temp / 2}
                        max={4}
                        min={0}
                        step={null}
                        onChange={(event) => onTargetTemperatureToleranceChange(event)}
                        onChangeCommitted={onTargetTemperatureToleranceChangeCommit}
                        marks={targetTemperatureToleranceMarks}
                    />
                </div>
            </div>

            <Slider
                aria-label="Temperature"
                orientation="vertical"
                getAriaValueText={temp => `${temp}${temperatureUnitSymbol}`}
                valueLabelDisplay="auto"
                defaultValue={userSettings.targetTemperature ?? 18}
                value={userSettings.targetTemperature ?? 18}
                max={30}
                min={0}
                onChange={(event) => onTargetTemperatureChange(event)}
                onChangeCommitted={onTargetTemperatureChangeCommit}
                marks={targetTemperatureMarks}
            />
        </Container>
    )
}

export default SettingsDashboard;