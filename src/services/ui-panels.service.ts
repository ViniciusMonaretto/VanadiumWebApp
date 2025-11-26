import { Injectable } from '@angular/core';
import {GetTableName, SensorModule} from "../models/sensor-module"
import { SensorTypesEnum } from '../enum/sensor-type';
import { table } from 'console';
import { GatewayModule } from '../models/gateway-model';
import { DialogHelper } from './dialog-helper.service';
import { MatDialogRef } from '@angular/material/dialog';
import { SpinnerComponent } from '../components/spinner/spinner.component';
import { ApiService } from './api.service';
import { formatLocalDateToCustomString } from '../utils/date-util';

export class GroupInfo {
  public id: number = -1
  public name: string = ""
  public panels: PanelInfo = new PanelInfo()
}

export class PanelInfo {
  public temperature: Array<SensorModule> = [];
  public pressure: Array<SensorModule>  = [];
  public power: Array<SensorModule> = [];
}

@Injectable({
  providedIn: 'root'
})
export class UiPanelService {
    
    groups: {[id: string]:  GroupInfo} = {}
    subscriptioMap: {[id: string]: Array<SensorModule | Function>} = {}

    groupSelected: string = ""

    sensorCachedCurrentInfo: {[id: string]: any[]} = {}

    private selectedSensor: SensorModule|null = null
    private spinnerDialogRef: MatDialogRef<SpinnerComponent> | null = null;
    
    constructor(private api: ApiService, private dialogHelper: DialogHelper  ) 
    { 
      this.api.addListener("uiConfig", (uiConfig: any) => 
        {
          this.SetNewUiConfig(uiConfig["message"]["PanelsInfo"])
  
          if (uiConfig["message"]["calibrateUpdate"]) {
            this.dialogHelper.openInfoDialog("Novo valor calibrado no Sensor, verifique o valor.", "Calibração concluída")
          }
        })

        this.api.addListener("sensorUpdate", (sensorsUpdate: Array<any>) => {
          for (let sensorData of sensorsUpdate) {
            this.OnSubscriptionUpdate(sensorData["subStatusName"], sensorData)
          }
        })
    }

    public AddGroup(groupName: any)
    {
      this.openSpinnerDialog("Adicionando grupo")
      this.api.send("addGroupPanel", groupName).then((groupData: any) => {
        this.closeSpinnerDialog();
        this.groups[groupData.groupId] = new GroupInfo()
        this.groups[groupData.groupId].name = groupData.groupName
        this.groups[groupData.groupId].id = groupData.groupId
      })
    }

    public RemoveGroup(groupId: string)
    {
      this.openSpinnerDialog("Removendo grupo")
      this.api.send("removeGroupPanel", groupId).then(() => {
        this.closeSpinnerDialog();
        delete this.groups[groupId]
      })
    }

    public AddSensor(sensorData: any)
    {
      this.openSpinnerDialog("Adicionando sensor")
      this.api.send("addPanel", sensorData).then(() => {
        this.closeSpinnerDialog();
        this.addPanelAndSubscribe(sensorData, sensorData.group)
      })
    }

