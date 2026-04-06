import { useState, useRef, forwardRef, useImperativeHandle, lazy, Suspense } from 'react'
import React from 'react'
import TabPanel from 'devextreme-react/tab-panel'
import TextBox from 'devextreme-react/text-box'
import Button from 'devextreme-react/button'

// ── Page module glob (menuUrl → lazy component, auto-discovered) ──
const PAGE_MODULES = import.meta.glob('../../pages/**/*.tsx')
const PAGE_CACHE = new Map<string, React.LazyExoticComponent<() => React.ReactElement>>()

function getPageComponent(menuUrl: string) {
  if (PAGE_CACHE.has(menuUrl)) return PAGE_CACHE.get(menuUrl)!
  const path = menuUrl.replace(/\.tsx$/, '').replace(/^\/pages/, '')
  const loader = PAGE_MODULES[`../../pages${path}.tsx`]
  if (!loader) return undefined
  const component = lazy(() => (loader() as Promise<{ default: () => React.ReactElement }>))
  PAGE_CACHE.set(menuUrl, component)
  return component
}

import type { LayoutNode, FlatMenuItem } from '../../layoutUtils'
import './common.css'
import { removeTab, insertTabAt, addTabSplit, closeTabInTree, setActiveInTree, findPane, findFirstPaneId, ensureRootPane } from '../../layoutUtils'

// ── Types ─────────────────────────────────────────────────────
interface Site {
  id: string
  name: string
  url: string
}

type SplitPos = 'top' | 'bottom' | 'left' | 'right' | 'center'

// ── Handle (App에서 호출 가능한 메서드) ────────────────────────
export interface MainViewHandle {
  openTab: (item: FlatMenuItem) => void
}

