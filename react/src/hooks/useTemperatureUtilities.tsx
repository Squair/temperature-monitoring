import { Unit } from "../type/Unit";

export const useTemperatureUtilities = () => {
    const getTemperatureUnitSymbol = (unit: Unit) => `°${unit === 'celsius' ? 'C' : 'F'}`;

    return {
        getTemperatureUnitSymbol
    }
}