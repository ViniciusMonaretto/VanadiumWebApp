import { Injectable } from '@angular/core';
import { FlowSensorModule, GetTableName, SensorModule } from "../models/sensor-module"
import { SensorTypesEnum } from '../enum/sensor-type';
import { table } from 'console';
import { GatewayModule } from '../models/gateway-model';
import { DialogHelper } from './dialog-helper.service';
import { MatDialogRef } from '@angular/material/dialog';
import { SpinnerComponent } from '../components/spinner/spinner.component';
import { ApiService } from './api.service';
import { formatLocalDateToCustomString } from '../utils/date-util';
import { Enterprise } from '../models/enterprise';
import { AlarmModule } from '../models/alarm-module';

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
  onEnterpriseChangedCallbacks: Function[] = [];

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
    this.api.send("addGroup", groupName).then((groupData: any) => {
      this.closeSpinnerDialog();
      this.groups[groupData.id] = new GroupInfo()
      this.groups[groupData.id].name = groupData.name
      this.groups[groupData.id].id = groupData.id
    })
  }

  public RemoveGroup(groupId: number) {
    this.openSpinnerDialog("Removendo grupo")
    this.api.send("removeGroup", groupId).then(() => {
      this.closeSpinnerDialog();
      delete this.groups[groupId]
    })
  }

  public AddSensor(sensorData: SensorModule) {
    this.openSpinnerDialog("Adicionando sensor")
    sensorData.gain = 1;
    sensorData.offset = 0;
    sensorData.multiplier = 1;
    this.api.send("addPanel", sensorData).then((newSensorData: SensorModule) => {
      this.addPanelAndSubscribe(newSensorData, this.groupSelected)
    })
    .finally(() => {
      this.closeSpinnerDialog();
    })
  }

  public RemoveSensor(sensorId: any) {
    this.openSpinnerDialog("Removendo sensor")
    this.api.send("deletePanel", sensorId).then(() => {
      this.closeSpinnerDialog();

      var sensorData = this.GetPanelById(sensorId);
      if (!sensorData) {
        return;
      }
      this.removePanelSubscription(sensorData, sensorData.index);
      for (let groupId in this.groups) {
        var index = this.groups[groupId].panels.findIndex(x => x.id == sensorId)
        if (index != -1) {
          this.groups[groupId].panels.splice(index, 1);
          break;
        }
      }
    })
    .finally(() => {
      this.closeSpinnerDialog();
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

  AddSensorToPanel(sensor: any, groupId: string) {
    switch (sensor.type) {
      case "flow":
        sensor.type = SensorTypesEnum.VAZAO
        break;
      case "temperature":
        sensor.type = SensorTypesEnum.TEMPERATURA
        break;
      case "pressure":
        sensor.type = SensorTypesEnum.PRESSAO
        break;
      case "power":
        sensor.type = SensorTypesEnum.POTENCIA
        break;
      case "current":
        sensor.type = SensorTypesEnum.CORRENTE
        break;
      case "voltage":
        sensor.type = SensorTypesEnum.TENSÃO
        break;
      case "power_factor":
        sensor.type = SensorTypesEnum.FATOR_DE_POTENCIA
        break;
      case "humidity":
        sensor.type = SensorTypesEnum.UMIDADE
        break;
      default:
        break;
    }

    if ('maxAlarm' in sensor) {
      sensor.maxAlarm = new AlarmModule(sensor.maxAlarm, sensor.severity)
    }
    if ('minAlarm' in sensor) {
      sensor.minAlarm = new AlarmModule(sensor.minAlarm, sensor.severity)
    }

    this.groups[groupId].panels.push(sensor);
  }

  RemoveAllSensorModuleSubscription() {
    for (var sensorId in this.subscriptioMap) {
      this.subscriptioMap[sensorId] = this.subscriptioMap[sensorId].filter(x => !("topic" in x))
    }
  }

  addPanelSubscription(panel: SensorModule, callback: Function | null = null) {
    let fullTopic = GetTableName(panel.gatewayId, panel.index.toString())

    if(callback) {
      this.AddSubscription(fullTopic, callback)
    }
    else {
      this.AddSubscription(fullTopic, panel)
    }
  }

  removePanelSubscription(panel: SensorModule, index: number) {
    let fullTopic = GetTableName(panel.gatewayId, panel.index.toString())
    this.subscriptioMap[fullTopic].splice(index, 1);
  }

  addPanelAndSubscribe(panel: SensorModule, groupId: string) {
    this.AddSensorToPanel(panel, groupId);
    this.addPanelSubscription(panel);
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
    this.api.send("updatePanel", updatePanelInfo).then(() => {
      this.closeSpinnerDialog();
      var panel = this.GetPanelById(updatePanelInfo.id)
      if (panel) {
        panel.gain = updatePanelInfo.gain
        panel.name = updatePanelInfo.name
        panel.color = updatePanelInfo.color
        panel.offset = updatePanelInfo.offset

        if ('maxAlarm' in updatePanelInfo) {
          panel.maxAlarm = new AlarmModule(updatePanelInfo.maxAlarm, updatePanelInfo.alarmSeverity)
        }
        else {
          panel.maxAlarm = null
        }

        if ('minAlarm' in updatePanelInfo) {
          panel.minAlarm = new AlarmModule(updatePanelInfo.minAlarm, updatePanelInfo.alarmSeverity)
        }
        else {
          panel.minAlarm = null
        }


        panel.displayedType = updatePanelInfo.displayedType
      }
    }).finally(() => {
      this.closeSpinnerDialog();
    })
  }

  AddSubscription(fullTopic: string, callbackObj: any) {
    if (!(fullTopic in this.subscriptioMap)) {
      this.subscriptioMap[fullTopic] = []
    }

    this.subscriptioMap[fullTopic].push(callbackObj)
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

  updateSensorValue(sensor: SensorModule, statusUpdate: any) {
      sensor.value = statusUpdate.value
      sensor.lastActivity = new Date()
      sensor.active = statusUpdate.active
      if (sensor.name in this.sensorCachedCurrentInfo) {
        this.sensorCachedCurrentInfo[sensor.name].push({
          timestamp: statusUpdate["timestamp"],
          value: statusUpdate["data"],
        })
      }

      if (sensor.type === SensorTypesEnum.VAZAO){
        var flowSensor = sensor as FlowSensorModule
        flowSensor.flowConsumption.dayConsumption += statusUpdate.value
        flowSensor.flowConsumption.weekConsumption += statusUpdate.value
        flowSensor.flowConsumption.monthConsumption += statusUpdate.value
      }
  }

  OnSubscriptionUpdate(topic: string, status_update: any) {
    let topicInfo = topic.split('-')
    let tableFullName = GetTableName(topicInfo[0], topicInfo[1])

    if (tableFullName in this.subscriptioMap) {
      for (let callbackObj of this.subscriptioMap[tableFullName]) {
        if ("gatewayId" in callbackObj) {
          this.updateSensorValue(callbackObj as SensorModule, status_update)
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
    if (enterprise === null) {
      this.clearAllSubscriptionsAndState();
    }
    else {
      for (const callback of this.onEnterpriseChangedCallbacks) {
        callback(enterprise);
      }
    }
  }

  /** Clears all subscriptions and state. Called on logout or when enterprise is deselected. */
  private clearAllSubscriptionsAndState(): void {
    this.groups = {};
    this.subscriptioMap = {};
    this.groupSelected = "";
    this.sensorCachedCurrentInfo = {};
    this.selectedSensor = null;
  }

  public getSelectedEnterprise(): Enterprise | null {
    return this.selectedEnterprise;
  }

  public addOnEnterpriseChangedCallback(callback: Function) {
    this.onEnterpriseChangedCallbacks.push(callback);
  }

  public removeOnEnterpriseChangedCallback(callback: Function) {
    this.onEnterpriseChangedCallbacks = this.onEnterpriseChangedCallbacks.filter(c => c !== callback);
  }

}
