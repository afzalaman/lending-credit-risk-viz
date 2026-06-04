/**
 * LendingClub Credit Risk Dashboard — D3.js Application
 * ======================================================
 * Interactive linked visualizations for exploring loan grade patterns.
 */

// ── Grade Configuration ─────────────────────────────────────────
const GRADES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const GRADE_COLORS = {
    A: '#34d399', B: '#60a5fa', C: '#a78bfa',
    D: '#fbbf24', E: '#fb923c', F: '#f87171', G: '#ef4444'
};
const GRADE_RGB = {
    A: '52,211,153', B: '96,165,250', C: '167,139,250',
    D: '251,191,36', E: '251,146,60', F: '248,113,113', G: '239,68,68'
};

// ── Global State ────────────────────────────────────────────────
let allData = [];
let filteredData = [];
let activeGrades = new Set(GRADES);
let selectedState = null;
let selectedPurpose = null;
let selectedYear = null;

// ── Tooltip ─────────────────────────────────────────────────────
const tooltip = d3.select('#tooltip');

function showTooltip(evt, html) {
    tooltip.html(html).classed('visible', true);
    const tt = tooltip.node();
    const ttRect = tt.getBoundingClientRect();
    let x = evt.clientX + 14;
    let y = evt.clientY - 10;
    if (x + ttRect.width > window.innerWidth - 10) x = evt.clientX - ttRect.width - 14;
    if (y + ttRect.height > window.innerHeight - 10) y = evt.clientY - ttRect.height - 10;
    if (y < 10) y = 10;
    tooltip.style('left', x + 'px').style('top', y + 'px');
}

function hideTooltip() {
    tooltip.classed('visible', false);
}

// ── Formatting Helpers ──────────────────────────────────────────
const fmt = {
    count: d3.format(','),
    pct: d3.format('.1%'),
    pct0: d3.format('.0%'),
    rate: d3.format('.2f'),
    dollar: d3.format('$,.0f'),
    score: d3.format('.0f'),
    ratio: d3.format('.1f'),
};

// ── Data Loading ────────────────────────────────────────────────
async function loadData() {
    allData = await d3.csv('loan_cleaned.csv', d => ({
        id: +d.ID,
        loanAmnt: +d.loan_amnt,
        term: d.term,
        termMonths: +d.term_months,
        intRate: +d.int_rate,
        installment: +d.installment,
        empLength: d.emp_length,
        empLengthNum: +d.emp_length_num,
        homeOwnership: d.home_ownership,
        annualInc: +d.annual_inc,
        verificationStatus: d.verification_status,
        loanStatus: d.loan_status,
        purpose: d.purpose,
        state: d.addr_state,
        dti: +d.dti,
        ficoLow: +d.fico_range_low,
        ficoHigh: +d.fico_range_high,
        ficoScore: +d.fico_score,
        revolUtil: +d.revol_util,
        revolBal: +d.revol_bal,
        totalAcc: +d.total_acc,
        openAcc: +d.open_acc,
        pubRec: +d.pub_rec,
        delinq2yrs: +d.delinq_2yrs,
        mortAcc: +d.mort_acc,
        creditAge: +d.credit_age,
        grade: d.grade,
        gradeNum: +d.grade_numeric,
        issueYear: +d.issue_d_year,
    }));

    filteredData = [...allData];
    updateStats();
    initGradeButtons();
    renderAll();
}

// ── Filter Logic ────────────────────────────────────────────────
function applyFilters() {
    filteredData = allData.filter(d => {
        if (!activeGrades.has(d.grade)) return false;
        if (selectedState && d.state !== selectedState) return false;
        if (selectedPurpose && d.purpose !== selectedPurpose) return false;
        if (selectedYear && d.issueYear !== selectedYear) return false;
        return true;
    });
    updateStats();
    renderAll();
}

function resetFilters() {
    activeGrades = new Set(GRADES);
    selectedState = null;
    selectedPurpose = null;
    selectedYear = null;
    document.querySelectorAll('.grade-btn').forEach(b => {
        b.classList.add('active');
        b.classList.remove('inactive');
    });
    applyFilters();
}

function updateStats() {
    d3.select('#stat-total-loans .stat-value').text(fmt.count(allData.length));
    d3.select('#stat-filtered .stat-value').text(fmt.count(filteredData.length));
}

