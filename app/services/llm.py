import requests
from app.utils.file_helper import clean_json_output
from os import getenv


def parse_resume_with_llm(resume_text, github_text, linkedin_text, job_title, experience_level):
    GEMINI_API_KEY = getenv("GEMINI_API_KEY")  
    if not GEMINI_API_KEY:
        raise ValueError("❌ GEMINI_API_KEY not found in environment variables")
        
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

 
    prompt = f"""
    You are an expert resume parser and data enhancement specialist. Your task is to meticulously extract, merge, and structure resume information from the provided texts into a precise JSON format — while tailoring the result to a given job title and experience level.

    You are given:
    1. Raw resume text.
    2. GitHub repository data (optional, as context).
    3. LinkedIn profile text (optional, as context).
    4. Target job_title: "{job_title}"
    5. Target experience_level: "{experience_level}" (Intern, Junior, Mid, Senior)

    **Your Core Job:**
    - Parse and extract structured information from all provided sources.
    - Intelligently merge the data. The resume text is the primary source of truth.
    - Avoid duplicating information.
    - If the resume lacks a strong professional summary, create a concise and impactful one (2-3 sentences) tailored to the target job title and experience level.

    **ADDITIONAL CRITICAL RULES: Job Title & Experience Level Adaptation**
    - You MUST modify and enhance the extracted content so that:
        1. **Summary**: Rewrite or adjust to highlight skills, tools, and accomplishments relevant to `job_title`. Match the tone to `experience_level` (e.g., "knowledgeable in" for Intern, "proficient with" for Mid-level).
        2. **Skills**: Ensure skills are relevant to `job_title` and realistically match `experience_level`.
        3. **Experience, Projects, certificates**: Rewrite bullet points to align with `job_title` and `experience_level`. Focus on the XYZ formula: "Accomplished X, measured by Y, by doing Z".

    **CRITICAL RULE: Categorizing Skills**
    - Identify the top 20 most relevant technical skills from the provided text and the target job title and experience level.
    - Group these skills into 3-6 distinct, relevant categories with a suitable subheader for each (e.g., "Programming Languages", "ML & Data Science", etc..).
    - Each category must contain 4-6 skills.

    **CRITICAL RULE: Formatting Bullet Points**
    - For fields using bullet points (`responsibilities`, `description`, `achievements`), place the `\\n` newline character ONLY at the end of a complete bullet point. Do not start with it.

    **Final Output Format:**
    Return a single, clean, and valid JSON object with these exact field names. Pay close attention to the new date and link fields.

    - "name": string
    - "email": string
    - "phone": string
    - "location": string
    - "linkedin": string
    - "github": string
    - "website": string
    - "summary": string
    - "skills": list of objects, each with:
        - "category": string
        - "technologies": string (comma-separated string of skills)
    - "experience": list of objects, each with:
        - "title": string
        - "company": string
        - "date_from": string (e.g., "Jun 2022")
        - "date_to": string (e.g., "Present" or "Aug 2023")
        - "responsibilities": string (formatted with `\\n`)
    - "education": list of objects, each with:
        - "degree": string
        - "school": string
        - "date_from": string (e.g., "Aug 2018")
        - "date_to": string (e.g., "May 2022")
        - "achievements": string (formatted with `\\n`, exclude certifications)
    - "projects": list of objects (max 5, sorted by relevance), each with:
        - "name": string
        - "date_from": string (e.g., "May 2024")
        - "date_to": string (e.g., "Present")
        - "link": string (URL to the project if available, otherwise null)
        - "description": string (formatted with `\\n`)
    - "certificates": list of objects, each with:
        - "name": string
        - "issuer": string
        - "year": string (A single year, e.g., "2023". If a range is given like 2022-2023, use the end year "2023".)
        - "description": string (two-sentences summary)

    **Input Data:**

    Resume Text:
    \"\"\" 
    {resume_text}
    \"\"\"

    GitHub Repositories:
    \"\"\" 
    {github_text}
    \"\"\"

    LinkedIn Profile Text:
    \"\"\" 
    {linkedin_text}
    \"\"\"

    Respond ONLY with the JSON output. If a field is not found, return null or an empty list/string.
    """
   # 
   
    body = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "temperature": 0.5,
            "maxOutputTokens": 2048
        }
    }

    response = requests.post(endpoint, json=body)

    try:
        data = response.json()
        return clean_json_output(data['candidates'][0]['content']['parts'][0]['text'])
    except Exception as e:
        print("❌ Failed to parse Gemini response:", e)
        print("📦 Raw Response Text:", response.text)
        raise e

