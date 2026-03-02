
#   strategy_generator.py
#   Determines mode, allocates days, applies
#   tier modifiers, calls all sub-engines,
#   returns the complete plan dict.


from placement.roadmap_builder      import build_phases
from placement.readiness_calculator import build_readiness
from placement.risk_assessor        import calc_risk
from placement.task_pool_builder    import build_task_pool


def build_plan(days, tier, role, dsa, sd, comm, res, placement_type, ctc):

    # Determine Mode 
    if days >= 90:
        mode       = 'deep'
        mode_label = 'DEEP PREP MODE'
        mode_icon  = '🧠'
        mode_color = 'deep'
        mode_desc  = f'Based on {days} days remaining, you are in FULL DEEP PREPARATION MODE. Maximum coverage across all skill areas.'
    elif days >= 60:
        mode       = 'balanced'
        mode_label = 'BALANCED MODE'
        mode_icon  = '⚖️'
        mode_color = 'balanced'
        mode_desc  = f'Based on {days} days remaining, you are in BALANCED MODE. Strong DSA + key system design + application push.'
    elif days >= 30:
        mode       = 'fast'
        mode_label = 'FAST-TRACK MODE'
        mode_icon  = '🚀'
        mode_color = 'fast'
        mode_desc  = f'Based on {days} days remaining, you are in FAST-TRACK MODE. Prioritise high-impact prep and start applications immediately.'
    else:
        mode       = 'crash'
        mode_label = 'CRASH MODE'
        mode_icon  = '⚠️'
        mode_color = 'crash'
        mode_desc  = f'Based on {days} days remaining, you are in CRASH MODE. Revise top patterns, polish resume, hammer applications daily.'

    # Day Allocation 
    if mode == 'deep':
        alloc = { 'dsa': 40, 'sd': 20, 'core': 15, 'mock': 10, 'resume': 5, 'apply': 0 }
    elif mode == 'balanced':
        alloc = {
            'dsa':    round(days * 0.40),
            'sd':     round(days * 0.17),
            'core':   round(days * 0.10),
            'mock':   round(days * 0.13),
            'resume': round(days * 0.08),
            'apply':  round(days * 0.12),
        }
    elif mode == 'fast':
        alloc = {
            'dsa':    round(days * 0.45),
            'sd':     round(days * 0.15),
            'core':   round(days * 0.08),
            'mock':   round(days * 0.12),
            'resume': round(days * 0.08),
            'apply':  round(days * 0.12),
        }
    else:  # crash
        alloc = {
            'dsa':    round(days * 0.50),
            'sd':     0,
            'core':   0,
            'mock':   round(days * 0.20),
            'resume': round(days * 0.15),
            'apply':  round(days * 0.15),
        }

    #  Tier Modifiers
    tier_mods = {
        'faang':      { 'dsa': +5, 'sd': +3, 'mock': +2 },
        'product':    { 'dsa': +2, 'sd': +3, 'mock': +2, 'resume': +1 },
        'service':    { 'dsa': -2, 'sd': -3, 'core': +4, 'resume': +2 },
        'startup':    { 'dsa': -2, 'sd': +4, 'mock': +1, 'resume': +2 },
        'government': { 'dsa': -4, 'sd': -4, 'core': +6, 'resume': +2 },
    }
    for k, v in tier_mods.get(tier, {}).items():
        if k in alloc:
            alloc[k] = max(0, alloc[k] + v)
    # Normalize allocation so total == days 
    total_alloc = sum(alloc.values())

    if total_alloc > days:
        scale = days / total_alloc
        for k in alloc:
            alloc[k] = max(0, round(alloc[k] * scale))

    # Final safety correction (fix rounding drift)
    while sum(alloc.values()) > days:
        largest = max(alloc, key=alloc.get)
        alloc[largest] -= 1

    while sum(alloc.values()) < days:
        alloc['dsa'] += 1
    # Call Sub-Engines 
    phases    = build_phases(days, mode, tier, role, dsa, sd, alloc)
    readiness = build_readiness(tier, role, dsa, sd, comm, res)
    risk = calc_risk(
    days,
    tier,
    dsa,
    sd,
    readiness['overall'],
    comm,
    res,
    placement_type,
    ctc
)
    task_pool = build_task_pool(tier, role, dsa, sd, res, comm)

    return {
        'days':      days,
        'tier':      tier,
        'role':      role,
        'dsa':       dsa,
        'sd':        sd,
        'comm':      comm,
        'res':       res,
        'type':      placement_type,
        'ctc':       ctc,
        'mode':      mode,
        'modeLabel': mode_label,
        'modeIcon':  mode_icon,
        'modeColor': mode_color,
        'modeDesc':  mode_desc,
        'alloc':     alloc,
        'phases':    phases,
        'readiness': readiness,
        'risk':      risk,
        'taskPool':  task_pool,
    }