// ── Grade Filter Buttons ────────────────────────────────────────
function initGradeButtons() {
    const container = d3.select('#grade-buttons');
    GRADES.forEach(g => {
        const btn = container.append('button')
            .attr('class', 'grade-btn active')
            .attr('data-grade', g)
            .style('background', GRADE_COLORS[g] + '22')
            .style('border-color', GRADE_COLORS[g])
            .style('color', GRADE_COLORS[g])
            .style('--btn-rgb', GRADE_RGB[g])
            .text(g)
            .on('click', () => toggleGrade(g));
    });
}

function toggleGrade(grade) {
    if (activeGrades.has(grade)) {
        if (activeGrades.size === 1) return; // Don't deselect last one
        activeGrades.delete(grade);
    } else {
        activeGrades.add(grade);
    }
    document.querySelectorAll('.grade-btn').forEach(b => {
        const g = b.dataset.grade;
        b.classList.toggle('active', activeGrades.has(g));
        b.classList.toggle('inactive', !activeGrades.has(g));
    });
    applyFilters();
}

// ── Render All Charts ───────────────────────────────────────────
function renderAll() {
    renderGradeDist();
    renderIntRateBox();
    renderScatter();
    renderRevolUtil();
    renderMap();
    renderTemporal();
    renderPurpose();
    renderHomeOwnership();
}

// ── Utility: get chart dimensions from container ────────────────
function getDims(containerId, margin) {
    const el = document.getElementById(containerId);
    const rect = el.getBoundingClientRect();
    const w = rect.width || 400;
    const h = rect.height || 280;
    return {
        width: w, height: h,
        innerW: w - margin.left - margin.right,
        innerH: h - margin.top - margin.bottom,
        margin
    };
}

