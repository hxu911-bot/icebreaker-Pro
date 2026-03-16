import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { env } from '../../config/env';
import { authenticate } from '../../middleware/authenticate';
import { ValidationError } from '../../shared/errors';

export const csvRouter = Router();

const upload = multer({ dest: env.UPLOAD_DIR, limits: { fileSize: 10 * 1024 * 1024 } });

csvRouter.post('/', authenticate, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  const file = req.file;
  if (!file) return next(new ValidationError('No file uploaded'));
  const ext = path.extname(file.originalname).toLowerCase();
  const filePath = file.path;
  try {
    let candidates: Array<{ name?: string; email?: string; rawText: string; source: string }> = [];
    if (ext === '.csv') {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length < 2) return next(new ValidationError('CSV must have header + data rows'));
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const bgIdx = headers.findIndex(h => h.includes('background') || h.includes('bio') || h.includes('summary') || h.includes('text'));
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const name = nameIdx >= 0 ? cols[nameIdx] : undefined;
        const email = emailIdx >= 0 ? cols[emailIdx] : undefined;
        const rawText = bgIdx >= 0 ? cols[bgIdx] : cols.join(' ');
        if (rawText) candidates.push({ name, email, rawText, source: 'csv' });
      }
    } else if (ext === '.xlsx' || ext === '.xls') {
      const XLSX = require('xlsx');
      const wb = XLSX.readFile(filePath);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);
      for (const row of rows) {
        const keys = Object.keys(row).map(k => k.toLowerCase());
        const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name'));
        const emailKey = Object.keys(row).find(k => k.toLowerCase().includes('email'));
        const bgKey = Object.keys(row).find(k => k.toLowerCase().includes('background') || k.toLowerCase().includes('bio') || k.toLowerCase().includes('summary'));
        const rawText = bgKey ? String(row[bgKey]) : Object.values(row).join(' ');
        if (rawText.trim()) {
          candidates.push({
            name: nameKey ? String(row[nameKey]) : undefined,
            email: emailKey ? String(row[emailKey]) : undefined,
            rawText: rawText.trim(),
            source: 'excel',
          });
        }
      }
    } else {
      return next(new ValidationError('Only .csv, .xlsx, .xls supported'));
    }
    res.json({ candidates, count: candidates.length });
  } catch (e) { next(e); } finally { fs.unlink(filePath, () => {}); }
});
