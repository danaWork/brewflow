'use client';

import { useTable } from '@/context/TableContext';

interface MenuHeaderProps {
  tableId: string;
}

export default function MenuHeader({ tableId }: MenuHeaderProps) {
  const { tableName } = useTable();
  
  // Use tableName from context if available, otherwise parse from tableId
  let displayTableName = tableName;
  
  if (!displayTableName) {
    displayTableName = tableId.replace('table-', 'Table ');
    if (!displayTableName.toLowerCase().startsWith('table')) {
      displayTableName = `Table ${displayTableName}`;
    }
    displayTableName = displayTableName.replace(/^\w/, c => c.toUpperCase());
  }

  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2 bg-white border-b-0">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
        <span className="text-gray-400 font-medium">•</span>
        <span className="text-gray-500 font-medium">{displayTableName}</span>
      </div>
      
      {/* Placeholder for potential other actions */}
    </div>
  );
}
