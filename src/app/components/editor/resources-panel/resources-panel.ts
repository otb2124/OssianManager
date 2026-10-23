import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ResourceCatalogService } from '../../../services/data/resources/resource-catalog.service';
import { FileExplorerService } from '../../../services/persistence/file-explorer.service';
import { AppTreeNode, TreeControl, TreeControlConfig } from '../../shared/tree-control/tree-control';
import { RESOURCE_GROUP_META, ResourceEntry, resourceGroupOf } from '../../../model/resource.model';

type ResourceNodeData =
  | { kind: 'group'; group: string }
  | { kind: 'resource'; resource: ResourceEntry };

type ResourceNode = AppTreeNode<ResourceNodeData>;

/** Engine resources from resources.json, grouped by type. Selection is shown in the File Inspector. */
@Component({
  selector: 'app-resources-panel',
  standalone: true,
  imports: [CommonModule, TreeControl, ButtonModule, TooltipModule],
  templateUrl: './resources-panel.html',
})
export class ResourcesPanel {
  protected readonly catalog = inject(ResourceCatalogService);
  private readonly explorer = inject(FileExplorerService);

  protected readonly nodes = computed<ResourceNode[]>(() => {
    const byGroup = new Map<string, ResourceEntry[]>();
    for (const entry of this.catalog.entries()) {
      const key = resourceGroupOf(entry.type);
      const list = byGroup.get(key);
      if (list) list.push(entry);
      else byGroup.set(key, [entry]);
    }

    return RESOURCE_GROUP_META
      .filter(meta => byGroup.has(meta.key))
      .map((meta): ResourceNode => {
        const items = byGroup.get(meta.key)!;
        return {
          id: `res-group:${meta.key}`,
          key: `res-group:${meta.key}`,
          label: `${meta.label} (${items.length})`,
          icon: meta.icon,
          data: { kind: 'group', group: meta.key },
          leaf: false,
          expanded: false,
          children: items.map((resource): ResourceNode => ({
            id: `res:${resource.id}`,
            key: `res:${resource.id}`,
            label: resource.id,
            icon: meta.icon,
            data: { kind: 'resource', resource },
            leaf: true,
          })),
        };
      });
  });

  protected readonly treeConfig: TreeControlConfig<ResourceNodeData> = {
    showIcons: true,
    isSelected: (node) =>
      node.data?.kind === 'resource' && this.explorer.selectedResource()?.id === node.data.resource.id,
  };

  protected onNodeSelect(node: ResourceNode): void {
    const d = node.data;
    if (d?.kind === 'resource') this.explorer.selectResource(d.resource);
  }
}