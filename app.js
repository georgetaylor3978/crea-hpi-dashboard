/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CREA HPI Dashboard â€” Application Logic
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

// â”€â”€ State â”€â”€
let allData = {};           // { sheetName: { headers: [...], rows: [...] } }
let locationMeta = {};      // { displayName: { sheetKey, type, region } }
let mainChart = null;
let changesChart = null;    // YoY/MoM chart
let dataMinDate = null;     // overall min date in data
let dataMaxDate = null;     // overall max date in data

// â”€â”€ Color Palette for chart lines â”€â”€
const CHART_COLORS = {
    primary: { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.08)' },
    compare: { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.08)' },
    hpi: { line: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.08)' },
    hpiCompare: { line: '#ec4899', fill: 'rgba(236, 72, 153, 0.08)' },
};

// â”€â”€ Location mapping (display name â†’ sheet name in import file) â”€â”€
// Built from the crtl sheet data we extracted
const LOCATION_MAP = {
    'Aggregate': { sheet: 'AGGREGATE', type: 'Country', region: 'CANADA' },
    'Alberta': { sheet: 'ALBERTA', type: 'Province', region: 'AB' },
    'Calgary': { sheet: 'CALGARY', type: 'Region', region: 'AB' },
    'Edmonton': { sheet: 'EDMONTON', type: 'Region', region: 'AB' },
    'British Columbia': { sheet: 'BRITISH_COLUMBIA', type: 'Province', region: 'BC' },
    'Chilliwack And District': { sheet: 'CHILLIWACK_AND_DISTRICT', type: 'Region', region: 'BC' },
    'Fraser Valley': { sheet: 'FRASER_VALLEY', type: 'Region', region: 'BC' },
    'Greater Vancouver': { sheet: 'GREATER_VANCOUVER', type: 'Region', region: 'BC' },
    'Interior Bc': { sheet: 'INTERIOR_BC', type: 'Region', region: 'BC' },
    'Lower Mainland': { sheet: 'LOWER_MAINLAND', type: 'Region', region: 'BC' },
    'Vancouver Island': { sheet: 'VANCOUVER_ISLAND', type: 'Region', region: 'BC' },
    'Victoria': { sheet: 'VICTORIA', type: 'Region', region: 'BC' },
    'Winnipeg': { sheet: 'WINNIPEG', type: 'Region', region: 'MB' },
    'Fredericton': { sheet: 'FREDERICTON', type: 'Region', region: 'NB' },
    'Greater Moncton': { sheet: 'GREATER_MONCTON', type: 'Region', region: 'NB' },
    'New Brunswick': { sheet: 'NEW_BRUNSWICK', type: 'Province', region: 'NB' },
    'Saint John Nb': { sheet: 'SAINT_JOHN_NB', type: 'Region', region: 'NB' },
    'Newfoundland And Labrador': { sheet: 'NEWFOUNDLAND_AND_LABRADOR', type: 'Province', region: 'NFLD' },
    'St Johns Nl': { sheet: 'ST_JOHNS_NL', type: 'Region', region: 'NFLD' },
    'Halifax Dartmouth': { sheet: 'HALIFAX_DARTMOUTH', type: 'Region', region: 'NS' },
    'Nova Scotia': { sheet: 'NOVA_SCOTIA', type: 'Province', region: 'NS' },
    'Bancroft And Area': { sheet: 'BANCROFT_AND_AREA', type: 'Region', region: 'ON' },
    'Barrie And District': { sheet: 'BARRIE_AND_DISTRICT', type: 'Region', region: 'ON' },
    'Brantford Region': { sheet: 'BRANTFORD_REGION', type: 'Region', region: 'ON' },
    'Cambridge': { sheet: 'CAMBRIDGE', type: 'Region', region: 'ON' },
    'Greater Toronto': { sheet: 'GREATER_TORONTO', type: 'Region', region: 'ON' },
    'Grey Bruce Owen Sound': { sheet: 'GREY_BRUCE_OWEN_SOUND', type: 'Region', region: 'ON' },
    'Guelph And District': { sheet: 'GUELPH_AND_DISTRICT', type: 'Region', region: 'ON' },
    'Hamilton Burlington': { sheet: 'HAMILTON_BURLINGTON', type: 'Region', region: 'ON' },
    'Huron Perth': { sheet: 'HURON_PERTH', type: 'Region', region: 'ON' },
    'Kawartha Lakes': { sheet: 'KAWARTHA_LAKES', type: 'Region', region: 'ON' },
    'Kingston And Area': { sheet: 'KINGSTON_AND_AREA', type: 'Region', region: 'ON' },
    'Kitchener Waterloo': { sheet: 'KITCHENER_WATERLOO', type: 'Region', region: 'ON' },
    'Lakelands': { sheet: 'LAKELANDS', type: 'Region', region: 'ON' },
    'London St Thomas': { sheet: 'LONDON_ST_THOMAS', type: 'Region', region: 'ON' },
    'Mississauga': { sheet: 'MISSISSAUGA', type: 'Region', region: 'ON' },
    'Niagara Region': { sheet: 'NIAGARA_REGION', type: 'Region', region: 'ON' },
    'North Bay': { sheet: 'NORTH_BAY', type: 'Region', region: 'ON' },
    'Northumberland Hills': { sheet: 'NORTHUMBERLAND_HILLS', type: 'Region', region: 'ON' },
    'Oakville Milton': { sheet: 'OAKVILLE_MILTON', type: 'Region', region: 'ON' },
    'Ontario': { sheet: 'ONTARIO', type: 'Province', region: 'ON' },
    'Ottawa': { sheet: 'OTTAWA', type: 'Region', region: 'ON' },
    'Peterborough And Kawarthas': { sheet: 'PETERBOROUGH_AND_KAWARTHAS', type: 'Region', region: 'ON' },
    'Quinte And District': { sheet: 'QUINTE_AND_DISTRICT', type: 'Region', region: 'ON' },
    'Rideau St Lawrence': { sheet: 'RIDEAU_ST_LAWRENCE', type: 'Region', region: 'ON' },
    'Sault Ste Marie': { sheet: 'SAULT_STE_MARIE', type: 'Region', region: 'ON' },
    'Simcoe And District': { sheet: 'SIMCOE_AND_DISTRICT', type: 'Region', region: 'ON' },
    'Sudbury': { sheet: 'SUDBURY', type: 'Region', region: 'ON' },
    'Windsor Essex': { sheet: 'WINDSOR_ESSEX', type: 'Region', region: 'ON' },
    'Woodstock Ingersoll Tillsonburg': { sheet: 'WOODSTOCK_INGERSOLL_TILLSONBURG', type: 'Region', region: 'ON' },
    'Prince Edward Island': { sheet: 'PRINCE_EDWARD_ISLAND', type: 'Province', region: 'PEI' },
    'Centre Du Quebec': { sheet: 'CENTRE_DU_QUEBEC', type: 'Region', region: 'QC' },
    'Estrie': { sheet: 'ESTRIE', type: 'Region', region: 'QC' },
    'Mauricie': { sheet: 'MAURICIE', type: 'Region', region: 'QC' },
    'Montreal Cma': { sheet: 'MONTREAL_CMA', type: 'Region', region: 'QC' },
    'Quebec': { sheet: 'QUEBEC', type: 'Province', region: 'QC' },
    'Quebec Cma': { sheet: 'QUEBEC_CMA', type: 'Region', region: 'QC' },
    'Regina': { sheet: 'REGINA', type: 'Region', region: 'SK' },
    'Saskatchewan': { sheet: 'SASKATCHEWAN', type: 'Province', region: 'SK' },
    'Saskatoon': { sheet: 'SASKATOON', type: 'Region', region: 'SK' },
};

// Region display names
const REGION_NAMES = {
    'CANADA': 'ðŸ‡¨ðŸ‡¦ Canada (National)',
    'BC': 'British Columbia',
    'AB': 'Alberta',
    'SK': 'Saskatchewan',
    'MB': 'Manitoba',
    'ON': 'Ontario',
    'QC': 'Quebec',
    'NB': 'New Brunswick',
    'NS': 'Nova Scotia',
    'PEI': 'PEI',
    'NFLD': 'Newfoundland & Labrador',
};

// Region ordering (west to east)
const REGION_ORDER = ['CANADA', 'BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PEI', 'NFLD'];

// Property type column mapping
// Headers look like: Date, Composite_HPI, Single_Family_HPI, ... Composite_Benchmark, Single_Family_Benchmark, ...
const PROPERTY_COLUMNS = {
    'Composite': { hpi: 'Composite_HPI', benchmark: 'Composite_Benchmark' },
    'Single_Family': { hpi: 'Single_Family_HPI', benchmark: 'Single_Family_Benchmark' },
    'One_Storey': { hpi: 'One_Storey_HPI', benchmark: 'One_Storey_Benchmark' },
    'Two_Storey': { hpi: 'Two_Storey_HPI', benchmark: 'Two_Storey_Benchmark' },
    'Townhouse': { hpi: 'Townhouse_HPI', benchmark: 'Townhouse_Benchmark' },
    'Apartment': { hpi: 'Apartment_HPI', benchmark: 'Apartment_Benchmark' },
};


// â•â•â•â•â•â•â•â•â•â•â• DOM REFERENCES â•â•â•â•â•â•â•â•â•â•â•
const fileInput = document.getElementById('fileInput');
const dataStatus = document.getElementById('dataStatus');
const locationSelect = document.getElementById('locationSelect');
const compareLocation = document.getElementById('compareLocation');
const propertyType = document.getElementById('propertyType');
const chartTypeSelect = document.getElementById('chartType');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const dateFromLabel = document.getElementById('dateFromLabel');
const dateToLabel = document.getElementById('dateToLabel');
const dateFromTrigger = document.getElementById('dateFromTrigger');
const dateToTrigger = document.getElementById('dateToTrigger');
const chartWrapper = document.querySelector('.chart-wrapper');
const emptyState = document.getElementById('emptyState');
const chartTitle = document.getElementById('chartTitle');

// Month picker
const monthPickerPopup = document.getElementById('monthPickerPopup');
const mpYear = document.getElementById('mpYear');
const mpPrevYear = document.getElementById('mpPrevYear');
const mpNextYear = document.getElementById('mpNextYear');
const mpGrid = document.getElementById('mpGrid');
let mpCurrentYear = 2025;
let mpTarget = null; // 'dateFrom' or 'dateTo'


// â•â•â•â•â•â•â•â•â•â•â• UTILITY FUNCTIONS â•â•â•â•â•â•â•â•â•â•â•

/** Convert Excel serial date OR ISO date string to JavaScript Date */
function excelDateToJS(serial) {
    if (!serial) return null;
    // Handle ISO date strings (from data.json)
    if (typeof serial === 'string') {
        const d = new Date(serial);
        return isNaN(d.getTime()) ? null : d;
    }
    // Handle Excel serial numbers (from .xlsx)
    if (typeof serial !== 'number') return null;
    const utc_days = Math.floor(serial - 25569);
    return new Date(utc_days * 86400 * 1000);
}

