from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import NoTranscriptFound, TranscriptsDisabled
from urllib.parse import urlparse, parse_qs

app = Flask(__name__)
CORS(app)

# ✅ Extract YouTube Video ID from any link
def extract_video_id(url):
    parsed_url = urlparse(url)
    if parsed_url.hostname == "youtu.be":
        return parsed_url.path[1:]
    if parsed_url.hostname in ["www.youtube.com", "youtube.com"]:
        return parse_qs(parsed_url.query).get("v", [None])[0]
    return None

@app.route("/", methods=["GET"])
def home():
    return "🎉 YouNote Backend is Running!"

# ✅ Transcript API Route
@app.route("/api/transcript", methods=["POST"])
def get_transcript():
    try:
        data = request.get_json()
        youtube_url = data.get("url")
        video_id = extract_video_id(youtube_url)

        if not video_id:
            return jsonify({"error": "Invalid YouTube URL"}), 400

        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
        except (NoTranscriptFound, TranscriptsDisabled):
            return jsonify({"error": "No transcript available for this video."}), 400

        # ✅ Chunk transcript into note blocks
        notes = []
        chunk = ""
        last_time = 0

        for entry in transcript:
            chunk += entry["text"] + " "
            if entry["start"] - last_time > 15:
                notes.append(chunk.strip())
                chunk = ""
                last_time = entry["start"]

        if chunk:
            notes.append(chunk.strip())

        return jsonify({"notes": notes})

    except Exception as e:
        print("❌ Error:", str(e))
        return jsonify({"error": "Something went wrong on the server"}), 500

if __name__ == "__main__":
    app.run(debug=True)
