import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const DataTable = ({ columns, data, loading, actions }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
        <p className="text-muted-foreground font-medium">Aucune donnée trouvée.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            {columns.map((col, idx) => (
              <TableHead key={idx} className="font-semibold text-foreground/70">
                {col.header}
              </TableHead>
            ))}
            {actions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rIdx) => (
            <TableRow key={rIdx} className="transition-colors hover:bg-muted/30">
              {columns.map((col, cIdx) => (
                <TableCell key={cIdx} className="py-4">
                  {col.cell ? col.cell(row) : row[col.accessorKey]}
                </TableCell>
              ))}
              {actions && (
                <TableCell className="text-right py-4">
                  {actions(row)}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataTable;