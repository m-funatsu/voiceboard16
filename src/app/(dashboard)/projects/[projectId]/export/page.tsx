'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { getAllFeedbackForProject, getProjectById } from '@/lib/storage';

export default function ExportPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [loading, setLoading] = useState(false);

  const exportAs = async (format: 'csv' | 'json') => {
    setLoading(true);
    try {
      const [project, feedback] = await Promise.all([
        getProjectById(projectId),
        getAllFeedbackForProject(projectId),
      ]);

      const projectName = project?.slug || 'export';

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(feedback, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${projectName}-feedback.json`);
      } else {
        const headers = ['id', 'title', 'description', 'category', 'status', 'voteCount', 'createdAt'];
        const rows = feedback.map((item) =>
          headers.map((h) => {
            const val = String(item[h as keyof typeof item] || '');
            return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(',')
        );
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
        downloadBlob(blob, `${projectName}-feedback.csv`);
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">エクスポート</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="mb-6 text-sm text-gray-600">
          フィードバックデータをCSVまたはJSON形式でダウンロードできます。
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => exportAs('csv')}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            📄 CSVでエクスポート
          </button>
          <button
            onClick={() => exportAs('json')}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            📋 JSONでエクスポート
          </button>
        </div>
      </div>
    </div>
  );
}
