"""
Data Preprocessing for LendingClub Credit Risk — Tableau Export
================================================================
Cleans the learning dataset and exports a Tableau-ready CSV with:
  - Key columns for visualization
  - Derived features (credit_age, grade_numeric)
  - Outlier capping on annual_inc and dti
  - Cleaned emp_length as numeric
"""

import pandas as pd
import numpy as np

# ── Configuration ──────────────────────────────────────────────────
INPUT_PATH = "loan-10k.lrn.csv"
OUTPUT_PATH = "loan_cleaned.csv"

# Columns to keep for Tableau visualization
KEEP_COLUMNS = [
    # Identifiers
    "ID",
    # Loan details
    "loan_amnt", "funded_amnt", "term", "int_rate", "installment",
    # Borrower profile
    "emp_length", "home_ownership", "annual_inc", "verification_status",
    # Loan outcome
    "loan_status",
    # Purpose & geography
    "purpose", "addr_state",
    # Credit risk indicators
    "dti", "delinq_2yrs", "fico_range_low", "fico_range_high",
    "inq_last_6mths", "open_acc", "pub_rec",
    "revol_bal", "revol_util", "total_acc",
    # Delinquency / credit behavior
    "mort_acc", "pub_rec_bankruptcies",
    "num_accts_ever_120_pd", "pct_tl_nvr_dlq",
    # Application type
    "application_type",
    # Time dimensions
    "issue_d_month", "issue_d_year",
    "earliest_cr_line_month", "earliest_cr_line_year",
    # Target
    "grade",
]


def load_data(path: str) -> pd.DataFrame:
    """Load the raw CSV."""
    df = pd.read_csv(path)
    print(f"Loaded {path}: {df.shape[0]} rows × {df.shape[1]} columns")
    return df


def select_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Keep only the columns needed for Tableau."""
    available = [c for c in KEEP_COLUMNS if c in df.columns]
    missing = [c for c in KEEP_COLUMNS if c not in df.columns]
    if missing:
        print(f"  Warning: columns not found: {missing}")
    df = df[available].copy()
    print(f"  Selected {len(available)} columns")
    return df


def clean_term(df: pd.DataFrame) -> pd.DataFrame:
    """Strip whitespace from term and create a numeric version."""
    df["term"] = df["term"].str.strip()
    df["term_months"] = df["term"].str.extract(r"(\d+)").astype(int)
    return df


def clean_emp_length(df: pd.DataFrame) -> pd.DataFrame:
    """Convert emp_length to numeric years."""
    mapping = {
        "< 1 year": 0,
        "1 year": 1,
        "2 years": 2,
        "3 years": 3,
        "4 years": 4,
        "5 years": 5,
        "6 years": 6,
        "7 years": 7,
        "8 years": 8,
        "9 years": 9,
        "10+ years": 10,
    }
    df["emp_length_num"] = df["emp_length"].map(mapping)
    print(f"  emp_length mapped to numeric (0-10). Unmapped: {df['emp_length_num'].isnull().sum()}")
    return df


def cap_outliers(df: pd.DataFrame) -> pd.DataFrame:
    """Cap extreme outliers for key continuous features."""
    caps = {
        "annual_inc": (None, 300_000),   # Cap at 99th percentile area
        "dti": (None, 50),               # Extremely high DTI is suspect
        "revol_bal": (None, 100_000),     # Cap extreme revolving balances
    }
    for col, (lower, upper) in caps.items():
        if col not in df.columns:
            continue
        before = df[col].describe()
        if lower is not None:
            n_low = (df[col] < lower).sum()
            df[col] = df[col].clip(lower=lower)
        else:
            n_low = 0
        if upper is not None:
            n_high = (df[col] > upper).sum()
            df[col] = df[col].clip(upper=upper)
        else:
            n_high = 0
        print(f"  {col}: capped {n_low} low + {n_high} high values (bounds: {lower}, {upper})")
    return df


def add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create derived features for visualization."""
    # Credit age: how many years since earliest credit line
    if "issue_d_year" in df.columns and "earliest_cr_line_year" in df.columns:
        df["credit_age"] = df["issue_d_year"] - df["earliest_cr_line_year"]
        df["credit_age"] = df["credit_age"].clip(lower=0)
        print(f"  credit_age: mean={df['credit_age'].mean():.1f}, "
              f"median={df['credit_age'].median():.0f}, "
              f"range=[{df['credit_age'].min()}, {df['credit_age'].max()}]")

    # Numeric grade for ordering and coloring in Tableau
    grade_map = {"A": 1, "B": 2, "C": 3, "D": 4, "E": 5, "F": 6, "G": 7}
    df["grade_numeric"] = df["grade"].map(grade_map)
    print(f"  grade_numeric: mapped A=1 through G=7")

    # FICO midpoint (average of low and high)
    if "fico_range_low" in df.columns and "fico_range_high" in df.columns:
        df["fico_score"] = (df["fico_range_low"] + df["fico_range_high"]) / 2
        print(f"  fico_score (midpoint): mean={df['fico_score'].mean():.1f}")

    return df


def clean_home_ownership(df: pd.DataFrame) -> pd.DataFrame:
    """Merge rare home_ownership categories."""
    # ANY and OTHER are extremely rare (3 total), merge into OTHER
    df["home_ownership"] = df["home_ownership"].replace({"ANY": "OTHER"})
    print(f"  home_ownership: merged ANY → OTHER. "
          f"Categories: {df['home_ownership'].value_counts().to_dict()}")
    return df


def export(df: pd.DataFrame, path: str) -> None:
    """Export the cleaned DataFrame to CSV."""
    df.to_csv(path, index=False)
    print(f"\nExported {path}: {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"File size: {pd.io.common.file_exists(path)} — check manually")
    print(f"\nColumn list for Tableau:")
    for i, col in enumerate(df.columns, 1):
        dtype = str(df[col].dtype)
        sample = df[col].iloc[0]
        print(f"  {i:>3}. {col:<30} {dtype:<10}  (e.g. {sample})")


if __name__ == "__main__":
    print("=" * 70)
    print("DATA PREPROCESSING")
    print("=" * 70)

    df = load_data(INPUT_PATH)

    print("\n1. Selecting columns...")
    df = select_columns(df)

    print("\n2. Cleaning term...")
    df = clean_term(df)

    print("\n3. Cleaning emp_length...")
    df = clean_emp_length(df)

    print("\n4. Capping outliers...")
    df = cap_outliers(df)

    print("\n5. Cleaning home_ownership...")
    df = clean_home_ownership(df)

    print("\n6. Adding derived features...")
    df = add_derived_features(df)

    print("\n7. Exporting...")
    export(df, OUTPUT_PATH)

    print("\n" + "=" * 70)
    print("PREPROCESSING COMPLETE")
    print("=" * 70)
    print(f"\n→ Load '{OUTPUT_PATH}' into Tableau Public to start building your dashboard.")
