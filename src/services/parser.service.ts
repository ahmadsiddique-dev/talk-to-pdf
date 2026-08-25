import fs from 'node:fs'
import { PDFParse } from 'pdf-parse'

export async function parsePDF(filePath: string): Promise<string> {
    const pdfBuffer = fs.readFileSync(filePath, 'utf-8');
    
    const parser = new PDFParse({
        data: pdfBuffer
    });

    const { text } = await parser.getText();

    return text;
}