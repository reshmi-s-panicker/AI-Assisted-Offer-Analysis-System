def calc_risk(days, tier, dsa, sd, readiness, comm, res, placement_type, ctc):

    score = 0

    # Time Pressur
    if days < 15:   score += 4
    elif days < 30: score += 3
    elif days < 60: score += 1

    # Tier Difficulty
    tier_weights = {
        'faang': 3,
        'product': 2,
        'startup': 1,
        'service': 0,
        'government': 0
    }
    score += tier_weights.get(tier, 1)

    # DSA Gap
    score += (5 - dsa)

    # System Design Gap
    if tier in ('faang', 'product', 'startup'):
        score += (5 - sd)

    # Resume + Communication Risk
    score += (5 - comm) * 0.5
    score += (5 - res) * 0.5

    # Placement Type Risk 
    if placement_type == 'off-campus':
        score += 1

    # CTC Pressure 
    if isinstance(ctc, str):
        if '30' in ctc or '40' in ctc:
            score += 2
        elif '20' in ctc:
            score += 1

    # Readiness Adjustment 
    if readiness < 40:
        score += 3
    elif readiness < 60:
        score += 1

    # Risk Classification 
    if score >= 12:
        level = 'high'
    elif score >= 6:
        level = 'medium'
    else:
        level = 'low'

    risk_map = {
        'high':  ('🔴', 'HIGH RISK',  'High placement risk detected. Immediate corrective action required.', 'risk-high'),
        'medium':('🟡', 'MEDIUM RISK','Manageable risk — but disciplined execution required.', 'risk-medium'),
        'low':   ('🟢', 'LOW RISK',   'Strong placement position. Maintain consistency.', 'risk-low'),
    }

    icon, label, text, cls = risk_map[level]

    return {
        'level': level,
        'icon': icon,
        'label': label,
        'text': text,
        'cls': cls,
        'score': round(score, 1)
    }