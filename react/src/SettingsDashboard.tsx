import { Container, InputAdornment, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { ChangeEvent, FunctionComponent, SetStateAction } from "react";
import { getTargetTemperatureCacheKey, unitCacheKey } from "./constants";
import { useTemperatureUtilities } from "./hooks/useTemperatureUtilities";
import { IUserSettings } from "./interface/IUserSettings";
import { Unit } from "./type/Unit";

interface SettingsDashboardProps {
    open?: boolean;
    deviceId: string;
    userSettings: IUserSettings;
    setUserSettings: React.Dispatch<SetStateAction<IUserSettings>>;
}

const SettingsDashboard: FunctionComponent<SettingsDashboardProps> = ({ open, deviceId, userSettings, setUserSettings }) => {
    const { getTemperatureUnitSymbol } = useTemperatureUtilities();
    const targetTemperatureCacheKey = getTargetTemperatureCacheKey(deviceId);

    const onTargetTemperatureTextChange = (event: ChangeEvent<HTMLInputElement>) => {
        const parsedTargetTemperature = parseInt(event.target.value);
        const value = isNaN(parsedTargetTemperature) ? 0 : parsedTargetTemperature;
        setUserSettings(us => ({ ...us, targetTemperature: value }));
        localStorage.setItem(targetTemperatureCacheKey, value.toString());
    }

    const handleUnitChange = (event: React.MouseEvent<HTMLElement>, newUnit: Unit,) => {
        setUserSettings(us => ({ ...us, unit: newUnit }));
        localStorage.setItem(unitCacheKey, newUnit);
    }

    if (!open) return (null);

    return (
        <Container maxWidth={'md'} sx={{ display: 'flex', gap: '1em', flexDirection: 'column' }}>
            <ToggleButtonGroup
                value={userSettings.unit}
                exclusive
                onChange={handleUnitChange}
                aria-label="Unit selection"
            >
                <ToggleButton value={"celsius"} aria-label="celsius" children="Celsius" />
                <ToggleButton value="fahrenheit" aria-label="fahrenheit" children="Fahrenheit" />
            </ToggleButtonGroup>

            <TextField
                onChange={onTargetTemperatureTextChange}
                value={userSettings.targetTemperature}
                variant='outlined'
                label='Target temperature'
                InputProps={{
                    endAdornment: <InputAdornment position="end">{getTemperatureUnitSymbol(userSettings.unit)}</InputAdornment>
                }}
            />
        </Container>
    )
}

export default SettingsDashboard;