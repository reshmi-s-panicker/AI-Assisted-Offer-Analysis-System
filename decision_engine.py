
#Generic min-max normalization function
def normalize(values, invert=False):
    min_v = min(values)
    max_v = max(values)

    scores = []

    for v in values:
        if max_v == min_v:
            s = 3 #neutral score
        else:
            n = (v - min_v) / (max_v - min_v)
            if invert:
                n = 1 - n #invert the score
            s = 1 + n * 4 #scale 1 to 5p

        scores.append(s)

    return scores


#normalize the numeric fields
def normalize_nums(offers):
    ctc_vals=[offer["ctc"] for offer in offers]
    layoff_vals=[offer["layoff"] for offer in offers]
    bond_vals=[offer["bond"] for offer in offers]

    ctc_scores=normalize(ctc_vals)
    layoff_scores=normalize(layoff_vals, invert=True)
    bond_scores=normalize(bond_vals, invert=True)

    for i, offer in enumerate(offers):
        offer["ctc_s"] = ctc_scores[i]
        offer["layoff_s"] = layoff_scores[i]
        offer["bond_s"] = bond_scores[i]

    return offers

#calculate the scores
def calculate_scores(offers, weights):
    offers = normalize_nums(offers)

    for offer in offers:
        score_map = {
        "ctc": offer["ctc_s"],
        "growth": offer["growth"],
        "wlb": offer["wlb"],
        "layoff": offer["layoff_s"],
        "bond": offer["bond_s"],
        "location": offer["location"]
        }

        total = 0

        for criterion, weight in weights.items():
            total += score_map[criterion] * weight

        offer["total"] = total

    return offers


#rank the offers
def rank_offers(offers):
    return sorted(offers, key=lambda offer: offer["total"], reverse=True)

# Generate the explanation
def generate_explanation(top_offer, weights):
    contributions = {}

    score_map = {
    "ctc": top_offer["ctc_s"],
    "growth": top_offer["growth"],
    "wlb": top_offer["wlb"],
    "layoff": top_offer["layoff_s"],
    "bond": top_offer["bond_s"],
    "location": top_offer["location"]
    }

    for criterion, weight in weights.items():
        contributions[criterion] = score_map[criterion] * weight

    sorted_factors = sorted(
    contributions.items(),
    key=lambda item: item[1],
    reverse = True
    )

    top_factor = sorted_factors[0][0]

    return (
    f"{top_offer['name']} ranked highest primarily due to strong "
    f"performance in {top_factor}, which had significant influence "
    f"in the weighted decision model."
    )
#wrapper function
def analyze_offers(offers, weights):

    if not offers:
        return {
            "ranking": [],
            "explanation": "No offers provided."
        }

    scored = calculate_scores(offers, weights)
    ranked = rank_offers(scored)
    explanation = generate_explanation(ranked[0], weights)

    return {
        "ranking": ranked,
        "explanation": explanation
    }