// ══════════════════════════════════════════════════════════════════
//  CHART 1: Grade Distribution Bar Chart
// ══════════════════════════════════════════════════════════════════
function renderGradeDist() {
    const margin = { top: 16, right: 16, bottom: 34, left: 48 };
    const dim = getDims('chart-grade-dist', margin);
    const container = d3.select('#chart-grade-dist');
    container.selectAll('*').remove();

    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${dim.width} ${dim.height}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Count by grade
    const counts = GRADES.map(g => ({
        grade: g,
        count: filteredData.filter(d => d.grade === g).length
    }));

    const x = d3.scaleBand()
        .domain(GRADES)
        .range([0, dim.innerW])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, d3.max(counts, d => d.count) * 1.12])
        .nice()
        .range([dim.innerH, 0]);

    // Grid lines
    svg.append('g')
        .selectAll('line')
        .data(y.ticks(5))
        .join('line')
        .attr('class', 'grid-line')
        .attr('x1', 0).attr('x2', dim.innerW)
        .attr('y1', d => y(d)).attr('y2', d => y(d));

    // Axes
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${dim.innerH})`)
        .call(d3.axisBottom(x).tickSize(0))
        .select('.domain').remove();

    svg.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(',')))
        .select('.domain').remove();

    // Bars
    svg.selectAll('.bar-rect')
        .data(counts)
        .join('rect')
        .attr('class', 'bar-rect')
        .attr('x', d => x(d.grade))
        .attr('y', d => y(d.count))
        .attr('width', x.bandwidth())
        .attr('height', d => dim.innerH - y(d.count))
        .attr('fill', d => GRADE_COLORS[d.grade])
        .attr('opacity', 0.85)
        .on('mouseover', (evt, d) => {
            const pct = d.count / filteredData.length;
            showTooltip(evt, `
                <div class="tt-title">Grade ${d.grade}</div>
                <div class="tt-row"><span class="tt-label">Count</span><span class="tt-value">${fmt.count(d.count)}</span></div>
                <div class="tt-row"><span class="tt-label">Share</span><span class="tt-value">${fmt.pct(pct)}</span></div>
            `);
        })
        .on('mousemove', (evt) => showTooltip(evt, tooltip.html()))
        .on('mouseout', hideTooltip);

    // Bar labels
    svg.selectAll('.bar-label')
        .data(counts)
        .join('text')
        .attr('class', 'bar-label')
        .attr('x', d => x(d.grade) + x.bandwidth() / 2)
        .attr('y', d => y(d.count) - 6)
        .text(d => d.count > 0 ? fmt.count(d.count) : '');
}

// ══════════════════════════════════════════════════════════════════
//  CHART 2: Interest Rate Box Plot by Grade
// ══════════════════════════════════════════════════════════════════
function renderIntRateBox() {
    const margin = { top: 16, right: 16, bottom: 34, left: 48 };
    const dim = getDims('chart-int-rate', margin);
    const container = d3.select('#chart-int-rate');
    container.selectAll('*').remove();

    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${dim.width} ${dim.height}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(GRADES.filter(g => activeGrades.has(g)))
        .range([0, dim.innerW])
        .padding(0.35);

    const allRates = filteredData.map(d => d.intRate);
    const y = d3.scaleLinear()
        .domain([d3.min(allRates) - 1, d3.max(allRates) + 1])
        .nice()
        .range([dim.innerH, 0]);

    // Grid
    svg.append('g').selectAll('line').data(y.ticks(6)).join('line')
        .attr('class', 'grid-line')
        .attr('x1', 0).attr('x2', dim.innerW)
        .attr('y1', d => y(d)).attr('y2', d => y(d));

    // Axes
    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${dim.innerH})`)
        .call(d3.axisBottom(x).tickSize(0))
        .select('.domain').remove();

    svg.append('g').attr('class', 'axis')
        .call(d3.axisLeft(y).ticks(6).tickFormat(d => d + '%'))
        .select('.domain').remove();

    // Compute box stats per grade
    GRADES.filter(g => activeGrades.has(g)).forEach(grade => {
        const vals = filteredData.filter(d => d.grade === grade).map(d => d.intRate).sort(d3.ascending);
        if (vals.length === 0) return;
        const q1 = d3.quantile(vals, 0.25);
        const median = d3.quantile(vals, 0.5);
        const q3 = d3.quantile(vals, 0.75);
        const iqr = q3 - q1;
        const whiskerLo = Math.max(d3.min(vals), q1 - 1.5 * iqr);
        const whiskerHi = Math.min(d3.max(vals), q3 + 1.5 * iqr);
        const color = GRADE_COLORS[grade];
        const cx = x(grade) + x.bandwidth() / 2;
        const bw = x.bandwidth();

        const g = svg.append('g').attr('class', 'box-group');

        // Whiskers
        g.append('line').attr('class', 'whisker-line')
            .attr('x1', cx).attr('x2', cx)
            .attr('y1', y(whiskerLo)).attr('y2', y(whiskerHi))
            .attr('stroke', color).attr('opacity', 0.5);

        // Whisker caps
        [whiskerLo, whiskerHi].forEach(w => {
            g.append('line')
                .attr('x1', cx - bw * 0.25).attr('x2', cx + bw * 0.25)
                .attr('y1', y(w)).attr('y2', y(w))
                .attr('stroke', color).attr('stroke-width', 1.5).attr('opacity', 0.6);
        });

        // Box
        g.append('rect').attr('class', 'box-rect')
            .attr('x', x(grade) + 2)
            .attr('y', y(q3))
            .attr('width', bw - 4)
            .attr('height', y(q1) - y(q3))
            .attr('fill', color + '20')
            .attr('stroke', color);

        // Median
        g.append('line').attr('class', 'median-line')
            .attr('x1', x(grade) + 2).attr('x2', x(grade) + bw - 2)
            .attr('y1', y(median)).attr('y2', y(median))
            .attr('stroke', color);

        // Tooltip zone
        g.append('rect')
            .attr('x', x(grade)).attr('y', 0)
            .attr('width', bw).attr('height', dim.innerH)
            .attr('fill', 'transparent')
            .on('mouseover', (evt) => showTooltip(evt, `
                <div class="tt-title">Grade ${grade} — Interest Rate</div>
                <div class="tt-row"><span class="tt-label">Median</span><span class="tt-value">${fmt.rate(median)}%</span></div>
                <div class="tt-row"><span class="tt-label">Q1–Q3</span><span class="tt-value">${fmt.rate(q1)}–${fmt.rate(q3)}%</span></div>
                <div class="tt-row"><span class="tt-label">Range</span><span class="tt-value">${fmt.rate(whiskerLo)}–${fmt.rate(whiskerHi)}%</span></div>
                <div class="tt-row"><span class="tt-label">Count</span><span class="tt-value">${fmt.count(vals.length)}</span></div>
            `))
            .on('mousemove', (evt) => showTooltip(evt, tooltip.html()))
            .on('mouseout', hideTooltip);
    });
}

