import { Injectable } from '@angular/core';
import { EventAlarmModule } from '../models/event-alarm-module';
import { ApiService } from './api.service';
import { UiPanelService } from './ui-panels.service';

@Injectable({
    providedIn: 'root'
})
export class EventAlarmManagerService {
    private events: Array<EventAlarmModule> = []
    constructor(private api: ApiService, private uiPanelService: UiPanelService) {
        this.api.addOnConnectCallback(() => {
            this.api.send("requestEvents", {}).then((events: []) => {
                var newEvents: Array<EventAlarmModule> = []
                events.forEach((evt) => 
                {
                    newEvents.push(this.createEventModel(evt))
                })
                this.receiveEventsCallback(newEvents, true)
            })
        })

        this.api.addListener("eventInfoUpdate", (events: []) => {
            var newEvents: Array<EventAlarmModule> = []
            events.forEach((evt: any) => 
            {
                newEvents.push(this.createEventModel(evt))
            })
            this.receiveEventsCallback(newEvents, false)
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

    private createEventModel(eventInfo: any) {
        var evt = new EventAlarmModule()
        var panel = this.uiPanelService.GetPanelById(eventInfo["panelId"])

        evt.id = eventInfo["id"]
        evt.name = eventInfo["name"]
        evt.alarmId = eventInfo["alarmId"]
        evt.panelId = eventInfo["panelId"]
        evt.value = eventInfo["value"]
        evt.timestamp = eventInfo["timestamp"]

        if (panel) {
            evt.panelType = panel.sensorType
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