import { Unit } from "../type/Unit";

export interface IUserSettings {
    unit: Unit;
    targetTemperature: number;
    targetTemperatureTolerance: number;
}