def _avg(values):
    return round(sum(values) / len(values), 2) if values else None


def _direction(diff):
    if diff is None:
        return None
    if diff > 0:
        return "higher"
    if diff < 0:
        return "lower"
    return "same"


def _prev_year_month(month: str):
    try:
        year, mm = month.split('-')
        return f"{int(year) - 1:04d}-{mm}"
    except (AttributeError, ValueError):
        return None


def compute_stats(facts: dict, level1_json: dict) -> dict:
    """Compute all statistics from facts. LLM will use these numbers, never do math itself."""
    stats = {}

    usage_history = facts.get('usage_history') or []
    billing_history = facts.get('billing_history') or []
    slab_rates = facts.get('slab_rates') or []

    current_units = level1_json.get('units_consumed')
    total_charges = level1_json.get('total_charges')
    total_taxes = level1_json.get('total_taxes')
    current_bill = level1_json.get('current_bill')
    bill_month = level1_json.get('bill_month')

    usage = sorted(
        (u for u in usage_history if u.get('month') and u.get('units') is not None),
        key=lambda u: u['month'],
    )
    units_list = [u['units'] for u in usage]

    stats['usage_history'] = usage_history
    stats['avg_units'] = _avg(units_list)
    stats['max_units'] = max(units_list) if units_list else None
    stats['max_units_month'] = next((u['month'] for u in usage if u['units'] == stats['max_units']), None)
    stats['min_units'] = min(units_list) if units_list else None
    stats['min_units_month'] = next((u['month'] for u in usage if u['units'] == stats['min_units']), None)
    stats['months_above_200'] = sum(1 for u in units_list if u > 200)

    # Q6: current month vs average
    if current_units is not None and stats['avg_units'] is not None:
        diff = round(current_units - stats['avg_units'], 2)
        stats['current_vs_avg_diff'] = diff
        stats['current_vs_avg'] = _direction(diff)

    # Q5: same month last year (computed here so the model never compares by hand)
    prev_month = _prev_year_month(bill_month)
    last_year = next((u['units'] for u in usage if u['month'] == prev_month), None)
    stats['same_month_last_year'] = {'month': prev_month, 'units': last_year}
    if last_year is not None and current_units is not None:
        diff = round(current_units - last_year, 2)
        stats['same_month_last_year']['difference'] = diff
        stats['same_month_last_year']['current_is'] = _direction(diff)

    # Q9: trend over the latest 3 months shown
    recent = usage[-3:]
    stats['last_3_months'] = recent
    if len(recent) >= 2:
        first, last = recent[0]['units'], recent[-1]['units']
        stats['last_3_months_change'] = round(last - first, 2)
        stats['last_3_months_trend'] = {'higher': 'up', 'lower': 'down', 'same': 'flat'}[_direction(last - first)]

    # Q7: summer (Jun-Aug) vs winter (Dec-Feb), using only months present
    summer = [u for u in usage if u['month'][5:7] in ('06', '07', '08')]
    winter = [u for u in usage if u['month'][5:7] in ('12', '01', '02')]
    stats['summer'] = {'months': [u['month'] for u in summer], 'total_units': sum(u['units'] for u in summer),
                       'avg_units_per_month': _avg([u['units'] for u in summer])}
    stats['winter'] = {'months': [u['month'] for u in winter], 'total_units': sum(u['units'] for u in winter),
                       'avg_units_per_month': _avg([u['units'] for u in winter])}
    if summer and winter:
        stats['summer_minus_winter_avg_units_per_month'] = round(
            stats['summer']['avg_units_per_month'] - stats['winter']['avg_units_per_month'], 2)

    # Q10: forecast (estimate; averages of what the bill shows)
    stats['forecast_next_month_units'] = {
        'method': 'average of the months shown on the bill (estimate)',
        'avg_all_months': stats['avg_units'],
        'avg_last_3_months': _avg([u['units'] for u in recent]),
    }

    # Q8: payment behaviour
    paid, unpaid = [], []
    for b in billing_history:
        billed, payment = b.get('billed_amount'), b.get('payment')
        if billed is None:
            continue
        # tolerate rounding of up to 1 rupee between billed and paid amounts
        if payment is not None and payment >= billed - 1:
            paid.append(b.get('month'))
        else:
            unpaid.append({'month': b.get('month'), 'billed_amount': billed, 'payment': payment})
    stats['billing_history'] = billing_history
    stats['payments'] = {'months_checked': len(paid) + len(unpaid), 'paid_in_full': paid, 'short_or_missing': unpaid}

    # Q11: even monthly budget
    billed_amounts = [b['billed_amount'] for b in billing_history if b.get('billed_amount') is not None]
    if billed_amounts:
        stats['monthly_budget'] = {
            'method': f'average billed amount over the {len(billed_amounts)} months shown on the bill (estimate)',
            'avg_monthly_bill': _avg(billed_amounts),
            'annual_estimate': round(sum(billed_amounts) / len(billed_amounts) * 12, 2),
        }
    elif current_bill is not None:
        stats['monthly_budget'] = {
            'method': 'only the current bill is available, so it is used as the monthly figure (estimate)',
            'avg_monthly_bill': current_bill,
            'annual_estimate': round(current_bill * 12, 2),
        }

    # Q12: same units again -> same energy cost, so roughly the current bill
    if current_bill is not None:
        stats['estimate_same_units_bill'] = {
            'method': 'same units as this bill, assuming unchanged rates and no arrears (estimate)',
            'estimated_bill': current_bill,
            'cost_per_unit': round(current_bill / current_units, 2) if current_units else None,
        }

    if total_charges and current_bill:
        stats['tax_percentage'] = round((total_taxes / current_bill * 100) if total_taxes else 0, 2)
        stats['energy_percentage'] = round((total_charges / current_bill * 100), 2)
    else:
        stats['tax_percentage'] = facts.get('tax_percentage')
        stats['energy_percentage'] = facts.get('energy_percentage')

    stats['slab_rates'] = slab_rates
    stats['current_units'] = current_units
    stats['total_charges'] = total_charges
    stats['total_taxes'] = total_taxes
    stats['current_bill'] = current_bill

    return stats