// ══════════════════════════════════════════════════════════════════
//  CHART 3: FICO vs DTI Scatter Plot
// ══════════════════════════════════════════════════════════════════
function renderScatter() {
    const margin = { top: 16, right: 20, bottom: 40, left: 54 };
    const dim = getDims('chart-scatter', margin);
    const container = d3.select('#chart-scatter');
    container.selectAll('*').remove();

    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${dim.width} ${dim.height}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([d3.min(filteredData, d => d.dti) - 1, d3.max(filteredData, d => d.dti) + 1])
        .nice()
        .range([0, dim.innerW]);

    const y = d3.scaleLinear()
        .domain([d3.min(filteredData, d => d.ficoScore) - 5, d3.max(filteredData, d => d.ficoScore) + 5])
        .nice()
        .range([dim.innerH, 0]);

    // Grid
    svg.append('g').selectAll('line').data(x.ticks(8)).join('line')
        .attr('class', 'grid-line')
        .attr('x1', d => x(d)).attr('x2', d => x(d))
        .attr('y1', 0).attr('y2', dim.innerH);

    svg.append('g').selectAll('line').data(y.ticks(6)).join('line')
        .attr('class', 'grid-line')
        .attr('x1', 0).attr('x2', dim.innerW)
        .attr('y1', d => y(d)).attr('y2', d => y(d));

    // Axes
    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${dim.innerH})`)
        .call(d3.axisBottom(x).ticks(8));

    svg.append('g').attr('class', 'axis')
        .call(d3.axisLeft(y).ticks(6));

    // Axis labels
    svg.append('text')
        .attr('x', dim.innerW / 2).attr('y', dim.innerH + 34)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-muted)').attr('font-size', '0.72rem')
        .text('Debt-to-Income Ratio');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -dim.innerH / 2).attr('y', -40)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-muted)').attr('font-size', '0.72rem')
        .text('FICO Score');

    // Subsample for performance if > 3000 points
    let plotData = filteredData;
    if (plotData.length > 3000) {
        plotData = d3.shuffle([...plotData]).slice(0, 3000);
    }

    // Dots — render lower grades first so higher risk grades are on top
    const sorted = [...plotData].sort((a, b) => a.gradeNum - b.gradeNum);
    svg.selectAll('.scatter-dot')
        .data(sorted)
        .join('circle')
        .attr('class', 'scatter-dot')
        .attr('cx', d => x(d.dti))
        .attr('cy', d => y(d.ficoScore))
        .attr('r', 2.5)
        .attr('fill', d => GRADE_COLORS[d.grade])
        .attr('opacity', 0.5)
        .on('mouseover', (evt, d) => showTooltip(evt, `
            <div class="tt-title">Grade ${d.grade} — Loan #${d.id}</div>
            <div class="tt-row"><span class="tt-label">FICO</span><span class="tt-value">${fmt.score(d.ficoScore)}</span></div>
            <div class="tt-row"><span class="tt-label">DTI</span><span class="tt-value">${fmt.ratio(d.dti)}</span></div>
            <div class="tt-row"><span class="tt-label">Rate</span><span class="tt-value">${fmt.rate(d.intRate)}%</span></div>
            <div class="tt-row"><span class="tt-label">Income</span><span class="tt-value">${fmt.dollar(d.annualInc)}</span></div>
            <div class="tt-row"><span class="tt-label">Amount</span><span class="tt-value">${fmt.dollar(d.loanAmnt)}</span></div>
        `))
        .on('mousemove', (evt) => showTooltip(evt, tooltip.html()))
        .on('mouseout', hideTooltip);
}

// ══════════════════════════════════════════════════════════════════
//  CHART 4: Revolving Utilization by Grade
// ══════════════════════════════════════════════════════════════════
function renderRevolUtil() {
    const margin = { top: 16, right: 16, bottom: 34, left: 48 };
    const dim = getDims('chart-revol', margin);
    const container = d3.select('#chart-revol');
    container.selectAll('*').remove();

    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${dim.width} ${dim.height}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const activeG = GRADES.filter(g => activeGrades.has(g));

    const x = d3.scaleBand().domain(activeG).range([0, dim.innerW]).padding(0.35);
    const y = d3.scaleLinear().domain([0, 130]).nice().range([dim.innerH, 0]);

    svg.append('g').selectAll('line').data(y.ticks(5)).join('line')
        .attr('class', 'grid-line')
        .attr('x1', 0).attr('x2', dim.innerW)
        .attr('y1', d => y(d)).attr('y2', d => y(d));

    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${dim.innerH})`)
        .call(d3.axisBottom(x).tickSize(0))
        .select('.domain').remove();

    svg.append('g').attr('class', 'axis')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + '%'))
        .select('.domain').remove();

    activeG.forEach(grade => {
        const vals = filteredData.filter(d => d.grade === grade).map(d => d.revolUtil).sort(d3.ascending);
        if (vals.length === 0) return;
        const q1 = d3.quantile(vals, 0.25);
        const median = d3.quantile(vals, 0.5);
        const q3 = d3.quantile(vals, 0.75);
        const iqr = q3 - q1;
        const wLo = Math.max(d3.min(vals), q1 - 1.5 * iqr);
        const wHi = Math.min(d3.max(vals), q3 + 1.5 * iqr);
        const color = GRADE_COLORS[grade];
        const cx = x(grade) + x.bandwidth() / 2;
        const bw = x.bandwidth();

        const g = svg.append('g').attr('class', 'box-group');
        g.append('line').attr('x1', cx).attr('x2', cx)
            .attr('y1', y(wLo)).attr('y2', y(wHi))
            .attr('stroke', color).attr('opacity', 0.5).attr('stroke-width', 1.5);
        [wLo, wHi].forEach(w => {
            g.append('line')
                .attr('x1', cx - bw * 0.25).attr('x2', cx + bw * 0.25)
                .attr('y1', y(w)).attr('y2', y(w))
                .attr('stroke', color).attr('stroke-width', 1.5).attr('opacity', 0.6);
        });
        g.append('rect')
            .attr('x', x(grade) + 2).attr('y', y(q3))
            .attr('width', bw - 4).attr('height', y(q1) - y(q3))
            .attr('fill', color + '20').attr('stroke', color)
            .attr('stroke-width', 1.5).attr('rx', 4);
        g.append('line')
            .attr('x1', x(grade) + 2).attr('x2', x(grade) + bw - 2)
            .attr('y1', y(median)).attr('y2', y(median))
            .attr('stroke', color).attr('stroke-width', 2);

        g.append('rect')
            .attr('x', x(grade)).attr('y', 0)
            .attr('width', bw).attr('height', dim.innerH)
            .attr('fill', 'transparent')
            .on('mouseover', (evt) => showTooltip(evt, `
                <div class="tt-title">Grade ${grade} — Revolving Util.</div>
                <div class="tt-row"><span class="tt-label">Median</span><span class="tt-value">${fmt.ratio(median)}%</span></div>
                <div class="tt-row"><span class="tt-label">Q1–Q3</span><span class="tt-value">${fmt.ratio(q1)}–${fmt.ratio(q3)}%</span></div>
                <div class="tt-row"><span class="tt-label">Count</span><span class="tt-value">${fmt.count(vals.length)}</span></div>
            `))
            .on('mousemove', (evt) => showTooltip(evt, tooltip.html()))
            .on('mouseout', hideTooltip);
    });
}

