import os
import json
from flask import Blueprint, render_template, request, redirect, url_for, flash

from app.services.pdf_parser import extract_text
from app.services.github_parser import get_github_data
from app.services.llm import parse_resume_with_llm

upload_bp = Blueprint("upload", __name__)

UPLOAD_FOLDER = "uploads"

@upload_bp.route("/", methods=["GET", "POST"])
def upload():
    if request.method == "POST":
        resume_file = request.files.get("cv")
        linkedin_file = request.files.get("linkedin")
        github_username = request.form.get("github")
        job_title = request.form.get("job_title")
        experience_level = request.form.get("experience_level")
        # print(f"linked: {linkedin_file}")
        # Validate
        # if not resume_file or not github_username:
        #     flash("All fields are required.")
        #     return redirect('/')

        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        resume_path = os.path.join(UPLOAD_FOLDER, "resume.pdf")
        linkedin_path = os.path.join(UPLOAD_FOLDER, "linkedin.pdf")
        resume_file.save(resume_path)
        resume_text = extract_text(resume_path)

        if not linkedin_file:
            linkedin_text = "No LinkedIn profile provided."
        else:
            print("Extracting text from LinkedIn PDF...")
            linkedin_file.save(linkedin_path)
            linkedin_text = extract_text(linkedin_path)

        if not github_username:
            github_data = "No GitHub username provided."
        else:
            print("Fetching GitHub data...")
            github_data = get_github_data(github_username, isTest=False)

        print("🧾 Running Gemini LLM...")
        # print(f"linked: {linkedin_text}")
        parsed = parse_resume_with_llm(resume_text, github_data, linkedin_text, job_title, experience_level)

        print(parsed)
        parsed_path = os.path.join(UPLOAD_FOLDER, "parsed.json")
        print("📦 Saving parsed JSON to:", parsed_path)


        parsed = json.loads(parsed) if isinstance(parsed, str) else parsed
        with open(parsed_path, "w") as f:
            json.dump(parsed, f)
        print("✅ JSON file saved.")

        return redirect(url_for("editor.editor_page"))

    return render_template("upload.html")
