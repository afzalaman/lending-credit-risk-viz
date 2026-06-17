# 🎤 Presentation Script — "Who Gets the Best Loan?"
**Total Time: 5 minutes | 8 slides**

---

## Slide 1 — Title *(~15 sec)*

> "Hi everyone, our project is called **'Who Gets the Best Loan?'** We analyzed LendingClub's loan grading system to understand what separates a safe Grade-A borrower from a risky Grade-G one. My name is Afzal, and I worked on this with Hasudin and Kurato."

---

## Slide 2 — Research Question *(~30 sec)*

> "Our **core question** was: *What patterns in borrower behavior and financial health separate loan grades?*
>
> LendingClub is one of the largest peer-to-peer lending platforms in the US. They assign every loan a grade from A to G based on risk — A being the safest, G the riskiest.
>
> We also had a **secondary question**: Are these patterns consistent across different US states, years, and loan purposes — or do they shift?"

---

## Slide 3 — Hypotheses *(~30 sec)*

> "We defined **three hypotheses** before looking at the data:
>
> **H1** — We expected that borrowers with a **higher debt-to-income ratio** and a **lower FICO credit score** would get worse grades. This is the most intuitive one.
>
> **H2** — We thought that loans taken for **small businesses** would tend to get lower grades, because small business is riskier.
>
> **H3** — We hypothesized that **riskier grades D through G grew after 2015**, suggesting that LendingClub loosened their criteria over time."

---

## Slide 4 — Dashboard Screenshot *(~30 sec)*

> "This is our interactive dashboard, built with **D3.js**. It has **8 linked charts** — all cross-filtered. You can see the grade distribution, interest rate box plots, a FICO vs. DTI scatter plot, a US choropleth map, and more.
>
> The dark glassmorphism design was chosen for readability with dense financial data."

> [!TIP]
> Point at specific charts on screen while talking. If possible, have the live dashboard open on localhost:8080 to quickly show a filter interaction.

---

## Slide 5 — Dataset / Preprocessing *(~30 sec)*

> "Our dataset is **10,000 LendingClub loans** from 2012 to 2018, originally with 92 columns. We:
> - **Selected 33 key columns** relevant for visualization
> - **Created 5 derived features**, most importantly `fico_score` (midpoint of the FICO range) and `credit_age`
> - **Capped outliers** — for example, annual income was capped at $300K to prevent extreme values from distorting charts
> - **Cleaned categories** — merged rare values
>
> The data was very clean — **zero missing values** — so we could focus on feature engineering rather than imputation."

### 📝 Slide 5 — Deep Dive Notes (for Q&A or if asked to elaborate)

#### Why 33 from 92 columns?
Many of the 92 columns are **redundant or irrelevant** for visualization:
- Columns like `url`, `desc` (text description), `zip_code` (too granular), internal IDs
- Duplicate info: `funded_amnt_inv` is almost identical to `funded_amnt`
- Post-loan columns like `total_pymnt`, `last_pymnt_d` — these describe **what happened after** the loan was issued, but we care about **what the borrower looked like before** getting the grade

We kept only columns meaningful for exploring *why* a borrower gets a certain grade — things like `int_rate`, `dti`, `fico_range_low`, `annual_inc`, `purpose`, `addr_state`, `home_ownership`, etc.

#### 5 Derived Features — what and why?

| Feature | How it's calculated | Why we needed it |
|---------|-------------------|------------------|
| `term_months` | Extracted the number from `term` (e.g., "36 months" → `36`) | Original column was text — we need a number for charts |
| `emp_length_num` | Mapped text to numbers (e.g., "< 1 year" → `0`, "10+ years" → `10`) | Same — text → numeric for plotting |
| `credit_age` | `issue_d_year` − `earliest_cr_line_year` | How many years the borrower has had credit. Longer history → more reliable |
| `grade_numeric` | A→1, B→2, C→3, ... G→7 | Allows computing **averages** (e.g., avg grade per state on the map) and numeric sorting/coloring |
| `fico_score` | (`fico_range_low` + `fico_range_high`) / 2 | Dataset gives a FICO *range* (e.g., 700–704). We take the **midpoint** as a single number for scatter plots |

#### Outlier Capping — what was capped and why?

Instead of **removing** extreme rows (which loses data), we **cap** them at a reasonable maximum:

| Column | Cap | Reasoning |
|--------|-----|-----------|
| `annual_inc` ≤ **$300K** | A few borrowers report income > $1M. Without capping, the income axis stretches to $1M+ and **99% of data gets squished** into a tiny area. $300K covers the 99th percentile. |
| `dti` ≤ **50** | DTI = monthly debt ÷ monthly income. DTI of 50 means **50% of income goes to debt** — already extreme. Some values > 100 are likely data errors. |
| `revol_bal` ≤ **$100K** | Revolving balance = credit card debt. A few borrowers had > $500K. Capping keeps charts readable. |

> **Key point if asked:** We used capping instead of removal to **preserve sample size** — removing 500+ outlier rows would bias geographic distributions and grade counts.

