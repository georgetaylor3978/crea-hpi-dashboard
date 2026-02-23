/**
 * update-data.js — Converts House Price Import.xlsx → data.json
 * 
 * Usage: node update-data.js
 * 
 * This script reads "House Price Import.xlsx" from the same directory
 * and produces a compact "data.json" that the dashboard loads.
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT_FILE = 'House Price Import.xlsx';
const OUTPUT_FILE = 'data.json';

console.log(`\n📊 CREA HPI Data Converter`);
console.log(`${'─'.repeat(40)}`);

// Check input file exists
const inputPath = path.join(__dirname, INPUT_FILE);
if (!fs.existsSync(inputPath)) {
    console.error(`\n❌ Error: "${INPUT_FILE}" not found!`);
    console.error(`   Make sure the file is in: ${__dirname}`);
    process.exit(1);
}

console.log(`📂 Reading: ${INPUT_FILE}`);
const wb = XLSX.readFile(inputPath);
console.log(`   Found ${wb.SheetNames.length} location sheets`);

// Convert Excel serial date to ISO date string (YYYY-MM-DD)
function excelDateToISO(serial) {
    if (!serial || typeof serial !== 'number') return null;
    const utc_days = Math.floor(serial - 25569);
    const d = new Date(utc_days * 86400 * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

const output = {};
let totalRows = 0;

for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    if (raw.length < 2) continue;

    const headers = raw[0].map(h => String(h || '').trim());
    const rows = [];

    for (let i = 1; i < raw.length; i++) {
        const r = raw[i];
        if (!r[0] && !r[1]) continue;

        // Convert row to compact array format
        // First element is the ISO date string, rest are numeric values
        const dateISO = excelDateToISO(r[0]);
        if (!dateISO) continue;

        const values = [dateISO];
        for (let j = 1; j < headers.length; j++) {
            values.push(r[j] != null ? Number(r[j]) : null);
        }
        rows.push(values);
    }

    output[sheetName] = {
        headers: headers,
        rows: rows
    };
    totalRows += rows.length;
}

// Write JSON
const outputPath = path.join(__dirname, OUTPUT_FILE);
const json = JSON.stringify(output);
fs.writeFileSync(outputPath, json);

const sizeMB = (Buffer.byteLength(json) / 1024 / 1024).toFixed(2);
console.log(`\n✅ Generated: ${OUTPUT_FILE}`);
console.log(`   ${wb.SheetNames.length} locations, ${totalRows} data points`);
console.log(`   File size: ${sizeMB} MB`);

// Also report the date range
const firstSheet = output[wb.SheetNames[0]];
if (firstSheet && firstSheet.rows.length > 0) {
    const firstDate = firstSheet.rows[0][0];
    const lastDate = firstSheet.rows[firstSheet.rows.length - 1][0];
    console.log(`   Date range: ${firstDate} → ${lastDate}`);
}

console.log(`\n🚀 Data is ready! Run "update.bat" to push to GitHub.\n`);
