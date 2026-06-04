"""
Exploratory Data Analysis (EDA) for LendingClub Credit Risk Dataset
====================================================================
Loads loan-10k.lrn.csv and produces a comprehensive summary:
  - Dataset shape & data types
  - Grade distribution (counts & percentages)
  - Summary statistics for key financial columns
  - Missing value analysis
  - Outlier detection for continuous features
"""

import pandas as pd
import numpy as np

# ── Configuration ──────────────────────────────────────────────────
DATA_PATH = "../data/raw/loan-10k.lrn.csv"

KEY_NUMERICAL = [
    "int_rate", "dti", "fico_range_low", "fico_range_high",
    "revol_util", "annual_inc", "loan_amnt", "funded_amnt",
    "installment", "revol_bal", "total_acc", "open_acc",
    "pub_rec", "delinq_2yrs", "inq_last_6mths",
]

KEY_CATEGORICAL = [
    "grade", "purpose", "home_ownership", "emp_length",
    "verification_status", "loan_status", "term", "addr_state",
    "application_type",
]


def load_data(path: str) -> pd.DataFrame:
    """Load the CSV and do basic type reporting."""
    df = pd.read_csv(path)
    print("=" * 70)
    print("DATASET OVERVIEW")
    print("=" * 70)
    print(f"Shape: {df.shape[0]} rows × {df.shape[1]} columns\n")
    print(f"Column names ({len(df.columns)}):")
    for i, col in enumerate(df.columns, 1):
        print(f"  {i:>3}. {col:<40} {str(df[col].dtype)}")
    return df


def grade_distribution(df: pd.DataFrame) -> None:
    """Print grade counts and percentages."""
    print("\n" + "=" * 70)
    print("GRADE DISTRIBUTION")
    print("=" * 70)
    counts = df["grade"].value_counts().sort_index()
    total = len(df)
    print(f"{'Grade':<8} {'Count':>8} {'Percent':>10}")
    print("-" * 30)
    for grade, count in counts.items():
        pct = count / total * 100
        bar = "█" * int(pct)
        print(f"  {grade:<6} {count:>8,}   {pct:>6.2f}%  {bar}")
    print(f"\n  Total: {total:>7,}")


def numerical_summary(df: pd.DataFrame) -> None:
    """Summary statistics for key numerical columns."""
    print("\n" + "=" * 70)
    print("KEY NUMERICAL FEATURES — SUMMARY STATISTICS")
    print("=" * 70)
    cols = [c for c in KEY_NUMERICAL if c in df.columns]
    stats = df[cols].describe(percentiles=[0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99]).T
    stats["missing"] = df[cols].isnull().sum()
    stats["missing%"] = (df[cols].isnull().sum() / len(df) * 100).round(2)
    pd.set_option("display.float_format", "{:,.2f}".format)
    pd.set_option("display.max_columns", 20)
    pd.set_option("display.width", 140)
    print(stats.to_string())


def missing_value_analysis(df: pd.DataFrame) -> None:
    """Identify columns with missing values."""
    print("\n" + "=" * 70)
    print("MISSING VALUE ANALYSIS")
    print("=" * 70)
    missing = df.isnull().sum()
    missing = missing[missing > 0].sort_values(ascending=False)
    if len(missing) == 0:
        print("No missing values found!")
        return
    total = len(df)
    print(f"{'Column':<40} {'Missing':>8} {'Percent':>10}")
    print("-" * 60)
    for col, count in missing.items():
        pct = count / total * 100
        print(f"  {col:<38} {count:>8,}   {pct:>6.2f}%")
    print(f"\nTotal columns with missing values: {len(missing)} / {len(df.columns)}")


def outlier_detection(df: pd.DataFrame) -> None:
    """Detect outliers using IQR method for key numerical columns."""
    print("\n" + "=" * 70)
    print("OUTLIER DETECTION (IQR Method)")
    print("=" * 70)
    cols = [c for c in KEY_NUMERICAL if c in df.columns]
    print(f"{'Column':<25} {'Q1':>12} {'Q3':>12} {'IQR':>12} {'Lower':>12} {'Upper':>12} {'Outliers':>10} {'%':>8}")
    print("-" * 105)
    for col in cols:
        series = df[col].dropna()
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        n_outliers = ((series < lower) | (series > upper)).sum()
        pct = n_outliers / len(series) * 100
        print(f"  {col:<23} {q1:>12,.2f} {q3:>12,.2f} {iqr:>12,.2f} {lower:>12,.2f} {upper:>12,.2f} {n_outliers:>10,} {pct:>7.2f}%")


def categorical_summary(df: pd.DataFrame) -> None:
    """Quick overview of key categorical columns."""
    print("\n" + "=" * 70)
    print("KEY CATEGORICAL FEATURES")
    print("=" * 70)
    for col in KEY_CATEGORICAL:
        if col not in df.columns:
            continue
        unique = df[col].nunique()
        top_vals = df[col].value_counts().head(5)
        print(f"\n  {col} ({unique} unique values):")
        for val, count in top_vals.items():
            pct = count / len(df) * 100
            print(f"    {str(val):<30} {count:>6,}  ({pct:.1f}%)")


def grade_vs_key_features(df: pd.DataFrame) -> None:
    """Show mean of key features broken down by grade."""
    print("\n" + "=" * 70)
    print("GRADE vs. KEY FINANCIAL FEATURES (Mean per Grade)")
    print("=" * 70)
    features = ["int_rate", "dti", "fico_range_low", "revol_util", "annual_inc", "loan_amnt"]
    features = [f for f in features if f in df.columns]
    grouped = df.groupby("grade")[features].mean()
    grouped = grouped.loc[sorted(grouped.index)]
    pd.set_option("display.float_format", "{:,.2f}".format)
    print(grouped.to_string())


if __name__ == "__main__":
    df = load_data(DATA_PATH)
    grade_distribution(df)
    numerical_summary(df)
    missing_value_analysis(df)
    outlier_detection(df)
    categorical_summary(df)
    grade_vs_key_features(df)
    print("\n" + "=" * 70)
    print("EDA COMPLETE")
    print("=" * 70)
