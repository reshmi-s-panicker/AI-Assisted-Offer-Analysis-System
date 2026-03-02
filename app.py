import re

from flask import Flask, render_template, request, jsonify
from decision_engine import analyze_offers
from placement.readiness_calculator import build_readiness
from placement.risk_assessor import calc_risk
from placement.strategy_generator import build_plan
from placement.roadmap_builder import build_phases
from placement.task_pool_builder import build_task_pool
from placement.day_task_generator import get_day_tasks
from placement.application_tracker import (
    add_application,
    get_all_applications,
    delete_application
)
app = Flask(__name__)

# Default weights
WEIGHTS = {
    "ctc": 25,
    "growth": 28,
    "wlb": 20,
    "layoff": 15,
    "bond": 10,
    "location": 12
}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/offeriq")
def offeriq():
    return render_template("offeriq.html")

@app.route("/placement")
def placement():
    return render_template("placement.html")

@app.route("/resume")
def resume():
    return render_template("resume.html")

@app.route("/interview")
def interview():
    return render_template("interview.html")
@app.route("/analyze", methods=["POST"])
def analyze():
    data   = request.json
    offers = data["offers"]

    # Backend validation for layoff rate
    for offer in offers:
        layoff = offer.get("layoff", 0)
        try:
            layoff = float(layoff)
        except (ValueError, TypeError):
            return jsonify({ "error": f"Invalid layoff rate for '{offer.get('name', 'unknown')}'" }), 400

        if layoff < 0 or layoff > 100:
            return jsonify({
                "error": f"Layoff rate for '{offer.get('name')}' is {layoff}%. Must be between 0 and 100."
            }), 400

    result = analyze_offers(offers, WEIGHTS)
    return jsonify(result)

@app.route("/test-score")
def test_score():

    readiness = build_readiness(
        tier="service",
        role="sde",
        dsa=2,
        sd=2,
        comm=5,
        res=5
    )

    return jsonify(readiness)
@app.route("/test-risk")
def test_risk():

    days = 16
    tier = "faang"
    dsa = 2
    sd = 2

    readiness = build_readiness(
        tier="faang",
        role="sde",
        dsa=dsa,
        sd=sd,
        comm=5,
        res=5
    )

    risk = calc_risk(days, tier, dsa, sd, readiness["overall"])

    return jsonify({
        "readiness": readiness,
        "risk": risk
    })



@app.route("/test-strategy")
def test_strategy():

    result = build_plan(
        days=16,
        tier="faang",
        role="sde",
        dsa=2,
        sd=2,
        comm=5,
        res=5,
        placement_type="On-Campus",
        ctc="5-10 LPA"
    )

    return jsonify(result)


@app.route("/test-roadmap")
def test_roadmap():

    strategy = build_plan(
        days=16,
        tier="faang",
        role="sde",
        dsa=2,
        sd=2,
        comm=5,
        res=5,
        placement_type="On-Campus",
        ctc="5-10 LPA"
    )

    roadmap = build_phases(
        days=16,
        mode=strategy["mode"],
        tier="faang",
        role="sde",
        dsa=2,
        sd=2,
        alloc=strategy["alloc"]
    )

    return jsonify({
        "mode": strategy["mode"],
        "roadmap": roadmap
    })
@app.route("/test-taskpool")
def test_taskpool():

    pool = build_task_pool(
        tier="faang",
        role="sde",
        dsa=2,
        sd=2,
        res=3,
        comm=2
    )

    return jsonify(pool)
@app.route("/test-day")
def test_day():

    days = 16

    strategy = build_plan(
        days=days,
        tier="faang",
        role="sde",
        dsa=2,
        sd=2,
        comm=3,
        res=3,
        placement_type="On-Campus",
        ctc="5-10"
    )

    roadmap = build_phases(
        days=days,
        mode=strategy["mode"],
        tier="faang",
        role="sde",
        dsa=2,
        sd=2,
        alloc=strategy["alloc"]
    )

    pool = build_task_pool(
        tier="faang",
        role="sde",
        dsa=2,
        sd=2,
        res=3,
        comm=3
    )

    day_tasks = get_day_tasks(
        day=3,
        days=days,
        phases=roadmap,
        res=3,
        task_pool=pool
    )

    return jsonify({
        "mode": strategy["mode"],
        "day": 3,
        "tasks": day_tasks
    })




@app.route("/add_application", methods=["POST"])
def add_app():
    data = request.json
    return jsonify(add_application(data))


@app.route("/get_applications", methods=["GET"])
def get_apps():
    return jsonify(get_all_applications())




@app.route("/delete_application", methods=["POST"])
def delete_app():
    data = request.json
    return jsonify(delete_application(data["id"]))


@app.route("/generate_placement_strategy", methods=["POST"])
def generate_placement_strategy():

    data = request.json

    # INPUT FROM UI-
    days = int(data["days"])
    if days < 1:
      return jsonify({ "error": "Days must be at least 1." }), 400
    
    tier = data["tier"]
    role = data["role"]
    dsa = int(data["dsa_level"])
    sd = int(data["sd_level"])
    comm = int(data["comm_level"])
    resume = int(data["resume_level"])
    placement_type = data["placement_type"]
    ctc_range = data["ctc_range"]

    #STRATEGY 
    strategy = build_plan(
        days, tier, role,
        dsa, sd, comm, resume,
        placement_type, ctc_range
    )

    #READINESS
    readiness = strategy["readiness"]

    # RISK
    risk = strategy["risk"]

    # RESPONSE
    return jsonify({
        "days": days,
        "mode": strategy["mode"],
        "modeLabel": strategy["modeLabel"],
        "modeDesc": strategy["modeDesc"],
        "modeIcon": strategy["modeIcon"],
        "modeColor": strategy["modeColor"],
        "phases": strategy["phases"],
        "readiness": readiness,
        "risk": risk,
        "taskPool": strategy["taskPool"],
        "res": resume
    })

@app.route("/get_day_tasks", methods=["POST"])
def get_day_tasks_api():

    data = request.json

    tasks = get_day_tasks(
        day=data["day"],
        days=data["days"],
        phases=data["phases"],
        res=data["res"],
        task_pool=data["taskPool"]
    )

    return jsonify(tasks)
    


if __name__ == "__main__":
    app.run(debug=True)