import React from "react";
import { HiSearch } from "react-icons/hi";
import Input from "../Input";
import type { FermentStatus } from "../../types";
import getInitialState from "../../utils/getInitialState";

interface FiltersProps {
  globalFilter: string;
  setGlobalFilter: (filter: string) => void;
  statusFilter: FermentStatus;
  setStatusFilter: (filter: FermentStatus) => void;
}

export default function FermentListFilters({ globalFilter, setGlobalFilter, statusFilter, setStatusFilter }: FiltersProps) {
  return (
    <div className="ferment-list--filters">
      <select 
        onChange={e => {
          const fermentStatus = e.target.value as FermentStatus;
          setStatusFilter(fermentStatus);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('lftState', JSON.stringify({ ...getInitialState(), fermentStatusFilter: fermentStatus }));
          }
        }} 
        aria-label="Filter ferments" 
        value={statusFilter}
        name="status"
      >
        <option value="">All</option>
        <option value="Active">Active</option>
        <option value="Complete">Complete</option>
        <option value="Planned">Planned</option>
      </select>
      <Input 
        id="ferment-search"
        label="Search ferments"
        showLabel={false}
        addon={<HiSearch size={18} />}
        type="search" 
        placeholder="Search ferments..." 
        value={String(globalFilter || '')} 
        onChange={e => setGlobalFilter(e.target.value)} 
      />
    </div>
  );
}