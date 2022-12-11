import { Container, InputAdornment, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { ChangeEvent, FunctionComponent, useEffect, useState } from "react";
import { Unit } from "./type/Unit";

interface SettingsDashboardProps {
    open?: boolean;
    deviceId: string;
}

const SettingsDashboard: FunctionComponent<SettingsDashboardProps> = ({ open, deviceId }) => {
    const [unit, SetUnit] = useState<Unit>('celsius');
    const [targetTemperature, setTargetTemperature] = useState<Number>(70);
    
    const targetTemperatureCacheKey = `${deviceId}-target-temperature`;
    const unitCacheKey = "unit";

    // Read existing settings on mount.
    useEffect(() => {
        const cachedTargetTemperature = localStorage.getItem(targetTemperatureCacheKey);
        const cachedUnit = localStorage.getItem(unitCacheKey) as Unit;

        setTargetTemperature(parseInt(cachedTargetTemperature ?? "0"));
        SetUnit(cachedUnit);
    }, []);

    const onTargetTemperatureTextChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        
        setTargetTemperature(value ? value : 0);
        localStorage.setItem(targetTemperatureCacheKey, value.toString());
    }

    const handleUnitChange = (event: React.MouseEvent<HTMLElement>, newUnit: Unit,) => {
        SetUnit(newUnit);
        localStorage.setItem("unit", newUnit);
    }

    if (!open) return (null);

    return (
        <Container maxWidth={'md'} sx={{ display: 'flex', gap: '1em', flexDirection: 'column'}}>
            <ToggleButtonGroup
                value={unit}
                exclusive
                onChange={handleUnitChange}
                aria-label="Unit selection"
            >
                <ToggleButton value={"celsius"} aria-label="celsius" children="Celsius" />
                <ToggleButton value="fahrenheit" aria-label="fahrenheit" children="Fahrenheit" />
            </ToggleButtonGroup>

            <TextField
                onChange={onTargetTemperatureTextChange}
                value={targetTemperature}
                variant='outlined'
                label='Target temperature'
                InputProps={{
                     endAdornment: <InputAdornment position="end">° {unit === 'celsius' ? 'C' : 'F'}</InputAdornment>
                }}
            />
        </Container>
    )
}

export default SettingsDashboard;