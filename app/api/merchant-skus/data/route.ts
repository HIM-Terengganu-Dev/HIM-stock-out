import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET - Serve the JSON file
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'merchantSkus.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading merchantSkus.json:', error);
    return NextResponse.json(
      { error: 'Failed to read merchant SKU data' },
      { status: 500 }
    );
  }
}