#### Category Cleaning — what changed?

1. **`home_ownership`**: Original had 5 categories: `MORTGAGE`, `RENT`, `OWN`, `ANY`, `OTHER`. But `ANY` had only **2 loans** and `OTHER` had only **1 loan** — too rare to visualize. We **merged `ANY` into `OTHER`** → 4 clean categories.
2. **`emp_length`**: Original values were text strings like `"< 1 year"`, `"2 years"`, `"10+ years"`. Converted to **numbers 0–10** for numeric axes.

#### One-liner summary if asked:
> *"We took 92 raw columns, kept the 33 most relevant ones, created 5 new features to make the data plottable, capped extreme outliers so they don't distort our charts, and cleaned up rare categories. The data had zero missing values so no imputation was needed."*

---

## Slide 6 — Visualization / Interaction Methods *(~40 sec)*

> "We built **8 linked interactive charts** using D3.js:
>
> The key interaction pattern is **click-to-filter**: clicking any bar, any state on the map, or any year cross-filters *every other chart* simultaneously. This lets you explore questions like: 'Do California borrowers have different grade distributions than Texas?'
>
> We also have **grade toggle buttons** at the top to quickly show or hide specific grades, and **rich tooltips** that appear on hover with detailed statistics.
>
> The design uses a **dark glassmorphism** theme — which is both aesthetically modern and helps the colored grades stand out clearly against the dark background."

> [!TIP]
> If you have the live demo open, show ONE quick cross-filter interaction — e.g. click on California on the map. This is very impressive in a live setting and takes only 5 seconds.

---

## Slide 7 — Answers / Findings *(~50 sec — this is the most important slide)*

> "Now for our results:
>
> **H1 — Confirmed.** Higher DTI and lower FICO scores do correlate with worse grades. But here's the interesting nuance: **FICO score is by far the dominant factor**. The scatter plot and box plots show very clean FICO separation between grades, while DTI and revolving utilization show only *weak* separation. This tells us LendingClub's grading algorithm relies **predominantly on credit score**, not debt burden.
>
> **H2 — Confirmed.** Small business loans do skew towards lower grades. The Loan Purpose chart shows this clearly.
>
> **H3 — Rejected.** We expected riskier grades to grow after 2015, but the temporal chart actually shows the opposite — the grade composition stayed relatively stable, and if anything, the proportion of safer grades increased slightly. LendingClub did **not** loosen their criteria.
>
> The **additional finding** that FICO dominates over DTI was the most interesting discovery — it wasn't part of our original hypotheses."

> [!IMPORTANT]
> This slide is your punchline. Slow down here. Emphasize the "rejected" hypothesis — it's more interesting than the confirmed ones because it shows you actually tested something and the data disagreed.

---

## Slide 8 — Thank You *(~15 sec)*

> "That's our project. Thank you for your attention. We're happy to take any questions, and if you'd like to try the interactive dashboard yourself, it's all on our GitHub."

---

## ⏱️ Timing Summary

| Slide | Topic | Time |
|-------|-------|------|
| 1 | Title | ~15s |
| 2 | Research Question | ~30s |
| 3 | Hypotheses | ~30s |
| 4 | Dashboard Screenshot | ~30s |
| 5 | Data / Preprocessing | ~30s |
| 6 | Visualization Methods | ~40s |
| 7 | **Findings (KEY SLIDE)** | ~50s |
| 8 | Thank You | ~15s |
| | **Total** | **~4:20** |

> [!NOTE]
> This leaves about **40 seconds of buffer** for natural pauses, transitions, and any quick live demo. Don't rush — 5 minutes is generous for 8 slides.

---

## 🙋 Likely Q&A Questions + Answers

**Q: "Why D3.js instead of Tableau?"**
> "We actually have both — the cleaned CSV is Tableau-ready. We chose D3 because it gave us full control over the cross-filtering interaction pattern, which is harder to customize in Tableau Public. Plus it was similar to what we did in Exercise 2."

**Q: "Why did you cap outliers instead of removing them?"**
> "Capping preserves the sample size — removing 500+ rows with extreme incomes would have biased our geographic and grade distributions. By capping at reasonable thresholds like $300K for income, we keep the data points while preventing them from distorting axis scales."

**Q: "How did you handle the class imbalance? Grades F and G are very rare."**
> "Good question — F and G together are only about 2.4% of the data. For visualization purposes this is fine since we use box plots and percentages rather than raw counts. The grade toggle buttons also let users focus on specific grades to see them better."

**Q: "What is the FICO score?"**
> "FICO is the most widely used credit score in the US, ranging from 300 to 850. It's calculated by the Fair Isaac Corporation based on credit history, payment behavior, and credit utilization. Our dataset had a low and high range, so we used the midpoint."

**Q: "What tool did you use for the dashboard?"**
> "D3.js version 7 for all charts, TopoJSON for the US map, and vanilla CSS with a custom dark theme. No frameworks — just pure HTML, CSS, and JavaScript."
