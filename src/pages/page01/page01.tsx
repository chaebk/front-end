import { useState } from 'react';
import { RibbonBarComponent, type RibbonGroupConfig } from '../../components/page/RibbonBarComponent';
import './page01.scss';
import DataGrid, {
  Column,
  Paging,
  Scrolling,
  Pager,
  Sorting,
  FilterRow,
} from 'devextreme-react/data-grid';

export type { RibbonBtnConfig, RibbonGroupConfig, TemplateAProps } from '../../components/page/RibbonBarComponent';

// ─── 샘플 데이터 ───────────────────────────────────────────────────
const employees = [
  { ID: 1, FirstName: 'John', LastName: 'Heart', Position: 'CEO', BirthDate: '1964-03-16' },
  { ID: 2, FirstName: 'Olivia', LastName: 'Peyton', Position: 'Sales Assistant', BirthDate: '1981-06-03' },
  { ID: 3, FirstName: 'Robert', LastName: 'Reagan', Position: 'CMO', BirthDate: '1974-09-07' },
  { ID: 4, FirstName: 'Greta', LastName: 'Sims', Position: 'HR Manager', BirthDate: '1977-11-22' },
  { ID: 5, FirstName: 'Brett', LastName: 'Wade', Position: 'IT Manager', BirthDate: '1968-12-01' },
  { ID: 1, FirstName: 'John', LastName: 'Heart', Position: 'CEO', BirthDate: '1964-03-16' },
  { ID: 2, FirstName: 'Olivia', LastName: 'Peyton', Position: 'Sales Assistant', BirthDate: '1981-06-03' },
  { ID: 3, FirstName: 'Robert', LastName: 'Reagan', Position: 'CMO', BirthDate: '1974-09-07' },
  { ID: 4, FirstName: 'Greta', LastName: 'Sims', Position: 'HR Manager', BirthDate: '1977-11-22' },
  { ID: 5, FirstName: 'Brett', LastName: 'Wade', Position: 'IT Manager', BirthDate: '1968-12-01' },
  { ID: 1, FirstName: 'John', LastName: 'Heart', Position: 'CEO', BirthDate: '1964-03-16' },
  { ID: 2, FirstName: 'Olivia', LastName: 'Peyton', Position: 'Sales Assistant', BirthDate: '1981-06-03' },
  { ID: 3, FirstName: 'Robert', LastName: 'Reagan', Position: 'CMO', BirthDate: '1974-09-07' },
  { ID: 4, FirstName: 'Greta', LastName: 'Sims', Position: 'HR Manager', BirthDate: '1977-11-22' },
  { ID: 5, FirstName: 'Brett', LastName: 'Wade', Position: 'IT Manager', BirthDate: '1968-12-01' },
  { ID: 1, FirstName: 'John', LastName: 'Heart', Position: 'CEO', BirthDate: '1964-03-16' },
  { ID: 2, FirstName: 'Olivia', LastName: 'Peyton', Position: 'Sales Assistant', BirthDate: '1981-06-03' },
  { ID: 3, FirstName: 'Robert', LastName: 'Reagan', Position: 'CMO', BirthDate: '1974-09-07' },
  { ID: 4, FirstName: 'Greta', LastName: 'Sims', Position: 'HR Manager', BirthDate: '1977-11-22' },
  { ID: 5, FirstName: 'Brett', LastName: 'Wade', Position: 'IT Manager', BirthDate: '1968-12-01' },
  { ID: 1, FirstName: 'John', LastName: 'Heart', Position: 'CEO', BirthDate: '1964-03-16' },
  { ID: 2, FirstName: 'Olivia', LastName: 'Peyton', Position: 'Sales Assistant', BirthDate: '1981-06-03' },
  { ID: 3, FirstName: 'Robert', LastName: 'Reagan', Position: 'CMO', BirthDate: '1974-09-07' },
  { ID: 4, FirstName: 'Greta', LastName: 'Sims', Position: 'HR Manager', BirthDate: '1977-11-22' },
  { ID: 5, FirstName: 'Brett', LastName: 'Wade', Position: 'IT Manager', BirthDate: '1968-12-01' },
  { ID: 1, FirstName: 'John', LastName: 'Heart', Position: 'CEO', BirthDate: '1964-03-16' },
  { ID: 2, FirstName: 'Olivia', LastName: 'Peyton', Position: 'Sales Assistant', BirthDate: '1981-06-03' },
  { ID: 3, FirstName: 'Robert', LastName: 'Reagan', Position: 'CMO', BirthDate: '1974-09-07' },
  { ID: 4, FirstName: 'Greta', LastName: 'Sims', Position: 'HR Manager', BirthDate: '1977-11-22' },
  { ID: 5, FirstName: 'Brett', LastName: 'Wade', Position: 'IT Manager', BirthDate: '1968-12-01' },
  { ID: 1, FirstName: 'John', LastName: 'Heart', Position: 'CEO', BirthDate: '1964-03-16' },
  { ID: 2, FirstName: 'Olivia', LastName: 'Peyton', Position: 'Sales Assistant', BirthDate: '1981-06-03' },
  { ID: 3, FirstName: 'Robert', LastName: 'Reagan', Position: 'CMO', BirthDate: '1974-09-07' },
  { ID: 4, FirstName: 'Greta', LastName: 'Sims', Position: 'HR Manager', BirthDate: '1977-11-22' },
  { ID: 5, FirstName: 'Brett', LastName: 'Wade', Position: 'IT Manager', BirthDate: '1968-12-01' },
  { ID: 1, FirstName: 'John', LastName: 'Heart', Position: 'CEO', BirthDate: '1964-03-16' },
  { ID: 2, FirstName: 'Olivia', LastName: 'Peyton', Position: 'Sales Assistant', BirthDate: '1981-06-03' },
  { ID: 3, FirstName: 'Robert', LastName: 'Reagan', Position: 'CMO', BirthDate: '1974-09-07' },
  { ID: 4, FirstName: 'Greta', LastName: 'Sims', Position: 'HR Manager', BirthDate: '1977-11-22' },
  { ID: 5, FirstName: 'Brett', LastName: 'Wade', Position: 'IT Manager', BirthDate: '1968-12-01' },
];

