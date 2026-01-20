import { Injectable } from '@angular/core';
import { GetTableName, SensorModule } from "../models/sensor-module"
import { SensorTypesEnum } from '../enum/sensor-type';
import { table } from 'console';
import { GatewayModule } from '../models/gateway-model';
import { DialogHelper } from './dialog-helper.service';
import { MatDialogRef } from '@angular/material/dialog';
import { SpinnerComponent } from '../components/spinner/spinner.component';
import { ApiService } from './api.service';
import { formatLocalDateToCustomString } from '../utils/date-util';
import { Enterprise } from '../models/enterprise';

export class GroupInfo {
  public id: number = -1
  public name: string = ""
  public panels: SensorModule[] = []
}

@Injectable({
  providedIn: 'root'
})
export class UiPanelService {

  selectedEnterprise: Enterprise | null = null;
  groups: { [id: string]: GroupInfo } = {}
  subscriptioMap: { [id: string]: Array<SensorModule & { topic: string } | Function> } = {}

  groupSelected: string = ""

  sensorCachedCurrentInfo: { [id: string]: any[] } = {}

  private selectedSensor: SensorModule | null = null
  private spinnerDialogRef: MatDialogRef<SpinnerComponent> | null = null;

  constructor(private api: ApiService, private dialogHelper: DialogHelper) {
    this.api.addListener("sensorDataReceived", (sensorsUpdate: any) => {
      let sensorData = sensorsUpdate['gatewayData']['sensors']
      let gatewayId = sensorsUpdate['gatewayId']

      for (let index in sensorData) {
        this.OnSubscriptionUpdate(gatewayId + '-' + index, sensorData[index])
      }
    })

    this.api.addOnConnectCallback(() => {
      this.selectedEnterprise = null;
      this.groups = {};
      this.subscriptioMap = {};
      this.groupSelected = "";
      this.sensorCachedCurrentInfo = {};
      this.selectedSensor = null;
    });
  }

  public RequestSelectedEnterpriseGroups(enterprise: Enterprise): Promise<boolean> | null
  {
    if (!enterprise) {
      return null;
    }
    return this.api.send("SetSelectedEnterprise", {enterpriseId: enterprise.id }).then((groups: any) => {
      this.SetNewUiConfig(groups)
      return true;
    }).catch((error: any) => {
      this.dialogHelper.openErrorDialog("Erro ao buscar grupos da empresa " + 
        enterprise.name + ": " + error.message);
      return false;
    });
  }

  public AddGroup(groupName: any) {
    this.openSpinnerDialog("Adicionando grupo")
    this.api.send("addGroupPanel", groupName).then((groupData: any) => {
      this.closeSpinnerDialog();
      this.groups[groupData.groupId] = new GroupInfo()
      this.groups[groupData.groupId].name = groupData.groupName
      this.groups[groupData.groupId].id = groupData.groupId
    })
  }

  public RemoveGroup(groupId: string) {
    this.openSpinnerDialog("Removendo grupo")
    this.api.send("removeGroupPanel", groupId).then(() => {
      this.closeSpinnerDialog();
      delete this.groups[groupId]
    })
  }

  public AddSensor(sensorData: any) {
    this.openSpinnerDialog("Adicionando sensor")
    this.api.send("addPanel", sensorData).then(() => {
      this.closeSpinnerDialog();
      this.addPanelAndSubscribe(sensorData, sensorData.group)
    })
  }

  public RemoveSensor(sensorData: any) {
    this.openSpinnerDialog("Removendo sensor")
    this.api.send("removePanel", sensorData).then(() => {
      this.closeSpinnerDialog();
      var fullTopic = GetTableName(sensorData.gateway, sensorData.indicator.toString())
      this.subscriptioMap[fullTopic] = this.subscriptioMap[fullTopic].filter(x => x != sensorData)
    })
  }

  openSpinnerDialog(message: string): void {
    if (this.spinnerDialogRef) {
      this.closeSpinnerDialog();
    }
    this.spinnerDialogRef = this.dialogHelper.showSpinnerDialog(message, true)
  }

  closeSpinnerDialog(): void {
    this.spinnerDialogRef?.close();
    this.spinnerDialogRef = null;
  }

  SetNewUiConfig(uiConfig: any) {

    this.RemoveAllSensorModuleSubscription()
    this.groups = {}

    for (let groupId in uiConfig) {
      this.groups[groupId] = new GroupInfo()
      this.CreateSensorSubscriptionFromPanel(uiConfig[groupId].panels, groupId)
      if (this.groupSelected == "") {
        this.groupSelected = groupId
      }

      // Update group info
      this.groups[groupId].name = uiConfig[groupId].name
      this.groups[groupId].id = parseInt(groupId)
    }
  }

  GetPanelById(panelId: number) {
    for (var groupPanelsId in this.groups) {
      var group = this.groups[groupPanelsId]
      return group.panels.find(x => x.id == panelId);
    }
    return null
  }