// ── MainView ──────────────────────────────────────────────────
export const MainView = forwardRef<MainViewHandle, object>(function MainView(_, ref) {
  // ── Layout Engine State ──────────────────────────────────
  const [layoutRoot, setLayoutRoot] = useState<LayoutNode>(() => ({
    type: 'pane',
    data: { id: `pane-root-${Date.now()}`, tabs: [], activeId: null }
  }))
  const [activePaneId, setActivePaneId] = useState<string | null>(null)

  const dropHintRef = useRef<{ paneId: string, position: SplitPos } | null>(null)
  const [activeDropHint, setActiveDropHint] = useState<{ paneId: string, position: SplitPos } | null>(null)

  const dragTabRef = useRef<FlatMenuItem | null>(null)
  const dragEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const splitHandledRef = useRef(false)

  // ── Sites form state ──────────────────────────────────────
  const [sites, setSites] = useState<Site[]>([])
  const [newSiteName, setNewSiteName] = useState('')
  const [newSiteUrl, setNewSiteUrl] = useState('')

  // ── Expose methods to App via ref ─────────────────────────
  useImperativeHandle(ref, () => ({
    openTab(item: FlatMenuItem) {
      setLayoutRoot(root => {
        let targetId = activePaneId;
        if (!targetId || !findPane(root, targetId)) targetId = findFirstPaneId(root);
        const res = removeTab(root, item.id);
        const newRoot = res.newNode || ensureRootPane(null);
        const tabObj = res.tab || { ...item };
        return insertTabAt(newRoot, targetId, tabObj, 9999);
      });
    },
  }), [activePaneId])

  // ── Sites form ────────────────────────────────────────────
  function handleRegisterSite() {
    if (!newSiteName || !newSiteUrl) return
    setSites(prev => [...prev, { id: Date.now().toString(), name: newSiteName, url: newSiteUrl }])
    setNewSiteName('')
    setNewSiteUrl('')
  }

  // ── Drag handlers ─────────────────────────────────────────
  function handleGlobalDragMove(e: MouseEvent) {
    const groups = document.querySelectorAll('.tab-group');
    let foundHint: { paneId: string, position: SplitPos } | null = null;

    for (let i = 0; i < groups.length; i++) {
      const paneId = groups[i].getAttribute('data-pane-id');
      if (!paneId) continue;

      const isEmpty = groups[i].classList.contains('pane-empty');

      if (isEmpty) {
        const rect = groups[i].getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          foundHint = { paneId, position: 'center' };
          break;
        }
      } else {
        const contentEl = groups[i].querySelector('.dx-multiview-wrapper') || groups[i].querySelector('.tab-content');
        if (!contentEl) continue;
        const contentRect = contentEl.getBoundingClientRect();

        if (e.clientX >= contentRect.left && e.clientX <= contentRect.right && e.clientY >= contentRect.top && e.clientY <= contentRect.bottom) {
          const w = contentRect.width;
          const h = contentRect.height;
          const x = e.clientX - contentRect.left;
          const y = e.clientY - contentRect.top;

          const edgeRatio = 0.25;
          let pos: SplitPos = 'center';
          if (y < h * edgeRatio) pos = 'top';
          else if (y > h * (1 - edgeRatio)) pos = 'bottom';
          else if (x < w * edgeRatio) pos = 'left';
          else if (x > w * (1 - edgeRatio)) pos = 'right';

          foundHint = { paneId, position: pos };
          break;
        }
      }
    }

    if (JSON.stringify(dropHintRef.current) !== JSON.stringify(foundHint)) {
      dropHintRef.current = foundHint;
      setActiveDropHint(foundHint);
    }
  }

  function startDrag(tab: FlatMenuItem) {
    splitHandledRef.current = false;
    dragTabRef.current = tab;
    document.body.classList.add('is-dragging-tab');
    if (dragEndTimer.current) clearTimeout(dragEndTimer.current);
    dragMoveHandlerRef.current = handleGlobalDragMove;
    window.addEventListener('mousemove', dragMoveHandlerRef.current);
  }

  function scheduleDragEnd() {
    if (dragMoveHandlerRef.current) {
      window.removeEventListener('mousemove', dragMoveHandlerRef.current);
      dragMoveHandlerRef.current = null;
    }
    dropHintRef.current = null;
    setActiveDropHint(null);
    dragEndTimer.current = setTimeout(() => {
      document.body.classList.remove('is-dragging-tab');
    }, 150);
  }

  function handleSplitDrop(): boolean {
    const hint = dropHintRef.current;
    const tab = dragTabRef.current;
    if (!hint || !tab || hint.position === 'center') return false;

    setLayoutRoot(root => {
      const res = removeTab(root, tab.id);
      const newRoot = res.newNode || ensureRootPane(null);
      if (!findPane(newRoot, hint.paneId)) return newRoot;
      return addTabSplit(newRoot, hint.paneId, tab, hint.position as 'top' | 'bottom' | 'left' | 'right');
    });

    splitHandledRef.current = true;
    dropHintRef.current = null;
    return true;
  }

  // ── Tab drag via mouse events ─────────────────────────────
  function handleTabMouseDown(tab: FlatMenuItem, paneId: string) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      startDrag(tab);

      const ghost = document.createElement('div');
      ghost.className = 'drag-custom-preview';
      ghost.textContent = tab.text;
      ghost.style.cssText = `position:fixed;left:${e.clientX + 15}px;top:${e.clientY + 15}px;z-index:10000;pointer-events:none;`;
      document.body.appendChild(ghost);

      function onGhostMove(me: MouseEvent) {
        ghost.style.left = `${me.clientX + 15}px`;
        ghost.style.top = `${me.clientY + 15}px`;
      }

      function onMouseUp() {
        if (document.body.contains(ghost)) document.body.removeChild(ghost);
        window.removeEventListener('mousemove', onGhostMove);
        window.removeEventListener('mouseup', onMouseUp);

        const hint = dropHintRef.current;
        if (hint && hint.position !== 'center') {
          handleSplitDrop();
        } else if (hint && hint.position === 'center' && hint.paneId !== paneId) {
          const t = dragTabRef.current;
          if (t) {
            setLayoutRoot(root => {
              const res = removeTab(root, t.id);
              const newRoot = res.newNode || ensureRootPane(null);
              return insertTabAt(newRoot, hint.paneId, t, 9999);
            });
            splitHandledRef.current = true;
          }
        }
        scheduleDragEnd();
      }

      window.addEventListener('mousemove', onGhostMove);
      window.addEventListener('mouseup', onMouseUp);
    }
  }

  // ── Content renderer ──────────────────────────────────────
  function renderContent(activeId: string | null, tabs: FlatMenuItem[]) {
    if (!activeId) {
      return (
        <div className="empty-content">
          <p>좌측 메뉴에서 항목을 클릭하면 탭이 열립니다.</p>
        </div>
      )
    }
    if (activeId === 'sites-register') {
      return (
        <div className="site-form">
          <h2>사이트 등록</h2>
          <div className="form-row">
            <TextBox placeholder="사이트 이름" value={newSiteName}
              onValueChanged={e => setNewSiteName(e.value)} width={300} />
          </div>
          <div className="form-row">
            <TextBox placeholder="사이트 URL" value={newSiteUrl}
              onValueChanged={e => setNewSiteUrl(e.value)} width={300} />
          </div>
          <Button text="등록" type="default" onClick={handleRegisterSite} />
        </div>
      )
    }
    if (activeId === 'sites-list') {
      return (
        <div>
          <h2>등록된 사이트 목록</h2>
          {sites.length === 0 ? (
            <p>등록된 사이트가 없습니다.</p>
          ) : (
            <ul className="site-list">
              {sites.map(site => (
                <li key={site.id}>
                  <a href={site.url} target="_blank" rel="noopener noreferrer">{site.name}</a>
                  <span className="site-url">{site.url}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )
    }
    const activeTab = tabs.find(t => t.id === activeId)
    const PageComponent = activeTab?.menuUrl ? getPageComponent(activeTab.menuUrl) : undefined
    if (PageComponent) {
      return (
        <Suspense fallback={<div className="empty-content"><p>로딩 중...</p></div>}>
          <PageComponent />
        </Suspense>
      )
    }
    return (
      <div>
        <h2>{activeTab?.text}</h2>
        <p>{activeTab?.id} 페이지 내용입니다.</p>
      </div>
    )
  }

  // ── Recursive layout renderer ─────────────────────────────
  function renderLayoutNode(node: LayoutNode): React.ReactNode {
    if (node.type === 'split') {
      const isRow = node.data.direction === 'row';
      return (
        <div className={`layout-split ${isRow ? 'layout-split-row' : 'layout-split-col'}`}>
          {node.data.children.map((child, i) => (
            <React.Fragment key={i}>
              {renderLayoutNode(child)}
              {i < node.data.children.length - 1 && (
                <div className={`split-divider ${isRow ? 'col-resizer' : 'row-resizer'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      );
    } else {
      const pane = node.data;
      const isEmpty = pane.tabs.length === 0;
      const selectedIndex = Math.max(0, pane.tabs.findIndex(t => t.id === pane.activeId));

      return (
        <div
          className={`tab-group ${activePaneId === pane.id ? 'focused' : ''} ${isEmpty ? 'pane-empty' : ''}`}
          onMouseDown={() => setActivePaneId(pane.id)}
          data-pane-id={pane.id}
          key={pane.id}
        >
          {isEmpty ? (
            <div className="empty-content">
              <p>여기에 탭을 드래그하거나 새 메뉴를 엽니다.</p>
            </div>
          ) : (
            <TabPanel
              className="pane-tab-panel"
              dataSource={pane.tabs}
              keyExpr="id"
              selectedIndex={selectedIndex}
              onSelectionChanged={(e) => {
                const tab = (e.addedItems as FlatMenuItem[])[0];
                if (tab) setLayoutRoot(root => setActiveInTree(root, pane.id, tab.id));
              }}
              itemTitleRender={(tab: FlatMenuItem) => (
                <span className="tab-title-inner" onMouseDown={handleTabMouseDown(tab, pane.id)}>
                  {tab.text}
                  <button
                    className="tab-close"
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation();
                      setLayoutRoot(root => ensureRootPane(closeTabInTree(root, pane.id, tab.id)));
                    }}
                  >×</button>
                </span>
              )}
              itemRender={(tab: FlatMenuItem) => (
                <div className="tab-content">
                  {renderContent(tab.id, pane.tabs)}
                </div>
              )}
              animationEnabled={false}
              swipeEnabled={false}
              height="100%"
              width="100%"
            />
          )}

          <div className={`split-indicator split-top ${activeDropHint?.paneId === pane.id && activeDropHint?.position === 'top' ? 'active' : ''}`} />
          <div className={`split-indicator split-bottom ${activeDropHint?.paneId === pane.id && activeDropHint?.position === 'bottom' ? 'active' : ''}`} />
          <div className={`split-indicator split-left ${activeDropHint?.paneId === pane.id && activeDropHint?.position === 'left' ? 'active' : ''}`} />
          <div className={`split-indicator split-right ${activeDropHint?.paneId === pane.id && activeDropHint?.position === 'right' ? 'active' : ''}`} />
          <div className={`split-indicator split-center ${activeDropHint?.paneId === pane.id && activeDropHint?.position === 'center' ? 'active' : ''}`} />
        </div>
      );
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <main className="main">
      <div className="editor-area">
        {renderLayoutNode(layoutRoot)}
      </div>
    </main>
  )
})
