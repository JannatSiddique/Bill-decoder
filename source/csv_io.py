import csv
import json
from pathlib import Path

def read_level1_template(template_path: str) -> list:
    """Read level1.csv template, return list of rows (bill_id, empty json)."""
    rows = []
    with open(template_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

def read_level2_template(template_path: str) -> list:
    """Read level2.csv template, return list of rows (bill_id, question_id, question, empty answer)."""
    rows = []
    with open(template_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

def write_level1_results(template_path: str, results: dict, output_path: str):
    """Write Level 1 results: bill_id, json (one line)."""
    rows = read_level1_template(template_path)

    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['bill_id', 'json'])
        writer.writeheader()

        for row in rows:
            bill_id = row['bill_id']
            json_obj = results.get(bill_id, {})
            json_str = json.dumps(json_obj) if json_obj else ""
            writer.writerow({'bill_id': bill_id, 'json': json_str})

def write_level2_results(template_path: str, results: dict, output_path: str):
    """Write Level 2 results: keep bill_id, question_id, question; fill answer."""
    rows = read_level2_template(template_path)

    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['bill_id', 'question_id', 'question', 'answer'])
        writer.writeheader()

        for row in rows:
            bill_id = row['bill_id']
            question_id = row['question_id']

            if bill_id in results and question_id in results[bill_id]:
                answer = results[bill_id][question_id]
            else:
                answer = "Could not be determined from the bill."

            writer.writerow({
                'bill_id': bill_id,
                'question_id': question_id,
                'question': row['question'],
                'answer': answer
            })
