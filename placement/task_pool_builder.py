from placement.roadmap_builder import get_dsa_tasks


def build_task_pool(tier, role, dsa, sd, res, comm):

    dsa_tasks = get_dsa_tasks(role, dsa, tier)

    # Dynamic DSA Scaling 
    base_dsa = [
        { 'tag': 'dsa', 'text': 'Solve 3 Easy problems (warm-up)' },
        { 'tag': 'dsa', 'text': "Review yesterday's wrong solutions" },
    ]

    if dsa <= 2:
        base_dsa.append({ 'tag': 'dsa', 'text': 'Practice basic patterns: arrays, strings' })
    elif dsa <= 3:
        base_dsa.append({ 'tag': 'dsa', 'text': 'Solve 1 Medium problem timed (<30 min)' })
    else:
        base_dsa.append({ 'tag': 'dsa', 'text': 'Solve 1 Hard problem or 2 Medium problems' })

    for task in dsa_tasks:
        base_dsa.append({ 'tag': 'dsa', 'text': task })

    # Tier-Based Design Intensity 
    design_pool = [
        { 'tag': 'design', 'text': 'Study CAP theorem and trade-offs' },
        { 'tag': 'design', 'text': 'Sketch system design without reference' },
    ]

    if tier == 'faang':
        design_pool.append({ 'tag': 'design', 'text': 'Design at scale (Twitter / Uber)' })
    elif tier == 'startup':
        design_pool.append({ 'tag': 'design', 'text': 'Design scalable MVP backend' })

    # Resume Scaling 
    resume_pool = [
        { 'tag': 'resume', 'text': 'Rewrite 2 resume bullets with quantified metrics' },
        { 'tag': 'resume', 'text': 'Tailor resume for specific job description' },
    ]

    if res <= 2:
        resume_pool.append({ 'tag': 'resume', 'text': 'Get resume reviewed by senior or mentor' })

    # Mock Scaling 
    mock_pool = [
        { 'tag': 'mock', 'text': 'Practice STAR story out loud' },
        { 'tag': 'mock', 'text': 'Simulate 30-min technical interview' },
    ]

    if comm <= 2:
        mock_pool.append({ 'tag': 'mock', 'text': 'Practice 10-min self-introduction recording' })

    # Apply Scaling 
    apply_pool = [
        { 'tag': 'apply', 'text': 'Apply to 3 companies' },
        { 'tag': 'apply', 'text': 'Send 2 referral messages' },
    ]

    if tier == 'faang':
        apply_pool.append({ 'tag': 'apply', 'text': 'Research hiring managers and connect' })

    return {
        'dsa': base_dsa,
        'design': design_pool,
        'resume': resume_pool,
        'mock': mock_pool,
        'apply': apply_pool,
    }