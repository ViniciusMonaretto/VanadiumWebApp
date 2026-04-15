import {AlarmLevel, AlarmTypes} from "../enum/alarm-type"

export class AlarmModule{
    public id: number = 0
    public name: string = "";
    public sensor: string = "";
    public alarmType: AlarmTypes = AlarmTypes.EQUAL
    public threshold: Number|null = null
    public level: AlarmLevel = AlarmLevel.WARNING

    constructor(alarmValue: number | null = null){
        this.threshold = alarmValue
    }
}