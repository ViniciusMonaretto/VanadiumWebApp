import { Injectable } from '@angular/core';
import { EventAlarmModule } from '../models/event-alarm-module';
import { AlarmKind, parseAlarmKind, parseAlarmLevel } from '../enum/alarm-type';
import { ApiService } from './api.service';
import { UiPanelService } from './ui-panels.service';

@Injectable({
    providedIn: 'root'
})
export class EventAlarmManagerService {
    private events: Array<EventAlarmModule> = []
    private newEventsListeners: Array<(events: EventAlarmModule[]) => void> = []
    constructor(private api: ApiService, private uiPanelService: UiPanelService) {
        this.uiPanelService.addOnEnterpriseChangedCallback(() => {
            // Call the hub method to request all alarm events
            this.api.send("GetAllAlarmEvents").then((events: []) => {
                if (events && Array.isArray(events)) {
                    var newEvents: Array<EventAlarmModule> = []
                    events.forEach((evt) => 
                    {
                        newEvents.push(this.createEventModel(evt))
                    })
                    this.receiveEventsCallback(newEvents, true)
                }
            }).catch((err) => {
                console.warn('GetAllAlarmEvents method not available on server:', err);
            })
        })

        this.api.addListener("alarmeventreceived", (event: EventAlarmModule) => {
            const model = this.createEventModel(event)
            this.receiveEventsCallback([model], false)
            for (const listener of this.newEventsListeners) {
                listener([model])
            }
        });

    }

    public removeAllEvents() {
        this.api.send("removeAllEvents", {}).then(() => 
        {
            this.receiveEventsCallback([], true)
        })
    }

    public getEvents() {
        return this.events
    }

    /** Called with every alarm event that arrives live. Returns a function that unsubscribes. */
    public addNewEventsListener(listener: (events: EventAlarmModule[]) => void): () => void {
        this.newEventsListeners.push(listener)
        return () => {
            this.newEventsListeners = this.newEventsListeners.filter(l => l !== listener)
        }
    }

    /** IoCloud Predict fault events of the given panels in a period, oldest first (for the graph). */
    public getAnomalyEvents(panelIds: number[], beginDate?: Date | null, endDate?: Date | null): Promise<EventAlarmModule[]> {
        if (panelIds.length === 0) {
            return Promise.resolve([])
        }
        const request: any = { PanelIds: panelIds, Kind: "anomaly" }
        if (beginDate) {
            request["StartDate"] = beginDate.toISOString()
        }
        if (endDate) {
            request["EndDate"] = endDate.toISOString()
        }
        return this.api.send("GetAlarmEvents", request).then((events: any[]) =>
            (Array.isArray(events) ? events : [])
                .map(evt => this.createEventModel(evt))
                .filter(evt => evt.kind === AlarmKind.ANOMALY))
    }

    private createEventModel(eventInfo: any) {
        var evt = new EventAlarmModule()
        var panel = this.uiPanelService.GetPanelById(eventInfo["panelId"])

        evt.id = eventInfo["id"]
        evt.name = eventInfo["name"]
        evt.alarmId = eventInfo["alarmId"]
        evt.panelId = eventInfo["panelId"]
        evt.value = eventInfo["value"]
        evt.timestamp = eventInfo["timestamp"]
        evt.level = parseAlarmLevel(eventInfo["severity"])
        evt.kind = parseAlarmKind(eventInfo["kind"])

        if (panel) {
            evt.panelType = panel.type
            evt.panelName = panel.name
        }

        return evt;
    }

    private receiveEventsCallback(events: Array<EventAlarmModule>, replaceInfo: boolean) {
        if (replaceInfo) {
            this.events = events.slice(0, 100)
        }
        else {
            for (var evt of events) {
                this.events.push(evt)
            }
            // Keep only the most recent 100 events
            if (this.events.length > 100) {
                this.events = this.events.slice(-100)
            }
        }
    }
}