/** Format date as YYYY-MM */
function formatYearMonth(date) {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

/** Format date as Mon YYYY */
function formatMonthYear(date) {
    if (!date) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

/** Format currency */
function formatCurrency(val) {
    if (val == null || isNaN(val)) return 'â€”';
    return '$' + val.toLocaleString('en-CA', { maximumFractionDigits: 0 });
}

/** Format percentage */
function formatPercent(val) {
    if (val == null || isNaN(val)) return 'â€”';
    const sign = val >= 0 ? '+' : '';
    return sign + val.toFixed(1) + '%';
}

/** Show a toast notification */
function showToast(message, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast ${type}`;
    requestAnimationFrame(() => {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    });
}


// â•â•â•â•â•â•â•â•â•â•â• DATA LOADING â•â•â•â•â•â•â•â•â•â•â•

function loadWorkbook(arrayBuffer) {
    const wb = XLSX.read(arrayBuffer, { type: 'array' });
    allData = {};

    for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
        if (raw.length < 2) continue;

        const headers = raw[0].map(h => String(h || '').trim());
        const rows = [];

        for (let i = 1; i < raw.length; i++) {
            const r = raw[i];
            // Skip empty rows
            if (!r[0] && !r[1]) continue;

            const obj = {};
            for (let j = 0; j < headers.length; j++) {
                obj[headers[j]] = r[j];
            }
            rows.push(obj);
        }

        allData[sheetName] = { headers, rows };
    }

    return Object.keys(allData).length;
}

/** Load pre-baked JSON data (from update-data.js output) */
function loadJSON(jsonData) {
    allData = {};

    for (const [sheetName, sheetData] of Object.entries(jsonData)) {
        const headers = sheetData.headers;
        const rows = [];

        for (const r of sheetData.rows) {
            const obj = {};
            for (let j = 0; j < headers.length; j++) {
                if (j === 0) {
                    // First column is Date (ISO string)
                    obj[headers[j]] = r[j];
                } else {
                    obj[headers[j]] = r[j];
                }
            }
            rows.push(obj);
        }

        allData[sheetName] = { headers, rows };
    }

    return Object.keys(allData).length;
}

function populateControls() {
    // â”€â”€ Build location dropdown, grouped by region â”€â”€
    locationSelect.innerHTML = '<option value="">â€” Select Location â€”</option>';
    compareLocation.innerHTML = '<option value="">None</option>';

    const grouped = {};
    for (const [name, meta] of Object.entries(LOCATION_MAP)) {
        // Only include if we have data for this sheet
        if (!allData[meta.sheet]) continue;
        const region = meta.region;
        if (!grouped[region]) grouped[region] = [];
        grouped[region].push({ name, ...meta });
    }

    for (const regionKey of REGION_ORDER) {
        const items = grouped[regionKey];
        if (!items || items.length === 0) continue;

        const regionLabel = REGION_NAMES[regionKey] || regionKey;
        const group1 = document.createElement('optgroup');
        group1.label = regionLabel;
        const group2 = document.createElement('optgroup');
        group2.label = regionLabel;

        // Sort: provinces first, then regions alphabetically
        items.sort((a, b) => {
            if (a.type === 'Country') return -1;
            if (b.type === 'Country') return 1;
            if (a.type === 'Province' && b.type !== 'Province') return -1;
            if (b.type === 'Province' && a.type !== 'Province') return 1;
            return a.name.localeCompare(b.name);
        });

        for (const item of items) {
            const prefix = item.type === 'Province' ? 'ðŸ“Š ' : item.type === 'Country' ? 'ðŸ  ' : '  ';
            const opt1 = new Option(prefix + item.name, item.name);
            const opt2 = new Option(prefix + item.name, item.name);
            group1.appendChild(opt1);
            group2.appendChild(opt2);
        }

        locationSelect.appendChild(group1);
        compareLocation.appendChild(group2);
    }

    // â”€â”€ Filter property type options based on first available sheet â”€â”€
    // Some sheets have fewer columns (no Townhouse/Apartment)
    // We'll update available types when location changes

    // â”€â”€ Set date range â”€â”€
    // Find the overall min/max dates from any sheet
    let minDateObj = null, maxDateObj = null;
    for (const sheetData of Object.values(allData)) {
        for (const row of sheetData.rows) {
            const d = row.Date;
            if (!d) continue;
            const jsDate = excelDateToJS(d);
            if (!jsDate) continue;
            if (!minDateObj || jsDate < minDateObj) minDateObj = jsDate;
            if (!maxDateObj || jsDate > maxDateObj) maxDateObj = jsDate;
        }
    }

    if (minDateObj) {
        dataMinDate = minDateObj;
        dataMaxDate = maxDateObj;

        // Default: show last 10 years
        const tenYearsAgo = new Date(dataMaxDate);
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        setDateValue('dateFrom', formatYearMonth(tenYearsAgo));
        setDateValue('dateTo', formatYearMonth(dataMaxDate));
    }

    // Enable controls
    locationSelect.disabled = false;
    compareLocation.disabled = false;
    propertyType.disabled = false;
    chartTypeSelect.disabled = false;
}


// â•â•â•â•â•â•â•â•â•â•â• DATA EXTRACTION â•â•â•â•â•â•â•â•â•â•â•

function getSeriesData(locationName, propType, chartDataType) {
    const meta = LOCATION_MAP[locationName];
    if (!meta || !allData[meta.sheet]) return null;

    const sheet = allData[meta.sheet];
    const colDef = PROPERTY_COLUMNS[propType];
    if (!colDef) return null;

    // Check which columns exist in this sheet
    const hasHPI = sheet.headers.includes(colDef.hpi);
    const hasBenchmark = sheet.headers.includes(colDef.benchmark);

    if (!hasHPI && !hasBenchmark) return null;

    const dateFromVal = dateFrom.value ? new Date(dateFrom.value + '-01') : null;
    const dateToVal = dateTo.value ? new Date(dateTo.value.slice(0,4), parseInt(dateTo.value.slice(5,7)), 1) : null; // last moment of selected month (day 0 of next month = last day of this month)

    const hpiData = [];
    const benchmarkData = [];

    for (const row of sheet.rows) {
        const jsDate = excelDateToJS(row.Date);
        if (!jsDate) continue;

        // Date filtering
        if (dateFromVal && jsDate < dateFromVal) continue;
        if (dateToVal && jsDate > dateToVal) continue;

        if (hasHPI && row[colDef.hpi] != null) {
            hpiData.push({ x: jsDate, y: Number(row[colDef.hpi]) });
        }
        if (hasBenchmark && row[colDef.benchmark] != null) {
            benchmarkData.push({ x: jsDate, y: Number(row[colDef.benchmark]) });
        }
    }

    return { hpiData, benchmarkData, hasHPI, hasBenchmark };
}


// â•â•â•â•â•â•â•â•â•â•â• CHART RENDERING â•â•â•â•â•â•â•â•â•â•â•

function updateChart() {
    const location = locationSelect.value;
    if (!location) {
        emptyState.classList.remove('hidden');
        chartWrapper.classList.remove('active');
        chartTitle.textContent = 'Select a location to view data';
        clearSummaryCards();
        return;
    }

    const propType = propertyType.value;
    const chartDataType = chartTypeSelect.value;
    const compareLoc = compareLocation.value;

    const series = getSeriesData(location, propType, chartDataType);
    if (!series) {
        showToast(`No ${propType.replace('_', ' ')} data for ${location}`, 'error');
        return;
    }

    emptyState.classList.add('hidden');
    chartWrapper.classList.add('active');

    // Build datasets
    const datasets = [];
    const scales = {};

    const propLabel = propType.replace(/_/g, ' ');

    if (chartDataType === 'benchmark' || chartDataType === 'both') {
        if (series.hasBenchmark && series.benchmarkData.length > 0) {
            datasets.push({
                label: `${location} â€” ${propLabel} Benchmark Price`,
                data: series.benchmarkData,
                borderColor: CHART_COLORS.primary.line,
                backgroundColor: CHART_COLORS.primary.fill,
                fill: true,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5,
                borderWidth: 2.5,
                yAxisID: 'y',
            });
            scales.y = {
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Benchmark Price (CAD $)', color: '#8b95b0', font: { family: 'Inter', size: 11 } },
                ticks: {
                    color: '#8b95b0',
                    font: { family: 'Inter', size: 11 },
                    callback: v => '$' + (v / 1000).toFixed(0) + 'K',
                },
                grid: { color: 'rgba(255,255,255,0.04)' },
            };
        }
    }

    if (chartDataType === 'hpi' || chartDataType === 'both') {
        if (series.hasHPI && series.hpiData.length > 0) {
            const axisId = chartDataType === 'both' ? 'y1' : 'y';
            datasets.push({
                label: `${location} â€” ${propLabel} HPI`,
                data: series.hpiData,
                borderColor: chartDataType === 'both' ? CHART_COLORS.hpi.line : CHART_COLORS.primary.line,
                backgroundColor: chartDataType === 'both' ? CHART_COLORS.hpi.fill : CHART_COLORS.primary.fill,
                fill: chartDataType !== 'both',
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 5,
                borderWidth: 2.5,
                yAxisID: axisId,
                borderDash: chartDataType === 'both' ? [5, 3] : [],
            });

            if (chartDataType === 'both') {
                scales.y1 = {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'HPI Index', color: '#8b95b0', font: { family: 'Inter', size: 11 } },
                    ticks: { color: '#8b5cf6', font: { family: 'Inter', size: 11 } },
                    grid: { drawOnChartArea: false },
                };
            } else {
                scales.y = {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'HPI Index', color: '#8b95b0', font: { family: 'Inter', size: 11 } },
                    ticks: { color: '#8b95b0', font: { family: 'Inter', size: 11 } },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                };
            }
        }
    }

    // â”€â”€ Comparison location â”€â”€
    if (compareLoc && compareLoc !== location) {
        const compSeries = getSeriesData(compareLoc, propType, chartDataType);
        if (compSeries) {
            if ((chartDataType === 'benchmark' || chartDataType === 'both') && compSeries.hasBenchmark) {
                datasets.push({
                    label: `${compareLoc} â€” ${propLabel} Benchmark Price`,
                    data: compSeries.benchmarkData,
                    borderColor: CHART_COLORS.compare.line,
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    borderWidth: 2,
                    yAxisID: 'y',
                });
            }
            if ((chartDataType === 'hpi' || chartDataType === 'both') && compSeries.hasHPI) {
                const axisId = chartDataType === 'both' ? 'y1' : 'y';
                datasets.push({
                    label: `${compareLoc} â€” ${propLabel} HPI`,
                    data: compSeries.hpiData,
                    borderColor: chartDataType === 'both' ? CHART_COLORS.hpiCompare.line : CHART_COLORS.compare.line,
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    borderWidth: 2,
                    yAxisID: axisId,
                    borderDash: chartDataType === 'both' ? [5, 3] : [],
                });
            }
        }
    }

    // â”€â”€ X-axis (time) â”€â”€
    const mainColors = getChartColors();
    scales.x = {
        type: 'time',
        time: { unit: 'year', displayFormats: { year: 'yyyy', month: 'MMM yyyy' } },
        ticks: { color: mainColors.tick, font: { family: 'Inter', size: 11 }, maxTicksLimit: 12 },
        grid: { color: mainColors.grid },
    };

    // Also patch y-axis colours in scales
    for (const axKey of Object.keys(scales)) {
        if (axKey !== 'x') {
            const ax = scales[axKey];
            if (ax.title) ax.title.color = mainColors.tick;
            if (ax.ticks && !ax.ticks._colourSet) {
                ax.ticks.color = mainColors.tick;
            }
            if (ax.grid && ax.grid.drawOnChartArea !== false) {
                ax.grid.color = mainColors.grid;
            }
        }
    }

    // â”€â”€ Update or create chart â”€â”€
    if (mainChart) {
        mainChart.destroy();
    }

    const ctx = document.getElementById('mainChart').getContext('2d');
    mainChart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: datasets.length > 1,
                    position: 'top',
                    align: 'start',
                    labels: {
                        color: mainColors.tick,
                        font: { family: 'Inter', size: 12 },
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 16,
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#f0f4fc',
                    bodyColor: '#8b95b0',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    titleFont: { family: 'Inter', weight: '600' },
                    bodyFont: { family: 'Inter' },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        title: function (items) {
                            const d = new Date(items[0].parsed.x);
                            return formatMonthYear(d);
                        },
                        label: function (ctx) {
                            const label = ctx.dataset.label;
                            const val = ctx.parsed.y;
                            if (label.includes('Benchmark')) {
                                return `${label}: ${formatCurrency(val)}`;
                            }
                            return `${label}: ${val.toFixed(1)}`;
                        },
                    },
                },
            },
            scales,
            animation: {
                duration: 600,
                easing: 'easeOutQuart',
            },
        },
    });

    // â”€â”€ Update title â”€â”€
    const meta = LOCATION_MAP[location];
    const typeLabel = meta ? `(${meta.type})` : '';
    chartTitle.textContent = `${location} ${typeLabel} â€” ${propLabel}`;

    // â”€â”€ Update summary cards â”€â”€
    updateSummaryCards(series, chartDataType);

    // â”€â”€ Update YoY/MoM chart â”€â”€
    updateChangesChart(location, propType, chartDataType);
}

function updateSummaryCards(series, chartDataType) {
    const data = (chartDataType === 'hpi') ? series.hpiData : series.benchmarkData;
    if (!data || data.length === 0) {
        clearSummaryCards();
        return;
    }

    const isHPI = chartDataType === 'hpi';
    const latest = data[data.length - 1];
    const latestVal = latest.y;
    const latestDate = latest.x;

    // Latest price
    document.getElementById('latestPrice').textContent = isHPI ? latestVal.toFixed(1) : formatCurrency(latestVal);
    document.getElementById('latestDate').textContent = formatMonthYear(latestDate);
    document.getElementById('cardLatest').querySelector('.card-label').textContent =
        isHPI ? 'Latest HPI' : 'Latest Price';

    // 1-year change
    const oneYearAgo = new Date(latestDate);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearPoint = findClosestPoint(data, oneYearAgo);
    if (oneYearPoint) {
        const change = ((latestVal - oneYearPoint.y) / oneYearPoint.y) * 100;
        const el = document.getElementById('change1Y');
        el.textContent = formatPercent(change);
        el.className = 'card-value ' + (change >= 0 ? 'positive' : 'negative');
    } else {
        document.getElementById('change1Y').textContent = 'â€”';
        document.getElementById('change1Y').className = 'card-value';
    }

    // 5-year change
    const fiveYearsAgo = new Date(latestDate);
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const fiveYearPoint = findClosestPoint(data, fiveYearsAgo);
    if (fiveYearPoint) {
        const change = ((latestVal - fiveYearPoint.y) / fiveYearPoint.y) * 100;
        const el = document.getElementById('change5Y');
        el.textContent = formatPercent(change);
        el.className = 'card-value ' + (change >= 0 ? 'positive' : 'negative');
    } else {
        document.getElementById('change5Y').textContent = 'â€”';
        document.getElementById('change5Y').className = 'card-value';
    }

    // All-time high (from full dataset, not filtered)
    const location = locationSelect.value;
    const propType = propertyType.value;
    const fullSeries = getFullSeriesData(location, propType, chartDataType);
    if (fullSeries && fullSeries.length > 0) {
        let maxVal = -Infinity, maxDate = null;
        for (const pt of fullSeries) {
            if (pt.y > maxVal) {
                maxVal = pt.y;
                maxDate = pt.x;
            }
        }
        document.getElementById('allTimeHigh').textContent = isHPI ? maxVal.toFixed(1) : formatCurrency(maxVal);
        document.getElementById('allTimeHighDate').textContent = formatMonthYear(maxDate);
    }

    // Selected range % change
    if (data.length >= 2) {
        const startPt = data[0];
        const endPt = data[data.length - 1];
        const rangeChange = ((endPt.y - startPt.y) / startPt.y) * 100;
        const el = document.getElementById('rangeChange');
        el.textContent = formatPercent(rangeChange);
        el.className = 'card-value ' + (rangeChange >= 0 ? 'positive' : 'negative');
        document.getElementById('rangeChangeLabel').textContent = 'Range Change';
        document.getElementById('rangeChangeSub').textContent =
            `${formatMonthYear(startPt.x)} â†’ ${formatMonthYear(endPt.x)}`;
    } else {
        document.getElementById('rangeChange').textContent = 'â€”';
        document.getElementById('rangeChange').className = 'card-value';
    }
}

function clearSummaryCards() {
    document.getElementById('latestPrice').textContent = 'â€”';
    document.getElementById('latestDate').textContent = 'â€”';
    document.getElementById('change1Y').textContent = 'â€”';
    document.getElementById('change1Y').className = 'card-value';
    document.getElementById('change5Y').textContent = 'â€”';
    document.getElementById('change5Y').className = 'card-value';
    document.getElementById('allTimeHigh').textContent = 'â€”';
    document.getElementById('allTimeHighDate').textContent = 'â€”';
    document.getElementById('rangeChange').textContent = 'â€”';
    document.getElementById('rangeChange').className = 'card-value';
    document.getElementById('rangeChangeSub').textContent = 'From start to end of range';
}

function findClosestPoint(data, targetDate) {
    let closest = null;
    let minDiff = Infinity;
    for (const pt of data) {
        const diff = Math.abs(pt.x.getTime() - targetDate.getTime());
        if (diff < minDiff) {
            minDiff = diff;
            closest = pt;
        }
    }
    // Only return if within ~45 days
    return (minDiff < 45 * 86400000) ? closest : null;
}

function getFullSeriesData(locationName, propType, chartDataType) {
    const meta = LOCATION_MAP[locationName];
    if (!meta || !allData[meta.sheet]) return null;

    const sheet = allData[meta.sheet];
    const colDef = PROPERTY_COLUMNS[propType];
    if (!colDef) return null;

    const colName = (chartDataType === 'hpi') ? colDef.hpi : colDef.benchmark;
    if (!sheet.headers.includes(colName)) return null;

    const result = [];
    for (const row of sheet.rows) {
        const jsDate = excelDateToJS(row.Date);
        if (!jsDate) continue;
        if (row[colName] != null) {
            result.push({ x: jsDate, y: Number(row[colName]) });
        }
    }
    return result;
}

// â•â•â•â•â•â•â•â•â•â•â• YoY / MoM CHANGES CHART â•â•â•â•â•â•â•â•â•â•â•

function computeChangeSeries(data) {
    // data is array of { x: Date, y: number } sorted ascending
    const yoyData = [];
    const momData = [];

    for (let i = 0; i < data.length; i++) {
        const cur = data[i];

        // MoM: compare with previous month
        if (i > 0) {
            const prev = data[i - 1];
            const diffMonths = (cur.x.getFullYear() - prev.x.getFullYear()) * 12
                + (cur.x.getMonth() - prev.x.getMonth());
            if (diffMonths === 1 && prev.y !== 0) {
                momData.push({ x: cur.x, y: ((cur.y - prev.y) / prev.y) * 100 });
            } else {
                momData.push({ x: cur.x, y: null });
            }
        }

        // YoY: compare with same month 12 months ago
        const targetDate = new Date(cur.x);
        targetDate.setFullYear(targetDate.getFullYear() - 1);
        const yrAgo = findClosestPoint(data, targetDate);
        if (yrAgo && yrAgo.y !== 0) {
            yoyData.push({ x: cur.x, y: ((cur.y - yrAgo.y) / yrAgo.y) * 100 });
        } else {
            yoyData.push({ x: cur.x, y: null });
        }
    }

    return { yoyData, momData };
}

function getChartColors() {
    // Read from CSS variables so the chart respects dark/light mode
    const style = getComputedStyle(document.body);
    return {
        grid: style.getPropertyValue('--chart-grid').trim() || 'rgba(255,255,255,0.04)',
        tick: style.getPropertyValue('--chart-tick').trim() || '#8b95b0',
    };
}

function updateChangesChart(locationName, propType, chartDataType) {
    const wrapper = document.getElementById('changesChartWrapper');
    const emptyEl = document.getElementById('changesEmptyState');

    const series = getSeriesData(locationName, propType, chartDataType);
    if (!series) {
        if (changesChart) { changesChart.destroy(); changesChart = null; }
        wrapper.style.display = 'none';
        emptyEl.classList.remove('hidden');
        return;
    }

    const rawData = (chartDataType === 'hpi') ? series.hpiData : series.benchmarkData;
    if (!rawData || rawData.length < 2) {
        if (changesChart) { changesChart.destroy(); changesChart = null; }
        wrapper.style.display = 'none';
        emptyEl.classList.remove('hidden');
        return;
    }

    wrapper.style.display = 'block';
    emptyEl.classList.add('hidden');

    const { yoyData, momData } = computeChangeSeries(rawData);
    const colors = getChartColors();

    if (changesChart) {
        changesChart.destroy();
    }

    const ctx = document.getElementById('changesChart').getContext('2d');
    changesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            datasets: [
                {
                    label: 'MoM Change (%)',
                    data: momData,
                    backgroundColor: momData.map(d =>
                        d && d.y != null
                            ? (d.y >= 0 ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)')
                            : 'transparent'
                    ),
                    borderColor: momData.map(d =>
                        d && d.y != null
                            ? (d.y >= 0 ? 'rgba(16,185,129,0.8)' : 'rgba(244,63,94,0.8)')
                            : 'transparent'
                    ),
                    borderWidth: 1,
                    borderRadius: 2,
                    type: 'bar',
                    yAxisID: 'yMoM',
                    order: 2,
                    spanGaps: false,
                },
                {
                    label: 'YoY Change (%)',
                    data: yoyData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'transparent',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    tension: 0.3,
                    fill: false,
                    type: 'line',
                    yAxisID: 'yYoY',
                    order: 1,
                    spanGaps: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'start',
                    labels: {
                        color: colors.tick,
                        font: { family: 'Inter', size: 12 },
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 16,
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#f0f4fc',
                    bodyColor: '#8b95b0',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    titleFont: { family: 'Inter', weight: '600' },
                    bodyFont: { family: 'Inter' },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        title: function(items) {
                            const d = new Date(items[0].parsed.x);
                            return formatMonthYear(d);
                        },
                        label: function(ctx) {
                            if (ctx.parsed.y == null) return null;
                            const sign = ctx.parsed.y >= 0 ? '+' : '';
                            return `${ctx.dataset.label}: ${sign}${ctx.parsed.y.toFixed(2)}%`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'year', displayFormats: { year: 'yyyy', month: 'MMM yyyy' } },
                    ticks: { color: colors.tick, font: { family: 'Inter', size: 11 }, maxTicksLimit: 12 },
                    grid: { color: colors.grid },
                },
                yMoM: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'MoM (%)', color: '#10b981', font: { family: 'Inter', size: 11, weight: '600' } },
                    ticks: {
                        color: '#10b981',
                        font: { family: 'Inter', size: 11 },
                        callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) + '%',
                    },
                    grid: { color: colors.grid },
                },
                yYoY: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'YoY (%)', color: '#3b82f6', font: { family: 'Inter', size: 11, weight: '600' } },
                    ticks: {
                        color: '#3b82f6',
                        font: { family: 'Inter', size: 11 },
                        callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) + '%',
                    },
                    grid: { drawOnChartArea: false },
                },
            },
            animation: { duration: 500, easing: 'easeOutQuart' },
        },
    });
}

// â•â•â•â•â•â•â•â•â•â•â• PROPERTY TYPE FILTERING â•â•â•â•â•â•â•â•â•â•â•

function updateAvailablePropertyTypes() {
    const location = locationSelect.value;
    if (!location) return;

    const meta = LOCATION_MAP[location];
    if (!meta || !allData[meta.sheet]) return;

    const sheet = allData[meta.sheet];
    const currentVal = propertyType.value;

    // Check which property types have data
    for (const option of propertyType.options) {
        const colDef = PROPERTY_COLUMNS[option.value];
        if (!colDef) continue;
        const hasData = sheet.headers.includes(colDef.hpi) || sheet.headers.includes(colDef.benchmark);
        option.disabled = !hasData;
        option.textContent = option.value.replace(/_/g, ' ') + (hasData ? '' : ' (N/A)');
    }

    // If current selection is disabled, fall back to Composite
    if (propertyType.options[propertyType.selectedIndex]?.disabled) {
        propertyType.value = 'Composite';
    }
}



// â•â•â•â•â•â•â•â•â•â•â• MONTH PICKER LOGIC â•â•â•â•â•â•â•â•â•â•â•

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function setDateValue(target, value) {
    const input = document.getElementById(target);
    input.value = value;
    const label = document.getElementById(target + 'Label');
    if (value) {
        const [y, m] = value.split('-');
        label.textContent = `${MONTH_NAMES_SHORT[parseInt(m) - 1]} ${y}`;
    } else {
        label.textContent = target === 'dateFrom' ? 'From...' : 'To...';
    }
}

function openMonthPicker(target, triggerEl) {
    mpTarget = target;
    const currentVal = document.getElementById(target).value;
    if (currentVal) {
        mpCurrentYear = parseInt(currentVal.split('-')[0]);
    } else {
        mpCurrentYear = new Date().getFullYear();
    }
    renderMonthGrid();

    // Position popup below the trigger
    const rect = triggerEl.getBoundingClientRect();
    monthPickerPopup.style.left = rect.left + 'px';
    monthPickerPopup.style.top = (rect.bottom + 6) + 'px';
    monthPickerPopup.classList.add('open');

    // Mark trigger as active
    document.querySelectorAll('.month-picker-trigger').forEach(t => t.classList.remove('active'));
    triggerEl.classList.add('active');
}

function closeMonthPicker() {
    monthPickerPopup.classList.remove('open');
    document.querySelectorAll('.month-picker-trigger').forEach(t => t.classList.remove('active'));
    mpTarget = null;
}

function renderMonthGrid() {
    mpYear.textContent = mpCurrentYear;
    const currentFromVal = dateFrom.value;
    const currentToVal = dateTo.value;
    const selectedVal = mpTarget ? document.getElementById(mpTarget).value : '';

    const buttons = mpGrid.querySelectorAll('.mp-month');
    buttons.forEach(btn => {
        const monthIdx = parseInt(btn.dataset.month);
        const val = `${mpCurrentYear}-${String(monthIdx + 1).padStart(2, '0')}`;

        // Reset classes
        btn.classList.remove('selected', 'in-range');

        // Highlight selected
        if (val === selectedVal) {
            btn.classList.add('selected');
        }

        // Highlight range
        if (currentFromVal && currentToVal && val > currentFromVal && val < currentToVal) {
            btn.classList.add('in-range');
        }

        // Disable out-of-range months
        if (dataMinDate && dataMaxDate) {
            const minYM = formatYearMonth(dataMinDate);
            const maxYM = formatYearMonth(dataMaxDate);
            btn.disabled = (val < minYM || val > maxYM);
        }
    });
}

// Month picker event handlers
mpPrevYear.addEventListener('click', (e) => {
    e.stopPropagation();
    mpCurrentYear--;
    renderMonthGrid();
});

mpNextYear.addEventListener('click', (e) => {
    e.stopPropagation();
    mpCurrentYear++;
    renderMonthGrid();
});

mpGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.mp-month');
    if (!btn || btn.disabled) return;
    e.stopPropagation();

    const monthIdx = parseInt(btn.dataset.month);
    const val = `${mpCurrentYear}-${String(monthIdx + 1).padStart(2, '0')}`;

    setDateValue(mpTarget, val);
    closeMonthPicker();
    updateChart();
});

dateFromTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (monthPickerPopup.classList.contains('open') && mpTarget === 'dateFrom') {
        closeMonthPicker();
    } else {
        openMonthPicker('dateFrom', dateFromTrigger);
    }
});

dateToTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (monthPickerPopup.classList.contains('open') && mpTarget === 'dateTo') {
        closeMonthPicker();
    } else {
        openMonthPicker('dateTo', dateToTrigger);
    }
});

// Close popup on outside click
document.addEventListener('click', (e) => {
    if (!monthPickerPopup.contains(e.target) && !e.target.closest('.month-picker-trigger')) {
        closeMonthPicker();
    }
});

// Prevent popup clicks from closing
monthPickerPopup.addEventListener('click', (e) => {
    e.stopPropagation();
});

// â•â•â•â•â•â•â•â•â•â•â• QUICK RANGE BUTTONS â•â•â•â•â•â•â•â•â•â•â•

document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const years = parseInt(btn.dataset.years);

        // Update active state
        document.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (!dataMaxDate) return;

        if (years === 0) {
            // All time
            setDateValue('dateFrom', dataMinDate ? formatYearMonth(dataMinDate) : '');
        } else {
            const from = new Date(dataMaxDate);
            from.setFullYear(from.getFullYear() - years);
            setDateValue('dateFrom', formatYearMonth(from));
        }
        setDateValue('dateTo', formatYearMonth(dataMaxDate));
        updateChart();
    });
});


// â•â•â•â•â•â•â•â•â•â•â• EVENT LISTENERS â•â•â•â•â•â•â•â•â•â•â•

// File upload (only if Load Data button exists)
if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        dataStatus.textContent = 'Loading...';
        dataStatus.className = 'data-status';

        try {
            const buffer = await file.arrayBuffer();
            const count = loadWorkbook(buffer);
            dataStatus.textContent = `âœ“ ${count} locations loaded`;
            dataStatus.className = 'data-status loaded';
            populateControls();
            showToast(`Loaded ${count} location datasets from ${file.name}`, 'success');
        } catch (err) {
            console.error(err);
            dataStatus.textContent = 'Error loading file';
            showToast('Error reading file: ' + err.message, 'error');
        }
    });
}

// Location change
locationSelect.addEventListener('change', () => {
    updateAvailablePropertyTypes();
    updateChart();
});

// Other control changes
compareLocation.addEventListener('change', updateChart);
propertyType.addEventListener('change', updateChart);
chartTypeSelect.addEventListener('change', updateChart);


// â”€â”€ Theme toggle â”€â”€
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    // Restore preference
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
    }
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        // Refresh charts so grid/tick colours update
        if (locationSelect.value) {
            updateChart();
        }
    });
}

// Drag & drop support (only active if Load Data button exists)
const fileUploadLabel = document.getElementById('fileUploadLabel');
if (fileUploadLabel) {
    const dropOverlay = document.createElement('div');
    dropOverlay.className = 'drop-overlay';
    dropOverlay.innerHTML = '<div class="drop-box"><p>ðŸ“‚ Drop your CREA HPI .xlsx file here</p><p class="hint">House Price Import.xlsx</p></div>';
    document.body.appendChild(dropOverlay);

    let dragCounter = 0;

    document.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        dropOverlay.classList.add('active');
    });

    document.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) {
            dragCounter = 0;
            dropOverlay.classList.remove('active');
        }
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    document.addEventListener('drop', async (e) => {
        e.preventDefault();
        dragCounter = 0;
        dropOverlay.classList.remove('active');

        const file = e.dataTransfer.files[0];
        if (!file || !file.name.endsWith('.xlsx')) {
            showToast('Please drop an .xlsx file', 'error');
            return;
        }

        dataStatus.textContent = 'Loading...';
        try {
            const buffer = await file.arrayBuffer();
            const count = loadWorkbook(buffer);
            dataStatus.textContent = `âœ“ ${count} locations loaded`;
            dataStatus.className = 'data-status loaded';
            populateControls();
            showToast(`Loaded ${count} location datasets from ${file.name}`, 'success');
        } catch (err) {
            showToast('Error reading file: ' + err.message, 'error');
        }
    });
}

// â•â•â•â•â•â•â•â•â•â•â• AUTO-LOAD â•â•â•â•â•â•â•â•â•â•â•
// Try to load pre-baked data.json first, fall back to xlsx
async function tryAutoLoad() {
    // Try data.json first (deployed/published version)
    try {
        const resp = await fetch('data.json');
        if (resp.ok) {
            const jsonData = await resp.json();
            const count = loadJSON(jsonData);
            dataStatus.textContent = `âœ“ ${count} locations loaded`;
            dataStatus.className = 'data-status loaded';
            populateControls();
            showToast(`Loaded ${count} location datasets`, 'success');

            locationSelect.value = 'Aggregate';
            updateAvailablePropertyTypes();
            updateChart();
            return;
        }
    } catch (e) {
        // data.json not found, try xlsx
    }

    // Fall back to xlsx (local dev with SheetJS loaded)
    if (typeof XLSX !== 'undefined') {
        const filenames = ['House Price Import.xlsx', 'House%20Price%20Import.xlsx'];
        for (const fname of filenames) {
            try {
                const resp = await fetch(fname);
                if (resp.ok) {
                    const buffer = await resp.arrayBuffer();
                    const count = loadWorkbook(buffer);
                    dataStatus.textContent = `âœ“ ${count} locations loaded`;
                    dataStatus.className = 'data-status loaded';
                    populateControls();
                    showToast(`Auto-loaded ${count} location datasets`, 'success');

                    locationSelect.value = 'Aggregate';
                    updateAvailablePropertyTypes();
                    updateChart();
                    return;
                }
            } catch (e) {
                // File not available
            }
        }
    }
}

// Auto-load on page ready
tryAutoLoad();


