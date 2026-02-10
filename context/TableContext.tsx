'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface TableContextType {
  tableId: string | null;
  tableName: string | null;
  branchId: string | null;
  setTableInfo: (id: string, name: string, branchId: string) => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export function TableProvider({ children }: { children: React.ReactNode }) {
  const [tableId, setTableId] = useState<string | null>(null);
  const [tableName, setTableName] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem('coffee-shop-table-id');
    const savedName = localStorage.getItem('coffee-shop-table-name');
    const savedBranchId = localStorage.getItem('coffee-shop-branch-id');
    if (savedId) setTableId(savedId);
    if (savedName) setTableName(savedName);
    if (savedBranchId) setBranchId(savedBranchId);
  }, []);

  const setTableInfo = (id: string, name: string, bId: string) => {
    setTableId(id);
    setTableName(name);
    setBranchId(bId);
    localStorage.setItem('coffee-shop-table-id', id);
    localStorage.setItem('coffee-shop-table-name', name);
    localStorage.setItem('coffee-shop-branch-id', bId);
  };

  return (
    <TableContext.Provider value={{ tableId, tableName, branchId, setTableInfo }}>
      {children}
    </TableContext.Provider>
  );
}

export function useTable() {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
}
