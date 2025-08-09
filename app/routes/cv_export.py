from flask import Blueprint, request, Response, render_template
import pdfkit
import json

cv_bp = Blueprint("cv_bp", __name__)

@cv_bp.route('/cv_preview', methods=['POST'])
def preview_resume():
    print("Rendering resume preview...")
    resume_data = request.get_json()
    # print("Received resume data:", resume_data)
    return render_template('resume_template.html', resume_data=resume_data)


@cv_bp.route('/cv_export', methods=['POST'])
def export_pdf():
    print("Exporting resume as PDF...")
    resume_data = request.get_json()
    print("Received resume data:", resume_data)

    html_string = render_template('resume_template.html', resume_data=resume_data)

    options = {
        'page-size': 'A4',
        'margin-top': '0.5in',
        'margin-right': '0.5in',
        'margin-bottom': '0.5in',
        'margin-left': '0.5in',
        'encoding': "UTF-8",
        'no-outline': None,
        'disable-smart-shrinking': ''
    }

    pdf = pdfkit.from_string(html_string, False, options=options)  # False returns bytes instead of saving to file

    return Response(
        pdf,
        mimetype="application/pdf",
        headers={"Content-Disposition": "attachment; filename=CV.pdf"}
    )