'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface TableContextType {
  tableId: string | null;
  tableName: string | null;
  setTableInfo: (id: string, name: string) => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export function TableProvider({ children }: { children: React.ReactNode }) {
  const [tableId, setTableId] = useState<string | null>(null);
  const [tableName, setTableName] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem('coffee-shop-table-id');
    const savedName = localStorage.getItem('coffee-shop-table-name');
    if (savedId) setTableId(savedId);
    if (savedName) setTableName(savedName);
  }, []);

  const setTableInfo = (id: string, name: string) => {
    setTableId(id);
    setTableName(name);
    localStorage.setItem('coffee-shop-table-id', id);
    localStorage.setItem('coffee-shop-table-name', name);
  };

  return (
    <TableContext.Provider value={{ tableId, tableName, setTableInfo }}>
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
