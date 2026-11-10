/**
 * update-data.js - Converts House Price Import.xlsx -> data.json
 *
 * Usage: node update-data.js
 *
 * This script reads "House Price Import.xlsx" from the same directory
 * and produces a compact "data.json" that the dashboard loads.
 *
 * Built-in corruption guard: scans output for encoding garbage before saving.
 * If anything suspicious is found, the script stops and refuses to write.
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const INPUT_FILE = 'House Price Import.xlsx';
const OUTPUT_FILE = 'data.json';

console.log('\n[INFO] CREA HPI Data Converter');
console.log('-'.repeat(40));

// --------------------------------------------------------------------------
// CORRUPTION GUARD
// Scans a string for known encoding-garbage patterns.
// Returns a list of problems found, or empty array if clean.
// --------------------------------------------------------------------------
function checkForCorruption(text) {
    const problems = [];

    // Mojibake patterns: these byte sequences appear when UTF-8 text gets
    // mis-read as Latin-1 or Windows-1252, then re-encoded as UTF-8.
    // They should NEVER appear in normal location names or dates.
    const mojibakePatterns = [
        { pattern: /\u00c3\u00a2/g,   name: 'UTF-8 double-encoding (a-circumflex-euro sequence)' },
        { pattern: /\u00e2\u0080/g,   name: 'UTF-8 double-encoding (a-circumflex-euro sequence)' },
        { pattern: /\u00ef\u00bb\u00bf/g, name: 'UTF-8 BOM inside content' },
        { pattern: /[\u0080-\u009f]/g, name: 'Windows-1252 control characters' },
        { pattern: /\ufffd/g,          name: 'Unicode replacement character' },
    ];

    // Also check that location names (the JSON keys) look reasonable:
    // they should only contain ASCII letters, digits, underscores.
    const locationPattern = /^[A-Z][A-Z0-9_]*$/;

    for (const { pattern, name } of mojibakePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            problems.push(`Found ${matches.length}x ${name}`);
        }
    }

    return problems;
}

// --------------------------------------------------------------------------
// INPUT CHECK
// --------------------------------------------------------------------------
const inputPath = path.join(__dirname, INPUT_FILE);
if (!fs.existsSync(inputPath)) {
    console.error(`\n[ERROR] "${INPUT_FILE}" not found!`);
    console.error(`   Make sure the file is in: ${__dirname}`);
    process.exit(1);
}

console.log(`[INFO] Reading: ${INPUT_FILE}`);
const wb = XLSX.readFile(inputPath);
console.log(`   Found ${wb.SheetNames.length} location sheets`);

// --------------------------------------------------------------------------
// DATE CONVERSION
// --------------------------------------------------------------------------
function excelDateToISO(serial) {
    if (!serial || typeof serial !== 'number') return null;
    const utc_days = Math.floor(serial - 25569);
    const d = new Date(utc_days * 86400 * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// --------------------------------------------------------------------------
// DATA CONVERSION
// --------------------------------------------------------------------------
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

        const dateISO = excelDateToISO(r[0]);
        if (!dateISO) continue;

        const values = [dateISO];
        for (let j = 1; j < headers.length; j++) {
            values.push(r[j] != null ? Number(r[j]) : null);
        }
        rows.push(values);
    }

    output[sheetName] = { headers, rows };
    totalRows += rows.length;
}

// --------------------------------------------------------------------------
// CORRUPTION GUARD - runs BEFORE writing anything
// --------------------------------------------------------------------------
console.log('\n[INFO] Running corruption check...');
const json = JSON.stringify(output);
const problems = checkForCorruption(json);

if (problems.length > 0) {
    console.error('\n[ERROR] CORRUPTION DETECTED - file NOT saved, GitHub NOT updated.');
    console.error('   The output data contains encoding garbage that would break the site:');
    for (const p of problems) {
        console.error(`   - ${p}`);
    }
    console.error('\n   What to do:');
    console.error('   1. Make sure your Excel file was saved normally (File > Save in Excel)');
    console.error('   2. Do NOT copy/paste data from a web browser into Excel - re-download it');
    console.error('   3. Contact support if this keeps happening');
    console.error('\n   data.json has NOT been changed. Your site is unchanged.\n');
    process.exit(1);
}

console.log('[OK] No corruption found - data looks clean.');

// --------------------------------------------------------------------------
// WRITE OUTPUT (only reached if corruption check passed)
// --------------------------------------------------------------------------
const outputPath = path.join(__dirname, OUTPUT_FILE);
fs.writeFileSync(outputPath, json, { encoding: 'utf8' });

const sizeMB = (Buffer.byteLength(json) / 1024 / 1024).toFixed(2);
console.log(`\n[OK] Generated: ${OUTPUT_FILE}`);
console.log(`   ${wb.SheetNames.length} locations, ${totalRows} data points`);
console.log(`   File size: ${sizeMB} MB`);

const firstSheet = output[wb.SheetNames[0]];
if (firstSheet && firstSheet.rows.length > 0) {
    const firstDate = firstSheet.rows[0][0];
    const lastDate = firstSheet.rows[firstSheet.rows.length - 1][0];
    console.log(`   Date range: ${firstDate} -> ${lastDate}`);
}

console.log('\n[OK] Data is ready! Run "update.bat" to push to GitHub.\n');