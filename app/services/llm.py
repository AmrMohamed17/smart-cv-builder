import requests
from app.utils.file_helper import clean_json_output


def parse_resume_with_llm(resume_text, github_text, linkedin_text, job_title, experience_level):
    GEMINI_API_KEY = "AIzaSyDOhkVsVvV55-IHX3nRw2Zp1TynjoYUpF4"
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
    - If the resume lacks a strong professional summary, create a concise and impactful one tailored to the target job title and experience level.

    **ADDITIONAL CRITICAL RULES: Job Title & Experience Level Adaptation**
    - You MUST modify and enhance the extracted content so that:
        1. **Summary**: 
            - Always rewrite or adjust to highlight skills, tools, and accomplishments relevant to `job_title`.
            - Match the tone to `experience_level`:
                - Intern/Entry-Level → use phrases like "knowledgeable in", "comfortable with", "familiar with".
                - Mid-Level → use "experienced in", "proficient with".
                - Senior/Lead → use "expert in", "specialized in", "extensive experience with".
            - Include keywords aligned with the target role for ATS optimization.
        2. **Skills**:
            - Ensure skills are relevant to `job_title` and realistically match `experience_level`.
            - Remove irrelevant or outdated skills unless transferable and in demand for the role.
            - Categorize skills as described below.
        3. **Experience, Projects, Certificates**:
            - Rewrite bullet points to align with `job_title` and `experience_level`.
            - Follow the XYZ formula: "Accomplished X, measured by Y, by doing Z".
            - Adjust scope based on level (e.g., entry-level → learning/contribution focus; senior → leadership/impact focus).

    **CRITICAL RULE: Categorizing Skills**
    - Identify the top 12 most relevant technical skills from the provided text.
    - Group these 12 skills into 3 distinct, relevant categories with a suitable subheader for each (e.g., "Programming Languages", "Web & APIs", "ML & Data Science").
    - Each category should contain 4 skills.

    **CRITICAL RULE: Identifying Certifications & Descriptions**
    - Actively look for certifications that might be misplaced under "Education" or "Experience".
    - If a certificate is found, move it to the `certificates` list.
    - For each certificate, provide a one-sentence description summarizing its core topics. If no description exists, generate one.

    **CRITICAL RULE: Formatting Bullet Points**
    - For fields using bullet points (`responsibilities`, `description`, `achievements`), place the `\\n` newline character ONLY at the end of a complete bullet point.

    **Final Output Format:**
    Return a single, clean, and valid JSON object with these exact field names:

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
        - "technologies": string (comma-separated string of skills for that category)
    - "experience": list of objects, each with:
        - "title": string
        - "company": string
        - "duration": string
        - "responsibilities": string (formatted with `\\n`)
    - "education": list of objects, each with:
        - "degree": string
        - "school": string
        - "year": string
        - "achievements": string (formatted with `\\n`, exclude certifications)
    - "projects": list of objects (max 5, sorted by relevance), each with:
        - "name": string
        - "description": string (formatted with `\\n`)
        - "technologies": string (comma-separated)
        - "duration": string
    - "certificates": list of objects, each with:
        - "name": string
        - "issuer": string
        - "year": string
        - "description": string (two-sentence summary)

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