
offers = [
{
"name": "Company A",
"ctc": 12,
"growth": 4,
"wlb": 3,
"layoff": 8,
"bond": 12,
"location": 4
},
{
"name": "Company B",
"ctc": 10,
"growth": 5,
"wlb": 4,
"layoff": 3,
"bond": 24,
"location": 3
}
]

weights = {
"ctc": 5,
"growth": 3,
"wlb": 4,
"layoff": 4,
"bond": 2,
"location": 3
}

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
            s = 1 + n * 4 #scale 1 to 5

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
        reverse
        =True
        )

    top_factor = sorted_factors[0][0]

    return (
    f"{top_offer['name']} ranked highest primarily due to strong "
    f"performance in {top_factor}, which had significant influence "
    f"in the weighted decision model."
    )


#main function
if __name__ == "__main__":
    
    ranked = rank_offers(calculate_scores(offers, weights))

    print("Ranking:")
    for offer in ranked:
        print(f"{offer['name']} : {round(offer['total'], 2)}")

    print("\nExplanation:")
    print(generate_explanation(ranked[0], weights))