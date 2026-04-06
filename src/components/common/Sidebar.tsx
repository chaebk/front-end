import { useState, useEffect, useRef } from 'react'
import React from 'react'
import TreeView from 'devextreme-react/tree-view'
import Button from 'devextreme-react/button'
import SelectBox from 'devextreme-react/select-box'
import materialTealDarkUrl from 'devextreme/dist/css/dx.material.teal.dark.css?url'
import materialTealLightUrl from 'devextreme/dist/css/dx.material.teal.light.css?url'
import type { FlatMenuItem } from '../../layoutUtils'
import './common.css'

// ── Themes ──────────────────────────────────────────────────
const THEMES = [
    { id: 'material-teal-dark', text: 'Material Teal Dark Compact', url: materialTealDarkUrl },
    { id: 'material-teal-light', text: 'Material Teal Light Compact', url: materialTealLightUrl }
]
const DEFAULT_THEME_ID = 'material-teal-dark'

// ── Mock user info ────────────────────────────────────────────
interface UserInfo {
    name: string
    role: string
    loginAt: Date
    isOnline: boolean
}

const CURRENT_USER: UserInfo = {
    name: '홍길동',
    role: '시스템 관리자',
    loginAt: new Date(),
    isOnline: true,
}

function formatLoginTime(date: Date): string {
    const pad = (n: number, len = 2) => String(n).padStart(len, '0')
    const yyyy = date.getFullYear()
    const MM = pad(date.getMonth() + 1)
    const dd = pad(date.getDate())
    const hh = pad(date.getHours())
    const mm = pad(date.getMinutes())
    const ss = pad(date.getSeconds())
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`
}

// ── Props ─────────────────────────────────────────────────────
interface SidebarProps {
    flatMenuData: FlatMenuItem[]
    onMenuItemClick: (e: { itemData?: FlatMenuItem }) => void
}

// ── Sidebar ───────────────────────────────────────────────────
export function Sidebar({ flatMenuData, onMenuItemClick }: SidebarProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [sidebarWidth, setSidebarWidth] = useState(240)
    const isResizing = useRef(false)
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    const [themeId, setThemeId] = useState(DEFAULT_THEME_ID)

    // ── Theme switcher ─────────────────────────────────────────
    useEffect(() => {
        let link = document.getElementById('dx-theme') as HTMLLinkElement | null
        if (!link) {
            link = document.createElement('link')
            link.id = 'dx-theme'
            link.rel = 'stylesheet'
            document.head.appendChild(link)
        }
        const theme = THEMES.find(t => t.id === themeId)
        if (theme) link.href = theme.url
    }, [themeId])

    // ── Sidebar resize ─────────────────────────────────────────
    useEffect(() => {
        function onMouseMove(e: MouseEvent) {
            if (!isResizing.current) return
            const next = Math.min(480, Math.max(160, e.clientX))
            setSidebarWidth(next)
        }
        function onMouseUp() {
            if (!isResizing.current) return
            isResizing.current = false
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [])

    function handleResizeMouseDown(e: React.MouseEvent) {
        e.preventDefault()
        isResizing.current = true
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
    }

    // ── Render ─────────────────────────────────────────────────
    return (
        <aside
            className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}
            style={sidebarOpen ? { width: sidebarWidth, minWidth: sidebarWidth } : undefined}
        >
            <div className="sidebar-resize-handle" onMouseDown={handleResizeMouseDown} />

            <div className="sidebar-header">
                {sidebarOpen && (

                    <div className="user-info">
                        <div className="user-name-row">
                            <span className="user-name">{CURRENT_USER.name}</span>

                            <Button text="↪ 로그아웃" stylingMode="outlined" type="default"
                                elementAttr={{ class: 'logout-btn-c' }} onClick={() => alert('로그아웃')} />
                        </div>
                        <div className="user-login-time">
                            <span className="user-login-label">로그인</span>
                            <span>{formatLoginTime(CURRENT_USER.loginAt)}</span>
                        </div>

                    </div>

                )}

                <div className="sidebar-header-btns">

                    <Button
                        icon={sidebarOpen ? 'chevrondoubleleft' : 'chevrondoubleright'}
                        stylingMode="text"
                        onClick={() => setSidebarOpen(v => !v)}
                        hint={sidebarOpen ? '메뉴 접기' : '메뉴 펼치기'}
                    />
                </div>
            </div>

            {sidebarOpen && (
                <TreeView
                    dataSource={flatMenuData}
                    dataStructure="plain"
                    keyExpr="id"
                    displayExpr="text"
                    parentIdExpr="parentId"
                    itemRender={(item: FlatMenuItem) => {
                        const icon = item.menuType === 1
                            ? (expandedIds.has(item.id) ? 'activefolder' : 'inactivefolder')
                            : 'doc'
                        return (
                            <span className="tree-item">
                                <i className={`dx-icon dx-icon-${icon} tree-item-icon`} />
                                <span>{item.text}</span>
                            </span>
                        )
                    }}
                    selectByClick
                    selectionMode="single"
                    expandEvent="click"
                    onItemClick={onMenuItemClick}
                    onItemExpanded={(e: { itemData?: FlatMenuItem }) => {
                        if (e.itemData) setExpandedIds(prev => new Set(prev).add(e.itemData!.id))
                    }}
                    onItemCollapsed={(e: { itemData?: FlatMenuItem }) => {
                        if (e.itemData) setExpandedIds(prev => { const s = new Set(prev); s.delete(e.itemData!.id); return s })
                    }}
                    width="100%"
                />
            )}
            {sidebarOpen && (
                <div className="theme-selector">
                    <span className="theme-label">테마</span>
                    <SelectBox dataSource={THEMES} valueExpr="id" displayExpr="text"
                        value={themeId} onValueChanged={e => setThemeId(e.value)} width="100%" />
                </div>
            )}
        </aside>
    )
}