// ══════════════════════════════════════════════════════════════════
//  CHART 5: US Choropleth Map
// ══════════════════════════════════════════════════════════════════
let usTopoCache = null;

async function renderMap() {
    const margin = { top: 8, right: 8, bottom: 8, left: 8 };
    const dim = getDims('chart-map', margin);
    const container = d3.select('#chart-map');
    container.selectAll('*').remove();

    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${dim.width} ${dim.height}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Load TopoJSON once
    if (!usTopoCache) {
        try {
            usTopoCache = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
        } catch {
            svg.append('text')
                .attr('x', dim.innerW / 2).attr('y', dim.innerH / 2)
                .attr('text-anchor', 'middle')
                .attr('fill', 'var(--text-muted)')
                .text('Map data unavailable (requires internet)');
            return;
        }
    }

    const states = topojson.feature(usTopoCache, usTopoCache.objects.states);

    // Compute avg grade numeric per state from filtered data
    const stateStats = d3.rollup(filteredData,
        v => ({
            avgGrade: d3.mean(v, d => d.gradeNum),
            count: v.length,
            avgRate: d3.mean(v, d => d.intRate),
            avgFico: d3.mean(v, d => d.ficoScore),
        }),
        d => d.state
    );

    // FIPS to state abbrev mapping
    const fipsToAbbr = {
        '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT',
        '10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL',
        '18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD',
        '25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE',
        '32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND',
        '39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD',
        '47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
        '55':'WI','56':'WY'
    };

    const colorScale = d3.scaleSequential()
        .domain([1.5, 4.5])
        .interpolator(d3.interpolateRgbBasis([GRADE_COLORS.A, GRADE_COLORS.C, GRADE_COLORS.E, GRADE_COLORS.G]));

    const projection = d3.geoAlbersUsa()
        .fitSize([dim.innerW, dim.innerH - 20], states);
    const path = d3.geoPath().projection(projection);

    svg.selectAll('.state-path')
        .data(states.features)
        .join('path')
        .attr('class', d => {
            const abbr = fipsToAbbr[String(d.id).padStart(2, '0')];
            return `state-path ${selectedState === abbr ? 'selected' : ''}`;
        })
        .attr('d', path)
        .attr('fill', d => {
            const abbr = fipsToAbbr[String(d.id).padStart(2, '0')];
            const stat = stateStats.get(abbr);
            if (!stat) return 'var(--bg-elevated)';
            return colorScale(stat.avgGrade);
        })
        .on('mouseover', (evt, d) => {
            const abbr = fipsToAbbr[String(d.id).padStart(2, '0')];
            const stat = stateStats.get(abbr);
            if (!stat) return;
            const gradeLabel = GRADES[Math.round(stat.avgGrade) - 1] || '?';
            showTooltip(evt, `
                <div class="tt-title">${d.properties.name} (${abbr})</div>
                <div class="tt-row"><span class="tt-label">Loans</span><span class="tt-value">${fmt.count(stat.count)}</span></div>
                <div class="tt-row"><span class="tt-label">Avg Grade</span><span class="tt-value">${fmt.ratio(stat.avgGrade)} (${gradeLabel})</span></div>
                <div class="tt-row"><span class="tt-label">Avg Rate</span><span class="tt-value">${fmt.rate(stat.avgRate)}%</span></div>
                <div class="tt-row"><span class="tt-label">Avg FICO</span><span class="tt-value">${fmt.score(stat.avgFico)}</span></div>
            `);
        })
        .on('mousemove', (evt) => showTooltip(evt, tooltip.html()))
        .on('mouseout', hideTooltip)
        .on('click', (evt, d) => {
            const abbr = fipsToAbbr[String(d.id).padStart(2, '0')];
            if (!abbr) return;
            selectedState = selectedState === abbr ? null : abbr;
            applyFilters();
        });

    // Legend
    const legendW = 160;
    const legendH = 10;
    const legendG = svg.append('g')
        .attr('transform', `translate(${dim.innerW - legendW - 10}, ${dim.innerH - 24})`);

    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id', 'map-legend-grad');
    [0, 0.33, 0.66, 1].forEach(t => {
        grad.append('stop')
            .attr('offset', `${t * 100}%`)
            .attr('stop-color', colorScale(1.5 + t * 3));
    });

    legendG.append('rect')
        .attr('width', legendW).attr('height', legendH)
        .attr('rx', 3)
        .attr('fill', 'url(#map-legend-grad)');

    legendG.append('text').attr('x', 0).attr('y', -4)
        .attr('fill', 'var(--text-muted)').attr('font-size', '0.6rem')
        .text('Low Risk (A)');
    legendG.append('text').attr('x', legendW).attr('y', -4)
        .attr('text-anchor', 'end')
        .attr('fill', 'var(--text-muted)').attr('font-size', '0.6rem')
        .text('High Risk (G)');
}

