import { useState, useCallback } from 'react';
import { useExpenses } from '@/context/ExpenseContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function CSVUploadDialog() {
  const { addTransactions, categories } = useExpenses();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{ date: string; description: string; amount: number }[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const header = lines[0].toLowerCase();
    const hasHeader = header.includes('date') || header.includes('amount') || header.includes('description');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        date: cols[0] || new Date().toISOString().slice(0, 10),
        description: cols[1] || 'Imported',
        amount: Math.abs(parseFloat(cols[2]) || 0),
      };
    }).filter(t => t.amount > 0);
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target?.result as string);
      setPreview(parsed);
    };
    reader.readAsText(file);
  }, [parseCSV]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = () => {
    const defaultCat = categories.find(c => c.id === 'other') || categories[0];
    addTransactions(preview.map(t => ({
      date: t.date,
      description: t.description,
      amount: t.amount,
      categoryId: defaultCat.id,
    })));
    toast.success(`Imported ${preview.length} transactions`);
    setPreview([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setPreview([]); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="h-3.5 w-3.5" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Transactions from CSV</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Expected format: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">date, description, amount</code>
        </p>

        {preview.length === 0 ? (
          <div
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragOver ? 'border-primary bg-accent' : 'border-border'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">Drop your CSV file here or</p>
            <label className="cursor-pointer">
              <span className="text-sm text-primary hover:underline">browse files</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="max-h-60 overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Date</th>
                    <th className="text-left p-2 font-medium">Description</th>
                    <th className="text-right p-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-mono-num text-xs">{row.date}</td>
                      <td className="p-2">{row.description}</td>
                      <td className="p-2 text-right font-mono-num">${row.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{preview.length} transactions found</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreview([])}>Cancel</Button>
                <Button size="sm" onClick={handleImport}>Import All</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