const ribbonGroups: RibbonGroupConfig[] = [
  {
    title: '관리',
    items: [
      { key: 'refresh', icon: 'refresh', label: '새로고침', onClick: () => alert('새로고침') },
      { key: 'add', icon: 'add', label: '신규 등록', onClick: () => alert('신규 등록') },
      { key: 'edit', icon: 'edit', label: '수정', onClick: () => alert('수정') },
      { key: 'trash', icon: 'trash', label: '삭제', onClick: () => alert('삭제') },
    ],
  },
];

export function Page01() {
  const [gridKey, setGridKey] = useState(0);


  return (
    <div className="ms-app-shell">
      <RibbonBarComponent ribbonGroups={ribbonGroups} />
      <fieldset className="winform-group">
        <legend>검색조건</legend>
        <div>
          <label>이름: <input type="text" /></label>
        </div>
      </fieldset>
      <fieldset className="winform-group">
        <legend>데이터</legend>
        <div>
          <div className="ms-content-main">
            <DataGrid
              key={gridKey}
              dataSource={employees}
              keyExpr="ID"
              showBorders={false}
              rowAlternationEnabled={true}
              hoverStateEnabled={true}
              height="100%"
              className="page01-grid"

            >
              <Scrolling columnRenderingMode="virtual" />
              <FilterRow visible={true} />
              <Sorting mode="multiple" />
              <Paging defaultPageSize={5} />
              <Pager showPageSizeSelector={true} allowedPageSizes={[5, 10, 20]} showInfo={true} />
              <Column dataField="ID" width={64} caption="번호" alignment="center" minWidth={100} />
              <Column dataField="FirstName" caption="이름" minWidth={100} />
              <Column dataField="LastName" caption="성" minWidth={100} />
              <Column dataField="Position" caption="직급" minWidth={100} />
              <Column dataField="BirthDate" caption="생년월일" dataType="date" format="yyyy-MM-dd" minWidth={100} />
            </DataGrid>
          </div>
        </div>
      </fieldset>

    </div>
  );
}

export { Page01 as default }
