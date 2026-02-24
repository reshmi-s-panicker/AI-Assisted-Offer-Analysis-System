from flask import Flask, render_template, request, jsonify
from decision_engine import analyze_offers

app = Flask(__name__)

# Default weights
WEIGHTS = {
    "ctc": 5,
    "growth": 3,
    "wlb": 4,
    "layoff": 4,
    "bond": 2,
    "location": 3
}

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json

    offers = data["offers"]

    result = analyze_offers(offers, WEIGHTS)

    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)