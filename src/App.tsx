import { useRef } from 'react'
import menuJson from './assets/data/menu.json'
import './App.css'
import { Sidebar } from './components/common/Sidebar'
import { MainView } from './components/common/MainView'
import type { MainViewHandle } from './components/common/MainView'

import type { FlatMenuItem } from './layoutUtils'

// ── Types ─────────────────────────────────────────────────────
const MENU_ICONS: Record<number, string> = {
  1: 'folder',
  2: 'doc',
}

// ── Initial menu data (from JSON) ─────────────────────────────
const flatMenuData: FlatMenuItem[] = menuJson.map(item => ({
  id: String(item.menuID),
  text: item.menuName,
  parentId: item.menuParentID !== null ? String(item.menuParentID) : null,
  menuType: item.menuType,
  icon: MENU_ICONS[item.menuType] ?? 'doc',
  menuUrl: 'menuUrl' in item ? (item as { menuUrl?: string }).menuUrl : undefined,
}))

// ── Helpers ───────────────────────────────────────────────────
function isLeafNode(id: string, data: FlatMenuItem[]): boolean {
  return data.find(item => item.id === id)?.menuType === 2
}

// ── App ───────────────────────────────────────────────────────
function App() {
  const mainViewRef = useRef<MainViewHandle>(null)

  // ── Navigation (Sidebar → MainView) ───────────────────────
  function handleTreeItemClick(e: { itemData?: FlatMenuItem }) {
    if (!e.itemData) return
    const item = e.itemData
    if (!isLeafNode(item.id, flatMenuData)) return
    mainViewRef.current?.openTab(item)
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="layout">
      <Sidebar
        flatMenuData={flatMenuData}
        onMenuItemClick={handleTreeItemClick}
      />
      <MainView ref={mainViewRef} />
    </div>
  )
}

export default App
