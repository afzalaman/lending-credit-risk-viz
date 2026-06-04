# 🏦 LendingClub Credit Risk Visualization

**Interactive Tableau dashboard exploring credit risk patterns in LendingClub loan data (10,000 loans, 2012–2018).**

> Course project by Hasudin Hodžić, Kurato Torikai, and Afzal Ali.

---

## 📋 Project Overview

This project investigates what drives LendingClub's loan grading system (A–G) by analyzing borrower financial profiles, credit history, and loan characteristics. The core question:

> *What patterns in borrower behavior and financial health separate a grade-A loan from a grade-D one?*

### Key Findings (from EDA)
- Grades B and C make up ~59% of all loans; F and G together are only ~2.4%
- Interest rate scales almost linearly with grade: A averages 7.1%, G averages 28.5%
- FICO scores, DTI ratio, and revolving utilization are the strongest grade separators
- Zero missing values across 92 columns — dataset is very clean

---

## 📁 Project Structure

```
lending-credit-risk-viz/
│
├── README.md
│
├── data/
│   ├── raw/                           ← Original dataset files
│   │   ├── loan-10k.lrn.csv          (10,000 rows × 92 cols, with grade labels)
│   │   ├── loan-10k.tes.csv          (10,000 rows, no labels)
│   │   └── loan-10k.sol.ex.csv       (solution format example)
│   └── processed/
│       └── loan_cleaned.csv           ← Cleaned & enriched (10,000 rows × 38 cols)
│
├── scripts/
│   ├── eda.py                         ← Exploratory Data Analysis
│   └── preprocess.py                  ← Data cleaning & feature engineering
│
├── index.html                         ← D3.js dashboard (entry point)
├── dashboard/
│   ├── index.css                      ← Dashboard styles (dark theme)
│   └── app.js                         ← D3.js visualization logic (8 charts)
│
└── docs/
    └── Loan_Project_Proposal_Group4.pdf
```

---

## 🚀 Setup & Run

### Prerequisites

- **Python 3.8+** with `pandas` and `numpy`
- **Tableau Public** (free) — [Download here](https://public.tableau.com/en-us/s/download)

### Install Python Dependencies

```bash
pip install pandas numpy
```

### Step 1: Run Exploratory Data Analysis

```bash
cd scripts
python3 eda.py
```

This prints a comprehensive summary to the console:
- Dataset shape & column types
- Grade distribution with visual bars
- Summary statistics for key numerical features
- Missing value analysis
- Outlier detection (IQR method)
- Grade vs. key financial features breakdown

### Step 2: Run Data Preprocessing

```bash
cd scripts
python3 preprocess.py
```

This reads `data/raw/loan-10k.lrn.csv` and outputs `data/processed/loan_cleaned.csv` with:
- **33 selected columns** from the original 92 (focused on visualization-relevant features)
- **5 derived features**: `term_months`, `emp_length_num`, `credit_age`, `grade_numeric`, `fico_score`
- **Capped outliers**: `annual_inc` ≤ $300K, `dti` ≤ 50, `revol_bal` ≤ $100K
- **Cleaned categories**: rare `home_ownership` values merged, `emp_length` converted to numeric

### Step 3: Load into Tableau Public

1. Open **Tableau Public**
2. Connect to **Text file** → select `data/processed/loan_cleaned.csv`
3. Build dashboard sheets (see Tableau Dashboard Design below)

### Step 4: Run D3.js Interactive Dashboard (Alternative)

In addition to Tableau, there is a fully interactive D3.js web dashboard:

```bash
# From the project root directory:
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

**Features:**
- 8 linked interactive charts (grade distribution, box plots, scatter, choropleth, temporal, purpose, home ownership)
- Click-to-filter: click any bar, state, or year to cross-filter all charts
- Grade toggle buttons to show/hide specific grades
- Rich tooltips on hover
- Dark glassmorphism design

---

## 📊 Tableau Dashboard Design

The dashboard consists of linked interactive views:

| Sheet | Chart Type | Key Fields |
|-------|-----------|------------|
| Grade Distribution | Bar chart | `grade`, COUNT |
| Interest Rate by Grade | Box plot | `grade`, `int_rate` |
| DTI vs. FICO Score | Scatter plot | `dti`, `fico_score`, `grade` (color) |
| Revolving Utilization | Box plot | `grade`, `revol_util` |
| US State Choropleth | Map | `addr_state`, AVG(`grade_numeric`) |
| Temporal Trends | Stacked bar | `issue_d_year`, `grade` |
| Parallel Coordinates | Line chart | Multiple axes colored by `grade` |
| Loan Purpose | Bar chart | `purpose`, `grade` |
| Home Ownership | Bar chart | `home_ownership`, `grade` |

All charts are configured as dashboard filters for **cross-filtering** across views.

---

## 📊 Key Columns Reference

| Column | Type | Description |
|--------|------|-------------|
| `grade` | A–G | LendingClub risk grade (target variable) |
| `grade_numeric` | 1–7 | Numeric grade for ordering/coloring |
| `int_rate` | % | Interest rate assigned to the loan |
| `dti` | ratio | Debt-to-income ratio |
| `fico_score` | score | FICO credit score (midpoint of range) |
| `revol_util` | % | Revolving credit utilization |
| `annual_inc` | $ | Borrower's annual income (capped at $300K) |
| `loan_amnt` | $ | Requested loan amount |
| `credit_age` | years | Years since earliest credit line |
| `purpose` | category | Reason for the loan |
| `addr_state` | state | Borrower's US state |
| `issue_d_year` | year | Year the loan was issued (2012–2018) |
| `home_ownership` | category | MORTGAGE / RENT / OWN / OTHER |
| `emp_length_num` | 0–10 | Employment length in years |

---

## 👥 Team

| Name | Student ID |
|------|-----------|
| Hasudin Hodžić | 01363560 |
| Kurato Torikai | 12343007 |
| Afzal Ali | 12537808 |
