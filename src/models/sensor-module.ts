import {SensorTypesEnum} from "../enum/sensor-type"
import { AlarmModule } from "./alarm-module";

export class SensorModule{
    public id: number = 0
    public name: string = "";
    public gatewayId: string = "";
    public lastActivity: Date = new Date()
    public color: string = "#000000"
    public index: number = 0
    public type: SensorTypesEnum = SensorTypesEnum.TEMPERATURA
    public value: Number|null = null
    public active: boolean = false
    public gain: number = 0
    public offset: number = 0
    public maxAlarm: AlarmModule | null = null
    public minAlarm: AlarmModule | null = null
    public multiplier: number = 1
    public displayedType: number = 0

    constructor(){
        
    }
}

export class FlowSensorModule extends SensorModule{
    public flowConsumption : {
        dayConsumption: number
        weekConsumption: number
        monthConsumption: number
        lastMonthConsumption: number
    } = {
        dayConsumption: 0,
        weekConsumption: 0,
        monthConsumption: 0,
        lastMonthConsumption: 0
    }
    
}

export function GetTableName(gateway:string, indicator: string)
{
    return gateway  + '-' + indicator
}