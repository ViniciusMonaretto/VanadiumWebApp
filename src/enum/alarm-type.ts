export enum AlarmTypes{
    HIGHER = 0,
    LOWER = 1,
    EQUAL = 2
}

export enum AlarmLevel{
    INFO = 0,
    WARNING = 1,
    CRITICAL = 2
}

/** What fires the alarm: a min/max threshold, or an IoCloud Predict model fault. */
export enum AlarmKind{
    THRESHOLD = 0,
    ANOMALY = 1
}

// Over SignalR the API sends enums as camelCase strings ("critical", "anomaly");
// over REST as numbers. Both parsers accept either.

export function parseAlarmLevel(value: unknown): AlarmLevel {
    switch (typeof value === 'string' ? value.toLowerCase() : value) {
        case 'info': case AlarmLevel.INFO: return AlarmLevel.INFO;
        case 'critical': case AlarmLevel.CRITICAL: return AlarmLevel.CRITICAL;
        default: return AlarmLevel.WARNING;
    }
}

export function parseAlarmKind(value: unknown): AlarmKind {
    switch (typeof value === 'string' ? value.toLowerCase() : value) {
        case 'anomaly': case AlarmKind.ANOMALY: return AlarmKind.ANOMALY;
        default: return AlarmKind.THRESHOLD;
    }
}