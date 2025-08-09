# routes/editor.py
import os
import json
from flask import Blueprint, render_template

editor_bp = Blueprint("editor", __name__)
UPLOAD_FOLDER = "uploads"

# Define the available sections and their display names
AVAILABLE_SECTIONS = {
    "summary": "Summary",
    "experience": "Experience",
    "projects": "Projects",
    "skills": "Skills",
    "certificates": "Certificates",
    "education": "Education",
    "custom": "Custom Section"
}

def transform_to_dynamic_data(static_data):
    """
    Transforms old flat data structure into the new dynamic section-based one.
    """
    if "sections" in static_data:
        # If it's already in the new format, just ensure keys are correct
        for section in static_data.get("sections", []):
            if "items" in section:
                section["entries"] = section.pop("items")
        return static_data

    # Default order for initial transformation from an old `parsed.json`
    section_order = ['summary', 'experience', 'projects', 'skills', 'certificates', 'education']
    
    dynamic_data = {
        "name": static_data.get("name", ""),
        "email": static_data.get("email", ""),
        "phone": static_data.get("phone", ""),
        "location": static_data.get("location", ""),
        "linkedin": static_data.get("linkedin", ""),
        "github": static_data.get("github", ""),
        "website": static_data.get("website", ""),
        "sections": []
    }

    for section_type in section_order:
        if section_type in static_data and static_data[section_type]:
            section_content = static_data[section_type]
            if section_type == 'summary':
                dynamic_data["sections"].append({"type": "summary", "content": section_content})
            else:
                if isinstance(section_content, list) and len(section_content) > 0:
                    # THE FIX IS HERE: Use 'entries' instead of 'items'
                    dynamic_data["sections"].append({"type": section_type, "entries": section_content})

    return dynamic_data


@editor_bp.route("/editor", methods=["GET"])
def editor_page():
    parsed_path = os.path.join(UPLOAD_FOLDER, "parsed.json")
    try:
        with open(parsed_path, "r") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        data = {} # Start with empty data if file doesn't exist or is invalid

    # Transform data to the new structure for the editor
    dynamic_data = transform_to_dynamic_data(data)
    
    return render_template(
        "editor.html", 
        data=dynamic_data, 
        available_sections=AVAILABLE_SECTIONS
    )