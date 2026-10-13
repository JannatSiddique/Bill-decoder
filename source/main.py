#!/usr/bin/env python3
import argparse
import csv
from pathlib import Path
import logging
from extraction import extract_level1
from qa import answer_level2_questions
from csv_io import read_level1_template, read_level2_template, write_level1_results, write_level2_results

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

def get_bill_files(bills_dir: str) -> list:
    """Find all bill images in directory (png, jpg)."""
    path = Path(bills_dir)
    files = sorted(path.glob('*.png')) + sorted(path.glob('*.jpg'))
    return [(f.stem, str(f)) for f in files]

def run_pipeline(bills_dir: str, level1_template: str, level2_template: str, out_dir: str):
    """Main pipeline: extract L1, answer L2, write CSVs."""
    Path(out_dir).mkdir(exist_ok=True)

    bill_files = get_bill_files(bills_dir)
    if not bill_files:
        logger.error(f"No bill images found in {bills_dir}")
        return

    logger.info(f"Found {len(bill_files)} bills")

    level1_results = {}
    level2_results = {}

    l2_template_rows = read_level2_template(level2_template)
    questions_map = {}
    for row in l2_template_rows:
        bill_id = row['bill_id']
        if bill_id not in questions_map:
            questions_map[bill_id] = []
        questions_map[bill_id].append({
            'question_id': row['question_id'],
            'question': row['question']
        })

    for bill_id, image_path in bill_files:
        logger.info(f"\nProcessing {bill_id}...")
        try:
            logger.info("  Level 1: Extract structured data")
            level1_json = extract_level1(image_path, bill_id)
            level1_results[bill_id] = level1_json

            logger.info("  Level 2: Answer questions")
            if bill_id in questions_map:
                questions = questions_map[bill_id]
                answers = answer_level2_questions(image_path, bill_id, level1_json, questions)
                level2_results[bill_id] = answers
            else:
                logger.warning(f"    No questions found for {bill_id}")
                level2_results[bill_id] = {}

        except Exception as e:
            logger.error(f"  ERROR: {str(e)}")
            logger.error(f"  Skipping {bill_id}")
            continue

    logger.info("\n" + "="*60)
    logger.info("Writing results to CSV...")

    output_level1 = Path(out_dir) / "level1.csv"
    output_level2 = Path(out_dir) / "level2.csv"

    write_level1_results(level1_template, level1_results, str(output_level1))
    write_level2_results(level2_template, level2_results, str(output_level2))

    logger.info(f"✓ Level 1 CSV: {output_level1}")
    logger.info(f"✓ Level 2 CSV: {output_level2}")
    logger.info("="*60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pakistani electricity bill decoder")
    parser.add_argument("--bills", required=True, help="Folder with bill images")
    parser.add_argument("--level1-template", required=True, help="Level 1 CSV template")
    parser.add_argument("--level2-template", required=True, help="Level 2 CSV template")
    parser.add_argument("--out", required=True, help="Output folder for CSVs")

    args = parser.parse_args()

    run_pipeline(args.bills, args.level1_template, args.level2_template, args.out)
