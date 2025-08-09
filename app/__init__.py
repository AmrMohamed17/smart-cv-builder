from flask import Flask

def create_app():
    print("🔧 Initializing Flask app...")
    app = Flask(__name__)
    app.secret_key = "your_secret"

    from .routes.upload import upload_bp
    from .routes.editor import editor_bp
    from .routes.cv_export import cv_bp

    app.register_blueprint(upload_bp)
    app.register_blueprint(editor_bp)
    app.register_blueprint(cv_bp)

    return app