  GetUiConfig() {
    return this.groups
  }

  AddSensorToPanel(sensor: SensorModule, groupId: string) {
    this.groups[groupId].panels.push(sensor);
  }

  RemoveAllSensorModuleSubscription() {
    for (var sensorId in this.subscriptioMap) {
      this.subscriptioMap[sensorId] = this.subscriptioMap[sensorId].filter(x => !("topic" in x))
    }
  }

  addPanelAndSubscribe(panel: SensorModule, groupId: string) {
    this.AddSensorToPanel(panel, groupId);
    let fullTopic = GetTableName(panel.gatewayId, panel.index.toString())
    this.AddSubscription(fullTopic, panel)
  }


  CreateSensorSubscriptionFromPanel(panel: SensorModule[], groupId: string) {
    for (var sensor of panel) {
      this.addPanelAndSubscribe(sensor, groupId);
    }
  }

  SensorInfoCallback = (info: any, infoArr: any[]) => {
    this.sensorCachedCurrentInfo[info.realName] = infoArr
  }

  UpdatePanelInfo(updatePanelInfo: any) {
    this.openSpinnerDialog("Atualizando sensor")
    this.api.send("updatePanelInfo", updatePanelInfo).then(() => {
      this.closeSpinnerDialog();
      var panel = this.GetPanelById(updatePanelInfo.id)
      if (panel) {
        panel.gain = updatePanelInfo.gain
        panel.name = updatePanelInfo.name
        panel.color = updatePanelInfo.color
        panel.offset = updatePanelInfo.offset
        panel.maxAlarm = updatePanelInfo.maxAlarm
        panel.minAlarm = updatePanelInfo.minAlarm
      }
    })
  }

  AddSubscription(fullTopic: string, callbackObj: any) {
    if (!(fullTopic in this.subscriptioMap)) {
      this.subscriptioMap[fullTopic] = []
    }

    this.subscriptioMap[fullTopic].push(callbackObj)
    if (typeof callbackObj === 'function') {
      callbackObj(fullTopic)
    }
    return this.subscriptioMap[fullTopic].length - 1
  }

  SelectGroup(group: string) {
    this.groupSelected = group;
  }

  GetGroup() {
    return this.groupSelected
  }

  GetSelectedGroupInfo() {
    return this.groups[this.groupSelected]
  }

  public sendRequestForTableInfo(sensorInfos: Array<any>,
    beginDate?: Date | null,
    endDate?: Date | null): Promise<any> {
    let obj: any = { "SensorInfos": sensorInfos }
    if (beginDate) {
      obj["StartDate"] = beginDate.toISOString()
      if (endDate) {
        obj["EndDate"] = endDate.toISOString()
      }
    }

    this.openSpinnerDialog("Buscando dados");
    return this.api.send("GetMultiplePanelReadings", obj).then((response: any) => {
      this.closeSpinnerDialog();
      return response;
    })
  }


  OnStatusInfoUpdate(infoArray: any, callback: Function) {
    for (let tableName in infoArray) {
      let info = {}

      let panel = this.groups[infoArray.group].panels.find(x => GetTableName(x.gatewayId,
        x.index.toString()) == tableName)

      if (panel) {
        info = {
          "name": panel?.name,
          "realName": tableName,
          "color": panel?.color,
        }
      }
      else {
        info = {
          "name": tableName,
          "realName": tableName,
          "color": "#FFFFFF",
        }
      }

      callback(info);
    }

  }

  OnSubscriptionUpdate(topic: string, status_update: any) {
    let topicInfo = topic.split('-')
    let tableFullName = GetTableName(topicInfo[0], topicInfo[1])

    if (tableFullName in this.subscriptioMap) {
      for (let callbackObj of this.subscriptioMap[tableFullName]) {
        if ("gatewayId" in callbackObj) {
          callbackObj.value = status_update.value
          callbackObj.isActive = status_update.active
          if (tableFullName in this.sensorCachedCurrentInfo) {
            this.sensorCachedCurrentInfo[tableFullName].push({
              timestamp: status_update["timestamp"],
              value: status_update["data"],
            })
            let filterDate = new Date()
            filterDate.setHours(filterDate.getHours() - 1)
            this.sensorCachedCurrentInfo[tableFullName] = this.sensorCachedCurrentInfo[tableFullName].filter(x => new Date(x.timestamp) >= filterDate)
          }
        }
        else {
          (callbackObj as Function)(tableFullName, status_update)
        }

      }
    }
  }

  public setSelectSensor(model: SensorModule | null) {
    this.selectedSensor = model
  }

  public GetSelectedSensor(): SensorModule | null {
    return this.selectedSensor
  }

  public setSelectedEnterprise(enterprise: Enterprise | null) {
    this.selectedEnterprise = enterprise;
  }

  public getSelectedEnterprise(): Enterprise | null {
    return this.selectedEnterprise;
  }

}
