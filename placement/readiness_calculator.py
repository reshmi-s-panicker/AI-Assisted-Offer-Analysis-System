def build_readiness(tier, role, dsa, sd, comm, res):

    # Convert 1–5 → percentage
    dsa_pct  = round((dsa  / 5) * 100)
    sd_pct   = round((sd   / 5) * 100)
    comm_pct = round((comm / 5) * 100)
    res_pct  = round((res  / 5) * 100)

    weight_map = {
        'sde':          { 'dsa': 0.40, 'sd': 0.25, 'comm': 0.15, 'resume': 0.20 },
        'data-analyst': { 'dsa': 0.20, 'sd': 0.10, 'comm': 0.30, 'resume': 0.40 },
        'ml':           { 'dsa': 0.20, 'sd': 0.35, 'comm': 0.15, 'resume': 0.30 },
        'devops':       { 'dsa': 0.10, 'sd': 0.40, 'comm': 0.15, 'resume': 0.35 },
        'uiux':         { 'dsa': 0.05, 'sd': 0.15, 'comm': 0.30, 'resume': 0.50 },
        'consulting':   { 'dsa': 0.05, 'sd': 0.05, 'comm': 0.50, 'resume': 0.40 },
    }

    w = weight_map.get(role, { 'dsa': 0.30, 'sd': 0.25, 'comm': 0.20, 'resume': 0.25 })

    # Safety normalization
    total_weight = sum(w.values())
    for k in w:
        w[k] /= total_weight

    overall = round(
        dsa_pct  * w['dsa'] +
        sd_pct   * w['sd'] +
        comm_pct * w['comm'] +
        res_pct  * w['resume']
    )

    

    # Critical Skill Floor (prevents fake high readiness) 
    
    

    breakdown = [
        { 'label': 'DSA / Core Skill', 'pct': dsa_pct,  'color': 'var(--accent)'  },
        { 'label': 'System Design',    'pct': sd_pct,   'color': 'var(--accent3)' },
        { 'label': 'Communication',    'pct': comm_pct, 'color': 'var(--gold)'    },
        { 'label': 'Resume Strength',  'pct': res_pct,  'color': 'var(--accent2)' },
    ]

    weakest = min(breakdown, key=lambda x: x['pct'])

    return {
        'overall': overall,
        'breakdown': breakdown,
        'weakest': weakest,
    }