def build_phases(days, mode, tier, role, dsa, sd, alloc):

    phases = []
    cursor = 1

    role_labels = {
        'sde': 'SDE', 'data-analyst': 'Data Analyst',
        'ml': 'ML Engineer', 'devops': 'DevOps',
        'uiux': 'UI/UX', 'consulting': 'Consulting',
    }

    tier_labels = {
        'faang': 'FAANG', 'product': 'Product-Based',
        'service': 'Service', 'startup': 'Startup',
        'government': 'Govt/PSU',
    }

    role_label = role_labels.get(role, role)
    tier_label = tier_labels.get(tier, tier)


    def safe_add_phase(title, label, days_count, tasks, tags):
        nonlocal cursor, phases

        if days_count <= 0 or cursor > days:
            return

        start = cursor
        end = min(cursor + days_count - 1, days)

        phases.append({
            'num': len(phases) + 1,
            'label': label,
            'title': title,
            'days': f'Day {start}–{end}',
            'start': start,
            'end': end,
            'tasks': tasks,
            'tags': tags,
        })

        cursor = end + 1


    # Phase 1: DSA 
    dsa_days = alloc.get('dsa', 0)

    if role == 'data-analyst':
        dsa_label = 'SQL & Analytics Sprint'
    elif role == 'ml':
        dsa_label = 'ML Foundations Sprint'
    elif role == 'devops':
        dsa_label = 'Infrastructure & Cloud Sprint'
    elif role == 'uiux':
        dsa_label = 'Portfolio & Design Sprint'
    elif role == 'consulting':
        dsa_label = 'Case Study & Aptitude Sprint'
    elif dsa <= 2:
        dsa_label = 'DSA Foundations Sprint'
    elif dsa <= 3:
        dsa_label = 'DSA Intermediate Sprint'
    else:
        dsa_label = 'DSA Advanced Sprint'

    safe_add_phase(
        dsa_label,
        f'Phase 01 — High Intensity',
        dsa_days,
        get_dsa_tasks(role, dsa, tier),
        ['tag-cyan']
    )

    # Phase 2: System Design 
    sd_days = alloc.get('sd', 0)
    sd_title = 'System Design Sprint' if role in ('sde', 'ml') else f'{role_label} Domain Depth'

    safe_add_phase(
        sd_title,
        f'Phase 02 — Design & Architecture',
        sd_days,
        get_sd_tasks(role, tier, sd),
        ['tag-green']
    )

    # Phase 3: Resume + Apply (Skip in crash)
    if mode != 'crash':
        res_days = alloc.get('resume', 0) + alloc.get('apply', 0)

        safe_add_phase(
            f'Resume Polish + {tier_label} Outreach',
            f'Phase 03 — Outreach',
            res_days,
            [
                f'Tailor resume for {tier_label} {role_label} roles',
                'Optimise LinkedIn headline and About section',
                'Send 5–8 referral messages',
                'Apply to companies daily',
                'Follow up on previous applications'
            ],
            ['tag-gold']
        )

    #Phase 4: Mock 
    mock_days = alloc.get('mock', 0)

    safe_add_phase(
        'Mock Interview Sprint',
        f'Phase 04 — Mock Execution',
        mock_days,
        [
            f'Conduct 1 full mock {role_label} interview daily',
            'Record yourself — review tone',
            'Practice 3 STAR answers',
            'Time technical problems',
        ],
        ['tag-orange']
    )

    # Final Safety Buffer 
    if cursor <= days:
        safe_add_phase(
            'Final Revision & Buffer',
            f'Phase {len(phases)+1:02d} — Final Revision',
            days - cursor + 1,
            [
                'Full revision of weak topics',
                'Revisit mistakes',
                'Extra mock interviews',
                'Application push'
            ],
            ['tag-buffer']
        )

    return phases

def get_dsa_tasks(role, dsa, tier):

    tasks = {
        'sde': [
            'Arrays, Strings, Hashing fundamentals' if dsa <= 2 else 'Sliding Window + Two Pointers patterns',
            'Sorting + Binary Search basics' if dsa <= 2 else 'Trees, BST, Trie problems',
            'Recursion + Backtracking problems',
            'Stack, Queue, Linked Lists' if dsa <= 3 else 'Dynamic Programming (Knapsack, LCS, LIS)',
            'Graphs — BFS/DFS/Dijkstra/Union-Find' if tier == 'faang' else 'Heap + Priority Queue problems',
            'Solve 5 Hard problems weekly' if tier == 'faang' else 'Solve 2 Medium problems daily',
        ],

        'data-analyst': [
            'SQL Joins, Subqueries, Window Functions',
            'Aggregations, GROUP BY, HAVING patterns',
            'Python pandas — data cleaning and transformation',
            'Excel: PivotTables, VLOOKUP, advanced formulas',
            'Basic statistics: mean, median, std dev, correlation',
            'BI Tools: Tableau or Power BI — build 2 dashboards',
        ],

        'ml': [
            'Python: NumPy, pandas, scikit-learn refresher',
            'Supervised Learning: Regression, Trees, Ensemble models',
            'Unsupervised Learning: K-Means, PCA',
            'Neural Networks basics + backpropagation intuition',
            'Build 2 end-to-end ML projects (Kaggle datasets)',
            'ML system design: feature engineering + model serving',
        ],

        'devops': [
            'Linux commands and shell scripting',
            'Docker: containers and docker-compose',
            'Kubernetes: pods, services, deployments',
            'CI/CD pipelines (GitHub Actions / Jenkins)',
            'AWS/GCP basics: compute, storage, networking',
            'Infrastructure as Code: Terraform or Ansible',
        ],

        'uiux': [
            'Build 3 UX case studies',
            'Figma components + prototyping',
            'User research and usability testing',
            'Design principles: hierarchy, spacing, typography',
            'Mobile-first responsive design',
            'Launch portfolio site with 3 projects',
        ],

        'consulting': [
            'Case study frameworks: Profitability, Market Entry',
            'Practice 2 cases daily (McKinsey style)',
            'Quantitative aptitude drills',
            'Current affairs + business news (30 min)',
            'Market sizing practice questions',
            'Prepare leadership STAR stories',
        ],
    }

    return tasks.get(role, tasks['sde'])
def get_sd_tasks(role, tier, sd):

    tasks = {
        'sde': [
            'Understand client-server, REST, HTTP basics' if sd <= 2 else 'Design URL Shortener + Pastebin',
            'SQL vs NoSQL trade-offs' if sd <= 2 else 'Design Twitter feed / Instagram',
            'Caching strategies: Redis, CDN, write-through vs write-back',
            'Load balancing, horizontal vs vertical scaling',
            'Design WhatsApp / Uber / Netflix at scale' if tier == 'faang' else 'Design a simple e-commerce backend',
            'CAP theorem, eventual consistency, distributed systems basics',
        ],

        'ml': [
            'ML pipeline design: data ingestion → training → serving',
            'Feature stores and experiment tracking',
            'Real-time vs batch inference patterns',
            'Model monitoring: data drift & concept drift',
            'Vector databases and embeddings',
            'Design recommendation system end-to-end',
        ],

        'devops': [
            'Design CI/CD pipeline for microservices',
            'Kubernetes cluster HA + auto-scaling',
            'Observability: Prometheus + Grafana',
            'Disaster recovery strategies (RTO/RPO)',
            'Security: IAM + secrets management',
            'Cloud cost optimisation strategies',
        ],
    }

    return tasks.get(role, tasks['sde'])