    public RemoveSensor(sensorData: any)
    {
      this.openSpinnerDialog("Removendo sensor")
      this.api.send("removePanel", sensorData).then(() => {
        this.closeSpinnerDialog();
        var fullTopic = GetTableName(sensorData.gateway, sensorData.topic, sensorData.indicator.toString())
        this.subscriptioMap[fullTopic] = this.subscriptioMap[fullTopic].filter(x=> x != sensorData)
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

    SetNewUiConfig(uiConfig: any )
    { 
      
      this.RemoveAllSensorModuleSubscription()
      this.groups = {}

      for(let groupId in uiConfig)
      {
        this.groups[groupId] = new GroupInfo()
        this.CreateSensorSubscriptionFromPanel(uiConfig[groupId].panels, groupId)
        if(this.groupSelected == "")
        {
          this.groupSelected = groupId
        }
        
        // Update group info
        this.groups[groupId].name = uiConfig[groupId].groupName
        this.groups[groupId].id = uiConfig[groupId].groupId
      }
    }

    GetPanelById(panelId: number)
    {
      for(var groupPanelsId in this.groups)
      {
        var group = this.groups[groupPanelsId]
        var panel = group.panels.temperature.find(x=>x.id == panelId)
        if (panel)
        {
          return panel
        }
        var panel = group.panels.pressure.find(x=>x.id == panelId)
        if (panel)
        {
          return panel
        }
        var panel = group.panels.power.find(x=>x.id == panelId)
        if (panel)
        {
          return panel
        }
      }
      return null
    }

    GetUiConfig()
    {
      return this.groups
    }
    
    AddSensorToPanel(sensor: SensorModule, groupId: string)
    {
      switch(sensor.sensorType)
      {
        case SensorTypesEnum.TEMPERATURE:
          this.groups[groupId].panels.temperature.push(sensor)
          break
        case SensorTypesEnum.PREASSURE:
          this.groups[groupId].panels.pressure.push(sensor)
          break
        case SensorTypesEnum.TENSION:
        case SensorTypesEnum.CURRENT:
        case SensorTypesEnum.POWER_FACTOR:
        case SensorTypesEnum.POWER:
          this.groups[groupId].panels.power.push(sensor)
          break
      }
    }

    RemoveAllSensorModuleSubscription()
    {
      for(var sensorId in  this.subscriptioMap)
      {
        this.subscriptioMap[sensorId] = this.subscriptioMap[sensorId].filter(x=> !("topic" in x))
      }
    }

    addPanelAndSubscribe(panel: SensorModule, groupId: string)
    {
      this.AddSensorToPanel(panel, groupId);
      let fullTopic = GetTableName(panel.gateway, panel.topic, panel.indicator.toString())
      this.AddSubscription(fullTopic, panel)
    }


    CreateSensorSubscriptionFromPanel(panel: SensorModule[], groupId: string)
    {
      for(var sensor of panel)
      {
        this.addPanelAndSubscribe(sensor, groupId); 
      }
    }

    SensorInfoCallback = (info: any, infoArr: any[]) => {
      this.sensorCachedCurrentInfo[info.realName] = infoArr
    }

    UpdatePanelInfo(updatePanelInfo: any)
    {
      this.openSpinnerDialog("Atualizando sensor")
      this.api.send("updatePanelInfo", updatePanelInfo).then(() => {
        this.closeSpinnerDialog();
        var panel = this.GetPanelById(updatePanelInfo.id)
        if(panel)
        {
          panel.gain = updatePanelInfo.gain
          panel.name = updatePanelInfo.name
          panel.color = updatePanelInfo.color
          panel.offset = updatePanelInfo.offset
          panel.maxAlarm = updatePanelInfo.maxAlarm
          panel.minAlarm = updatePanelInfo.minAlarm
        }
      })
    }

    AddSubscription(fullTopic: string, callbackObj: Function | SensorModule)
    {
      if(! (fullTopic in this.subscriptioMap) )
      {
        this.subscriptioMap[fullTopic] = []
      }

      this.subscriptioMap[fullTopic].push(callbackObj)
      if(typeof callbackObj === 'function')
      {
        callbackObj(fullTopic)
      }
      return this.subscriptioMap[fullTopic].length - 1
    }

    SelectGroup(group: string)
    {
      this.groupSelected = group;
    }

    GetGroup()
    {
      return this.groupSelected
    }

    GetSelectedGroupInfo()
    {
      return this.groups[this.groupSelected]
    }

    public sendRequestForTableInfo(sensorInfos: Array<any>,
      callback: Function,
      beginDate?: Date | null,
      endDate?: Date | null) {
      let obj: any = { "sensorInfos": sensorInfos }
      if (beginDate) {
        obj["beginDate"] = formatLocalDateToCustomString(beginDate)
        if (endDate) {
          obj["endDate"] = formatLocalDateToCustomString(endDate)
        }
      }
  
      this.openSpinnerDialog("Buscando dados");
      this.api.send("getStatusHistory", obj).then((response: any) => {
        this.OnStatusInfoUpdate(response["requestId"], callback);
      })
    }
  

    OnStatusInfoUpdate(infoArray:any, callback: Function)
    {
        for(let tableName in infoArray)
        {
          let info = {}

          let panel = this.groups[infoArray.group].panels.temperature.find(x=> GetTableName(x.gateway, 
                                                                               x.topic, 
                                                                               x.indicator.toString()) == tableName)

          if(!panel)
          {
            panel = this.groups[infoArray.group].panels.pressure.find(x=> GetTableName(x.gateway, 
              x.topic, 
              x.indicator.toString()) == tableName)
          }

          if(!panel)
          {
            panel = this.groups[infoArray.group].panels.power.find(x=> GetTableName(x.gateway, 
              x.topic, 
              x.indicator.toString()) == tableName)
          }
                                                                               
          if(panel)
          {
            info = {
              "name": panel?.name,
              "realName": tableName,
              "color": panel?.color,
            }
          }
          else
          {
            info = {
              "name": tableName,
              "realName": tableName,
              "color": "#FFFFFF",
            }
          }

          callback(info);
        }
        
    }

    OnSubscriptionUpdate(topic: string, status_update: any)
    {
      let topicInfo = topic.split('-')
      let tableFullName = GetTableName(topicInfo[0], topicInfo[1], topicInfo[2])
      
      if(tableFullName in this.subscriptioMap)
      {
        for(let callbackObj of this.subscriptioMap[tableFullName])
        {
          if("topic" in callbackObj )
          {
            callbackObj.value = status_update.value
            callbackObj.isActive = status_update.isActive
            if(tableFullName in this.sensorCachedCurrentInfo)
            {
              this.sensorCachedCurrentInfo[tableFullName].push({
                timestamp: status_update["timestamp"],
                value: status_update["data"],
              })
              let filterDate = new Date()
              filterDate.setHours(filterDate.getHours() - 1)
              this.sensorCachedCurrentInfo[tableFullName] = this.sensorCachedCurrentInfo[tableFullName].filter(x=> new Date(x.timestamp) >= filterDate)
            }
          }
          else
          {
            callbackObj(tableFullName, status_update)
          }
          
        }
      }
    }

    public setSelectSensor(model: SensorModule|null)
    {
      this.selectedSensor = model
    }
  
    public GetSelectedSensor(): SensorModule | null
    {
      return this.selectedSensor
    }

}
