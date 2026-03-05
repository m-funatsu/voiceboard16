'use client';

import { useState } from 'react';

interface Column {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

interface ExportButtonProps {
  data: Record<string, unknown>[];
  columns: Column[];
  filename?: string;
  className?: string;
}

export function ExportButton({ data, columns, filename = 'export', className = '' }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    try {
      const BOM = '\uFEFF';
      const header = columns.map(c => c.label).join(',');
      const rows = data.map(row =>
        columns.map(col => {
          const value = col.format ? col.format(row[col.key]) : row[col.key];
          const str = String(value ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(',')
      );
      const csv = BOM + [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting || data.length === 0}
      className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      {exporting ? 'エクスポート中...' : 'CSVエクスポート'}
    </button>
  );
}
