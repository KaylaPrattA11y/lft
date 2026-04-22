import { type FermentStatus, type TableView } from "../types";

interface LftState {
  tableView: TableView;
  activeTabpanel: string;
  fermentStatusFilter: FermentStatus;
}

export default function getInitialState(): LftState {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem('lftState');
    const parsed = JSON.parse(stored || 'null');

    if (parsed && (parsed.tableView === 'table' || parsed.tableView === 'grid') && typeof parsed.activeTabpanel === 'string' && typeof parsed.fermentStatusFilter === 'string') return parsed;
  }
  const initialState: LftState = {
    tableView: window.innerWidth >= 800 ? 'table' : 'grid',
    activeTabpanel: 'calculator',
    fermentStatusFilter: 'Active'
  };
  localStorage.setItem('lftState', JSON.stringify(initialState));
  return initialState;
};