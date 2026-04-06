import React from 'react';
import './page.scss';

// ─── 타입 정의 ────────────────────────────────────────────────────
export interface RibbonBtnConfig {
  key: string;
  icon?: string;
  label: string;
  hasDropdown?: boolean;
  customIcon?: React.ReactNode;
  onClick?: () => void;
}

export interface RibbonGroupConfig {
  title: string;
  items: RibbonBtnConfig[];
}

export interface RibbonBarProps {
  groups: RibbonGroupConfig[];
}

export interface TemplateAProps {
  ribbonGroups: RibbonGroupConfig[];
}

// ─── RibbonBtn ────────────────────────────────────────────────────
export const RibbonBtn: React.FC<Omit<RibbonBtnConfig, 'key'>> = ({
  icon,
  label,
  hasDropdown,
  customIcon,
  onClick,
}) => (
  <button className="ribbon-btn" onClick={onClick}>
    <div style={{ position: 'relative' }}>
      {customIcon ?? (
        <i
          className={`dx-icon-${icon} btn-icon`}
          style={{ fontSize: 24, display: 'block', lineHeight: 1 }}
        />
      )}
    </div>
    <div className="btn-label-row">
      <span className="btn-label">{label}</span>
      {hasDropdown && (
        <i className="dx-icon-spindown btn-chevron" style={{ fontSize: 9, marginLeft: 2 }} />
      )}
    </div>
  </button>
);

// ─── RibbonGroup ──────────────────────────────────────────────────
export const RibbonGroup: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="ribbon-group">
    <div className="ribbon-group-buttons">{children}</div>
    <div className="ribbon-group-label">{title}</div>
  </div>
);

// ─── RibbonBar ────────────────────────────────────────────────────
export const RibbonBar: React.FC<RibbonBarProps> = ({ groups }) => (
  <>
    {groups.map(group => (
      <RibbonGroup key={group.title} title={group.title}>
        {group.items.map(({ key, ...rest }) => (
          <RibbonBtn key={key} {...rest} />
        ))}
      </RibbonGroup>
    ))}
  </>
);

// ─── 기본 기타 그룹 (항상 마지막에 표시) ─────────────────────────
const DEFAULT_EXTRA_GROUP: RibbonGroupConfig = {
  title: '기타',
  items: [
    { key: 'close', icon: 'close', label: '닫기', onClick: () => alert('닫기') },
    { key: 'exit', icon: 'runner', label: '종료', onClick: () => alert('종료') },
  ],
};

// ─── RibbonBarComponent ───────────────────────────────────────────
export function RibbonBarComponent({ ribbonGroups }: TemplateAProps) {
  const allGroups = [...ribbonGroups, DEFAULT_EXTRA_GROUP];

  return (
    <div className="app-ribbon">
      <RibbonBar groups={allGroups} />
    </div>
  );
}
