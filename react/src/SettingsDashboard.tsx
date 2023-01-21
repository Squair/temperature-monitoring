import { Container, Slider, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { FunctionComponent } from "react";
import { getTargetTemperatureCacheKey, unitCacheKey } from "./constants";
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
    const temperatureUnitSymbol = getTemperatureUnitSymbol(userSettings.unit);

    const onTargetTemperatureChange = (event: Event) => {
        const parsedTargetTemperature = parseInt((event.target as any).value);
        const value = isNaN(parsedTargetTemperature) ? 0 : parsedTargetTemperature;
        handleUserSettingsChange(({ ...userSettings, targetTemperature: value }), false);
    }

    const onTargetTemperatureChangeCommit = () => {
        handleUserSettingsChange(({ ...userSettings }), true);
        localStorage.setItem(targetTemperatureCacheKey, userSettings.targetTemperature.toString());
    }

    const handleUnitChange = (_: React.MouseEvent<HTMLElement>, newUnit: Unit,) => {
        handleUserSettingsChange({ ...userSettings, unit: newUnit }, false);
        localStorage.setItem(unitCacheKey, newUnit);
    }

    if (!open) return (null);

    const marks = [0, 5, 10, 15, 20, 25, 30].map(x => ({ value: x, label: `${x}${temperatureUnitSymbol}` }));

    return (
        <Container maxWidth='md' sx={{ display: 'flex', gap: '3em', flexDirection: 'row', height: '70%', width: '100%', justifyContent: 'center' }}>
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
                marks={marks}
            />
        </Container>
    )
}

export default SettingsDashboard;