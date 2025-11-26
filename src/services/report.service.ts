import { Injectable } from '@angular/core';
import { GatewayModule } from '../models/gateway-model';
import { ApiService } from './api.service';
import { formatLocalDateToCustomString } from '../utils/date-util';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    constructor(private api: ApiService)
    {

    }

    public SendRequestForReportInfo(sensorInfos: Array<any>,
        group: string,
        beginDate?: Date | null,
        endDate?: Date | null) {
        let obj: any = { "sensorInfos": sensorInfos}
        if (beginDate) {
          obj["beginDate"] = formatLocalDateToCustomString(beginDate)
          if (endDate) {
            obj["endDate"] = formatLocalDateToCustomString(endDate)
          }
        }

        this.api.send("generaterReport", obj).then((reportMessage) => 
        {
            this.downloadReport(reportMessage)
        })
      }

    private downloadReport(message: any)
    {
        const link = document.createElement('a');
        link.href = `data:${message.mimetype};base64,${message.filedata}`;
        link.download = message.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }



}