import {SensorTypesEnum} from "../enum/sensor-type"
import { AlarmModule } from "./alarm-module";

export class SensorModule{
    public id: number = 0
    public name: string = "";
    public gatewayId: string = "";
    public color: string = "#000000"
    public index: number = 0
    public sensorType: SensorTypesEnum = SensorTypesEnum.TEMPERATURE
    public value: Number|null = null
    public isActive: boolean = false
    public gain: number = 0
    public offset: number = 0
    public maxAlarm: AlarmModule | null = null
    public minAlarm: AlarmModule | null = null
    public multiplier: number = 1

    constructor(){
        
    }
}

export function GetTableName(gateway:string, indicator: string)
{
    return gateway  + '-' + indicator
}