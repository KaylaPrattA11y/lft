import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  HiOutlineSortAscending,
  HiOutlineSortDescending,
  HiOutlineSelector
} from "react-icons/hi";
import { useDebouncedCallback } from "use-debounce";
import { 
  useReactTable, 
  getCoreRowModel, 
  getFilteredRowModel, 
  getSortedRowModel, 
  createColumnHelper,
  getPaginationRowModel,
  type PaginationState,
  type SortingState,
  type FilterFn,
  type ColumnFiltersState,
  flexRender, 
} from '@tanstack/react-table'
import { 
  type FermentEntry, 
} from "../../types";
import NoDataAvailable from './NoDataAvailable';
import FermentListHeader from './FermentListHeader';
import { getColumnsData } from './columns-data';
import Spinner from '../Spinner';
import FermentListFilters from './FermentListFilters';
import FermentListFooter from './FermentListFooter';
import FermentListPagination from './FermentListPagination';

const fallbackData = [] as FermentEntry[];

export default function FermentList() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<FermentEntry[]>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>('Active');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'dateCreated', desc: true }
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    narrowViewCol: false,
    status: false,
    dateCreated: false,
    fermentName: false,
    brinePercentage: false,
    weight: false,
    saltRequired: false,
    dateStart: false,
    dateEnd: false,
    colTotalDuration: false,
    colRemainingDuration: false,
    notes: false,
    tags: false,
    actions: true,
  });

  function updateColumnVisibilityForWidth() {
    const width = window.innerWidth;
    if (!width) return;

    if (width >= 2000) {
      // extra wide
      setColumnVisibility({
        narrowViewCol: false,
        status: true,
        dateCreated: true,
        fermentName: true,
        brinePercentage: true,
        weight: true,
        saltRequired: true,
        dateStart: true,
        dateEnd: true,
        colTotalDuration: true,
        colRemainingDuration: true,
        notes: true,
        tags: true,
        actions: true,
      });
    } else if (width >= 1600) {
      // wide
      setColumnVisibility({
        narrowViewCol: false,
        status: true,
        dateCreated: true,
        fermentName: true,
        brinePercentage: true,
        weight: true,
        saltRequired: false,
        dateStart: true,
        dateEnd: false,
        colTotalDuration: true,
        colRemainingDuration: false,
        notes: false,
        tags: true,
        actions: true,
      });
    } else if (width >= 1300) {
      // medium
      setColumnVisibility({
        narrowViewCol: false,
        status: true,
        dateCreated: true,
        fermentName: true,
        brinePercentage: false,
        weight: false,
        saltRequired: false,
        dateStart: true,
        dateEnd: false,
        colTotalDuration: true,
        colRemainingDuration: false,
        notes: false,
        tags: true,
        actions: true,
      });
    } else if (width >= 800) {
      // medium
      setColumnVisibility({
        narrowViewCol: false,
        status: true,
        dateCreated: false,
        fermentName: true,
        brinePercentage: false,
        weight: false,
        saltRequired: false,
        dateStart: true,
        dateEnd: false,
        colTotalDuration: false,
        colRemainingDuration: false,
        notes: false,
        tags: true,
        actions: true,
      });
    } else {
      // narrow: hide all optional columns
      setColumnVisibility({
        narrowViewCol: true,
        status: false,
        dateCreated: false,
        fermentName: false,
        brinePercentage: false,
        weight: false,
        saltRequired: false,
        dateStart: false,
        dateEnd: false,
        colTotalDuration: false,
        colRemainingDuration: false,
        notes: false,
        tags: false,
        actions: true,
      });
    }
  }
  const debouncedResize = useDebouncedCallback(updateColumnVisibilityForWidth, 300);

  // Update column visibility based on table width
  useEffect(() => {
    // Watch window resize
    window.addEventListener('resize', debouncedResize);
    
    // Run once on mount (defer to ensure table is laid out)
    const timeoutId = setTimeout(debouncedResize, 0);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [debouncedResize]);
 
  const columnHelper = createColumnHelper<FermentEntry>();
  const columns = useMemo(() => getColumnsData({ columnHelper, data, setData }), [data, setData]);

  const statusFilterFn: FilterFn<FermentEntry> = useCallback((row, columnId, filterValue) => {
    const selected = String(filterValue ?? '').trim().toLowerCase();
    if (!selected) return true;
    const value = row.getValue(columnId) as string | undefined;
    if (!value) return false;
    return value.toLowerCase() === selected;
  }, []);

  const globalFilterFn: FilterFn<FermentEntry> = useCallback((row, _columnId, filterValue) => {
    const search = String(filterValue ?? '').trim().toLowerCase();
    if (!search) return true;

    const { fermentName, notes, status, dateStart, dateEnd, brinePercentage, weight, saltRequired, tags } = row.original;

    const values: Array<string | number | undefined> = [
      fermentName,
      notes,
      status,
      dateStart,
      dateEnd,
      brinePercentage,
      weight,
      saltRequired,
      ...(tags ?? []),
    ];

    return values.some((val) =>
      val != null && String(val).toLowerCase().includes(search)
    );
  }, []);

  const table = useReactTable({
    data: data || fallbackData,
    columns: columns,
    defaultColumn: {
      enableResizing: true,
    },
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    enableSorting: true,
    sortDescFirst: true,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
      columnFilters,
      pagination
    },
    filterFns: {
      statusFilter: statusFilterFn,
    },
    globalFilterFn,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters
  });

  // Sync external statusFilter control into the table's status column filter
  useEffect(() => {
    const statusColumn = table.getColumn('status');
    if (!statusColumn) return;
    statusColumn.setFilterValue(statusFilter || undefined);
  }, [statusFilter, table]);

  // Load stored ferment data from localStorage on mount (browser only)
  useEffect(() => {
    const loadData = () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('fermentData');
        
        if (stored) {
          try {
            setData(JSON.parse(stored) as FermentEntry[]);
          } catch (e) {
            console.error('Failed to parse localStorage fermentData:', e);
          }
        } else {
          setData([]);
        }
      }
    };
    loadData();
    // Listen for updates from Calculator component
    window.addEventListener('fermentDataUpdated', loadData);

    setIsLoading(false);
    return () => {
      window.removeEventListener('fermentDataUpdated', loadData);
    };
  }, []);

  // Update table data when ferment list changes
  useEffect(() => {
    table.setOptions(prev => ({
      ...prev,
      data,
    }));
  }, [data, table]);

  return (
    isLoading ? (
      <Spinner />
    ) : (
      <div>
        {data.length === 0 ? (
        <NoDataAvailable setData={setData} />
        ) : (
        <>
        <FermentListHeader data={data} setData={setData} />
        <FermentListFilters 
          globalFilter={globalFilter} 
          setGlobalFilter={setGlobalFilter} 
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter} />
        <table className='ferment-list'>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {header.isPlaceholder
                        ? null
                        : typeof header.column.columnDef.header === 'function'
                          ? header.column.columnDef.header(header.getContext())
                          : header.column.columnDef.header}
                      {header.column.getCanSort() && (
                        <span>
                          {header.column.getIsSorted() === 'desc' ? <HiOutlineSortDescending /> : header.column.getIsSorted() === 'asc' ? <HiOutlineSortAscending /> : <HiOutlineSelector />}
                        </span>
                      )}  
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} data-row-id={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    <div className="ferment-list--cell">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <FermentListPagination table={table} />
        <FermentListFooter table={table} />
        </>
      )}
    </div>
    )
  );
}