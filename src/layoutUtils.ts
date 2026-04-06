export type LayoutDirection = 'row' | 'col';

export interface FlatMenuItem {
  id: string;
  text: string;
  parentId: string | null;
  menuType: number;
  icon: string;
  menuUrl?: string;
}

export interface PaneData {
  id: string;
  tabs: FlatMenuItem[];
  activeId: string | null;
}

export interface SplitData {
  id: string;
  direction: LayoutDirection;
  children: LayoutNode[];
}

export type LayoutNode = { type: 'pane'; data: PaneData } | { type: 'split'; data: SplitData };

export function removeTab(node: LayoutNode, tabId: string): { newNode: LayoutNode | null; tab: FlatMenuItem | null } {
  if (node.type === 'pane') {
    const idx = node.data.tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return { newNode: node, tab: null };
    const tab = node.data.tabs[idx];
    const newTabs = [...node.data.tabs];
    newTabs.splice(idx, 1);
    const newActive = node.data.activeId === tabId ? (newTabs[Math.max(0, idx - 1)]?.id ?? null) : node.data.activeId;
    if (newTabs.length === 0) return { newNode: null, tab };
    return { newNode: { type: 'pane', data: { ...node.data, tabs: newTabs, activeId: newActive } }, tab };
  } else {
    const split = node.data;
    const newChildren: LayoutNode[] = [];
    let foundTab: FlatMenuItem | null = null;
    for (const child of split.children) {
      const res = removeTab(child, tabId);
      if (res.tab) foundTab = res.tab;
      if (res.newNode) newChildren.push(res.newNode);
    }
    if (newChildren.length === 0) return { newNode: null, tab: foundTab };
    if (newChildren.length === 1) return { newNode: newChildren[0], tab: foundTab }; // Collapse
    return { newNode: { type: 'split', data: { ...split, children: newChildren } }, tab: foundTab };
  }
}

export function insertTabAt(node: LayoutNode, paneId: string, tab: FlatMenuItem, index: number): LayoutNode {
  if (node.type === 'pane') {
    if (node.data.id === paneId) {
      const newTabs = [...node.data.tabs];
      if (!newTabs.some(t => t.id === tab.id)) {
         newTabs.splice(index, 0, tab);
      }
      return { type: 'pane', data: { ...node.data, tabs: newTabs, activeId: tab.id } };
    }
    return node;
  } else {
    return { type: 'split', data: { ...node.data, children: node.data.children.map(c => insertTabAt(c, paneId, tab, index)) } };
  }
}

export function addTabSplit(node: LayoutNode, paneId: string, tab: FlatMenuItem, position: 'top'|'bottom'|'left'|'right'): LayoutNode {
  if (node.type === 'pane') {
    if (node.data.id === paneId) {
      const newPane: LayoutNode = { type: 'pane', data: { id: `pane-${Date.now()}-${Math.floor(Math.random()*1000)}`, tabs: [tab], activeId: tab.id } };
      const dir = (position === 'top' || position === 'bottom') ? 'col' : 'row';
      const children = (position === 'top' || position === 'left') ? [newPane, node] : [node, newPane];
      return { type: 'split', data: { id: `split-${Date.now()}-${Math.floor(Math.random()*1000)}`, direction: dir, children } };
    }
    return node;
  } else {
    return { type: 'split', data: { ...node.data, children: node.data.children.map(c => addTabSplit(c, paneId, tab, position)) } };
  }
}

export function reorderTab(node: LayoutNode, paneId: string, fromIndex: number, toIndex: number): LayoutNode {
  if (node.type === 'pane') {
    if (node.data.id === paneId) {
      const newTabs = [...node.data.tabs];
      newTabs.splice(toIndex, 0, newTabs.splice(fromIndex, 1)[0]);
      return { type: 'pane', data: { ...node.data, tabs: newTabs } };
    }
    return node;
  } else {
    return { type: 'split', data: { ...node.data, children: node.data.children.map(c => reorderTab(c, paneId, fromIndex, toIndex)) } };
  }
}

export function closeTabInTree(node: LayoutNode, paneId: string, tabId: string): LayoutNode | null {
  if (node.type === 'pane') {
    if (node.data.id === paneId) {
      const idx = node.data.tabs.findIndex(t => t.id === tabId);
      if (idx === -1) return node;
      const newTabs = [...node.data.tabs];
      newTabs.splice(idx, 1);
      const newActive = node.data.activeId === tabId ? (newTabs[Math.max(0, idx - 1)]?.id ?? null) : node.data.activeId;
      if (newTabs.length === 0) return null;
      return { type: 'pane', data: { ...node.data, tabs: newTabs, activeId: newActive } };
    }
    return node;
  } else {
    const newChildren = node.data.children.map(c => closeTabInTree(c, paneId, tabId)).filter(Boolean) as LayoutNode[];
    if (newChildren.length === 0) return null;
    if (newChildren.length === 1) return newChildren[0];
    return { type: 'split', data: { ...node.data, children: newChildren } };
  }
}

export function setActiveInTree(node: LayoutNode, paneId: string, tabId: string): LayoutNode {
  if (node.type === 'pane') {
    if (node.data.id === paneId) {
      return { type: 'pane', data: { ...node.data, activeId: tabId } };
    }
    return node;
  } else {
    return { type: 'split', data: { ...node.data, children: node.data.children.map(c => setActiveInTree(c, paneId, tabId)) } };
  }
}

export function findPane(node: LayoutNode, paneId: string): boolean {
  if (node.type === 'pane') return node.data.id === paneId;
  return node.data.children.some(c => findPane(c, paneId));
}

export function findFirstPaneId(node: LayoutNode): string {
  if (node.type === 'pane') return node.data.id;
  if (node.data.children.length > 0) return findFirstPaneId(node.data.children[0]);
  return `pane-${Date.now()}`;
}

export function ensureRootPane(node: LayoutNode | null): LayoutNode {
  if (!node) return { type: 'pane', data: { id: `pane-${Date.now()}`, tabs: [], activeId: null } };
  return node;
}
