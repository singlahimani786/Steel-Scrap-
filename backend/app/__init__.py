from flask import Flask
import os

def create_app():
    app = Flask(__name__)
    os.makedirs('static', exist_ok=True)

    from .routes import upload_route
    app.register_blueprint(upload_route)

    return app
