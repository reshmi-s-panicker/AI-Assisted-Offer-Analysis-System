import math


def get_day_tasks(day, days, phases, res, task_pool):

    current_phase = next(
        (ph for ph in phases if ph['start'] <= day <= ph['end']),
        None
    )

    phase_type = current_phase.get('type', 'dsa') if current_phase else 'dsa'

    primary_pool = task_pool.get(phase_type, task_pool.get('dsa', []))

    if not primary_pool:
        return []

    tasks = []
    seed = day

    # Base tasks count
    task_count = 2

    # Crash plans get more intensity
    if days < 20:
        task_count = 3

    # Add primary tasks
    for i in range(task_count):
        tasks.append(primary_pool[(seed + i * 2) % len(primary_pool)])

    # Resume reinforcement
    if res < 4:
        resume_pool = task_pool.get('resume', [])
        if resume_pool:
            tasks.append(resume_pool[seed % len(resume_pool)])

    # Application scaling
    if day > max(3, math.floor(days * 0.1)):
        apply_pool = task_pool.get('apply', [])
        if apply_pool:
            tasks.append(apply_pool[seed % len(apply_pool)])

    # Mock scaling
    if day > math.floor(days * 0.35):
        mock_pool = task_pool.get('mock', [])
        if mock_pool:
            tasks.append(mock_pool[seed % len(mock_pool)])

    # Deduplicate
    seen = set()
    unique = []
    for t in tasks:
        if t['text'] not in seen:
            seen.add(t['text'])
            unique.append(t)

    return unique