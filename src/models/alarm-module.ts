import {AlarmLevel, AlarmTypes} from "../enum/alarm-type"

export class AlarmModule{
    public id: number = 0
    public name: string = "";
    public sensor: string = "";
    public alarmType: AlarmTypes = AlarmTypes.EQUAL
    public threshold: Number|null = null
    public level: AlarmLevel = AlarmLevel.WARNING
    public severity: AlarmLevel = AlarmLevel.WARNING

    constructor(alarmValue: number | null = null, alarmSeverity: AlarmLevel = AlarmLevel.WARNING){
        this.threshold = alarmValue
        this.severity = alarmSeverity
    }
}