import re

def clean_json_output(raw_response):
    cleaned = re.sub(r"```json\s*|```", "", raw_response.strip())
    cleaned = cleaned.strip()
    return cleaned