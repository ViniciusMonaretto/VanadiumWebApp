import { Component, Input, Output } from '@angular/core';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { CommonModule } from '@angular/common';
import { SensorModule } from '../../models/sensor-module';
import { NestedTreeControl } from '@angular/cdk/tree';
import { SelectionModel } from '@angular/cdk/collections';
import {MatIconModule} from '@angular/material/icon';
import { SensorTypesEnum } from '../../enum/sensor-type';

export interface TreeNode {
  name: string;
  icon: string;
  object?: SensorModule|SensorModule[]|null;
  children?: TreeNode[];
}

@Component({
  selector: 'sensor-tree',
  imports: [CommonModule,
            MatTreeModule,
            MatCheckboxModule,
            MatIconModule],
  templateUrl: './sensor-tree.component.html',
  styleUrl: './sensor-tree.component.scss',
  standalone: true
})
export class SensorTreeComponent {
  treeControl = new NestedTreeControl<TreeNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<TreeNode>();
  
  @Input() groupsInfos: { [id: string]: SensorModule[] } = {};
  @Input() selectedSensors!: { [id: string]: SensorModule }; // mutable

  constructor()
  {

  }

  ngOnInit(): void {
    this.buildTreeData();
  }

  hasChild = (_: number, node: TreeNode) => !!node.children?.length;

  isSelected(node: TreeNode): boolean {
    return this.selectedSensors[node.name] !== undefined;
  }

  toggleNodeSelection(node: TreeNode): void {
    if (node.object) {
      if (Array.isArray(node.object) || false) {
        
      } else {
        if (this.selectedSensors[node.object.name] === undefined) {
          this.selectedSensors[node.object.name] = node.object;
        } else {
          delete this.selectedSensors[node.object.name];
        }
      }
    }
  }

  private buildTreeData(): void {
    const tree: TreeNode[] = []

    for (const panelId in this.groupsInfos) {
      const panel = this.groupsInfos[panelId];


      const temperatureSensors = panel.filter(sensor => sensor.type == SensorTypesEnum.TEMPERATURA);
      const pressureSensors = panel.filter(sensor => sensor.type == SensorTypesEnum.PRESSAO);
      const powerSensors = panel.filter(sensor => sensor.type == SensorTypesEnum.POTENCIA);

      const panelNode: TreeNode = {
        name: panelId,
        icon: "dashboard",
        object: panel,
        children: [
          {
            name: "Temperatura",
            object: temperatureSensors,
            icon: "whatshot",
            children: temperatureSensors.map(sensor => ({
              name: sensor.name,
              icon: "av_timer",
              object: sensor
            }))
          },
          {
            name: "Pressão",
            object: pressureSensors,
            icon: "av_timer",
            children: pressureSensors.map(sensor => ({
              name: sensor.name,  
              object: sensor,
              icon: "av_timer"
            }))
          },
          {
            name: "Potência", 
            object: powerSensors,
            icon: "offline_bolt",
            children: powerSensors.map(sensor => ({
              name: sensor.name,
              icon: "av_timer",
              object: sensor
            }))
          }
        ]
      };
      tree.push(panelNode);
    }

    this.dataSource.data = tree;
  }
}