// ══════════════════════════════════════════════════════════════════
//  CHART 6: Temporal Trends (Stacked Bar)
// ══════════════════════════════════════════════════════════════════
function renderTemporal() {
    const margin = { top: 16, right: 16, bottom: 34, left: 48 };
    const dim = getDims('chart-temporal', margin);
    const container = d3.select('#chart-temporal');
    container.selectAll('*').remove();

    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${dim.width} ${dim.height}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Group by year and grade
    const years = Array.from(new Set(filteredData.map(d => d.issueYear))).sort();
    const stackData = years.map(yr => {
        const row = { year: yr };
        GRADES.forEach(g => {
            row[g] = filteredData.filter(d => d.issueYear === yr && d.grade === g).length;
        });
        return row;
    });

    const stack = d3.stack().keys(GRADES)(stackData);

    const x = d3.scaleBand().domain(years).range([0, dim.innerW]).padding(0.25);
    const y = d3.scaleLinear()
        .domain([0, d3.max(stackData, d => GRADES.reduce((s, g) => s + d[g], 0)) * 1.05])
        .nice()
        .range([dim.innerH, 0]);

    svg.append('g').selectAll('line').data(y.ticks(5)).join('line')
        .attr('class', 'grid-line')
        .attr('x1', 0).attr('x2', dim.innerW)
        .attr('y1', d => y(d)).attr('y2', d => y(d));

    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${dim.innerH})`)
        .call(d3.axisBottom(x).tickSize(0))
        .select('.domain').remove();

    svg.append('g').attr('class', 'axis')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(',')))
        .select('.domain').remove();

    // Stacked bars
    svg.selectAll('g.stack-layer')
        .data(stack)
        .join('g')
        .attr('class', 'stack-layer')
        .attr('fill', d => GRADE_COLORS[d.key])
        .selectAll('rect')
        .data(d => d.map(dd => ({ ...dd, grade: d.key })))
        .join('rect')
        .attr('class', 'stacked-rect')
        .attr('x', d => x(d.data.year))
        .attr('y', d => y(d[1]))
        .attr('height', d => y(d[0]) - y(d[1]))
        .attr('width', x.bandwidth())
        .attr('rx', 2)
        .attr('opacity', 0.85)
        .on('mouseover', (evt, d) => {
            const count = d[1] - d[0];
            const total = GRADES.reduce((s, g) => s + d.data[g], 0);
            showTooltip(evt, `
                <div class="tt-title">${d.data.year} — Grade ${d.grade}</div>
                <div class="tt-row"><span class="tt-label">Count</span><span class="tt-value">${fmt.count(count)}</span></div>
                <div class="tt-row"><span class="tt-label">Year Total</span><span class="tt-value">${fmt.count(total)}</span></div>
                <div class="tt-row"><span class="tt-label">Share</span><span class="tt-value">${fmt.pct(count / total)}</span></div>
            `);
        })
        .on('mousemove', (evt) => showTooltip(evt, tooltip.html()))
        .on('mouseout', hideTooltip)
        .on('click', (evt, d) => {
            selectedYear = selectedYear === d.data.year ? null : d.data.year;
            applyFilters();
        });
}

// ══════════════════════════════════════════════════════════════════
//  CHART 7: Loan Purpose (Grouped Bars)
// ══════════════════════════════════════════════════════════════════
function renderPurpose() {
    const margin = { top: 16, right: 16, bottom: 82, left: 48 };
    const dim = getDims('chart-purpose', margin);
    const container = d3.select('#chart-purpose');
    container.selectAll('*').remove();

    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${dim.width} ${dim.height}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Top purposes
    const purposeCounts = d3.rollup(filteredData, v => v.length, d => d.purpose);
    const topPurposes = Array.from(purposeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(d => d[0]);

    // For each purpose, compute grade distribution
    const data = topPurposes.map(p => {
        const rows = filteredData.filter(d => d.purpose === p);
        const obj = { purpose: p, total: rows.length };
        GRADES.forEach(g => obj[g] = rows.filter(d => d.grade === g).length);
        return obj;
    });

    const stack = d3.stack().keys(GRADES)(data);

    const x = d3.scaleBand().domain(topPurposes).range([0, dim.innerW]).padding(0.25);
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total) * 1.05])
        .nice()
        .range([dim.innerH, 0]);

    svg.append('g').selectAll('line').data(y.ticks(5)).join('line')
        .attr('class', 'grid-line')
        .attr('x1', 0).attr('x2', dim.innerW)
        .attr('y1', d => y(d)).attr('y2', d => y(d));

    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${dim.innerH})`)
        .call(d3.axisBottom(x).tickSize(0))
        .selectAll('text')
        .attr('transform', 'rotate(-35)')
        .style('text-anchor', 'end')
        .attr('dx', '-0.5em')
        .attr('dy', '0.3em');

    svg.append('g').attr('class', 'axis')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(',')))
        .select('.domain').remove();

    svg.selectAll('g.purpose-layer')
        .data(stack)
        .join('g')
        .attr('fill', d => GRADE_COLORS[d.key])
        .selectAll('rect')
        .data(d => d.map(dd => ({ ...dd, grade: d.key })))
        .join('rect')
        .attr('class', 'stacked-rect')
        .attr('x', d => x(d.data.purpose))
        .attr('y', d => y(d[1]))
        .attr('height', d => y(d[0]) - y(d[1]))
        .attr('width', x.bandwidth())
        .attr('rx', 2)
        .attr('opacity', 0.85)
        .on('mouseover', (evt, d) => {
            const count = d[1] - d[0];
            showTooltip(evt, `
                <div class="tt-title">${d.data.purpose}</div>
                <div class="tt-row"><span class="tt-label">Grade ${d.grade}</span><span class="tt-value">${fmt.count(count)}</span></div>
                <div class="tt-row"><span class="tt-label">Total</span><span class="tt-value">${fmt.count(d.data.total)}</span></div>
                <div class="tt-row"><span class="tt-label">Share</span><span class="tt-value">${fmt.pct(count / d.data.total)}</span></div>
            `);
        })
        .on('mousemove', (evt) => showTooltip(evt, tooltip.html()))
        .on('mouseout', hideTooltip)
        .on('click', (evt, d) => {
            selectedPurpose = selectedPurpose === d.data.purpose ? null : d.data.purpose;
            applyFilters();
        });
}

// ══════════════════════════════════════════════════════════════════
//  CHART 8: Home Ownership
// ══════════════════════════════════════════════════════════════════
function renderHomeOwnership() {
    const margin = { top: 16, right: 16, bottom: 34, left: 48 };
    const dim = getDims('chart-home', margin);
    const container = d3.select('#chart-home');
    container.selectAll('*').remove();

    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${dim.width} ${dim.height}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const categories = ['MORTGAGE', 'RENT', 'OWN', 'OTHER'];
    const data = categories.map(cat => {
        const rows = filteredData.filter(d => d.homeOwnership === cat);
        const obj = { category: cat, total: rows.length };
        GRADES.forEach(g => obj[g] = rows.filter(d => d.grade === g).length);
        return obj;
    }).filter(d => d.total > 0);

    const stack = d3.stack().keys(GRADES)(data);

    const x = d3.scaleBand().domain(data.map(d => d.category)).range([0, dim.innerW]).padding(0.3);
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total) * 1.05])
        .nice()
        .range([dim.innerH, 0]);

    svg.append('g').selectAll('line').data(y.ticks(5)).join('line')
        .attr('class', 'grid-line')
        .attr('x1', 0).attr('x2', dim.innerW)
        .attr('y1', d => y(d)).attr('y2', d => y(d));

    svg.append('g').attr('class', 'axis')
        .attr('transform', `translate(0,${dim.innerH})`)
        .call(d3.axisBottom(x).tickSize(0))
        .select('.domain').remove();

    svg.append('g').attr('class', 'axis')
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(',')))
        .select('.domain').remove();

    svg.selectAll('g.home-layer')
        .data(stack)
        .join('g')
        .attr('fill', d => GRADE_COLORS[d.key])
        .selectAll('rect')
        .data(d => d.map(dd => ({ ...dd, grade: d.key })))
        .join('rect')
        .attr('class', 'stacked-rect')
        .attr('x', d => x(d.data.category))
        .attr('y', d => y(d[1]))
        .attr('height', d => y(d[0]) - y(d[1]))
        .attr('width', x.bandwidth())
        .attr('rx', 2)
        .attr('opacity', 0.85)
        .on('mouseover', (evt, d) => {
            const count = d[1] - d[0];
            showTooltip(evt, `
                <div class="tt-title">${d.data.category}</div>
                <div class="tt-row"><span class="tt-label">Grade ${d.grade}</span><span class="tt-value">${fmt.count(count)}</span></div>
                <div class="tt-row"><span class="tt-label">Total</span><span class="tt-value">${fmt.count(d.data.total)}</span></div>
                <div class="tt-row"><span class="tt-label">Share</span><span class="tt-value">${fmt.pct(count / d.data.total)}</span></div>
            `);
        })
        .on('mousemove', (evt) => showTooltip(evt, tooltip.html()))
        .on('mouseout', hideTooltip);
}

// ── Event Listeners ─────────────────────────────────────────────
document.getElementById('btn-reset-filters').addEventListener('click', resetFilters);

// Resize handler
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderAll, 200);
});

// ── Initialize ──────────────────────────────────────────────────
loadData();
