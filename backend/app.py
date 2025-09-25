from flask import Flask,jsonify,request
from datetime import datetime
import os
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager
from routes.auth import auth_bp
from routes.entries import entries_bp
from routes.audio import audio_bp
from routes.insights import insights_bp
from config import config
from models.user_model import User
from flask_cors import CORS
from mongoengine import connect, disconnect, ValidationError as MongoValidationError


load_dotenv()



def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV','development')

    app = Flask(__name__)

    app.config.from_object(config[config_name])
    config[config_name].init_app(app)


    init_extentions(app)
    register_blueprints(app)
    # register_routes(app)
    register_error_handlers(app)

    return app

def init_extentions(app):
    CORS(app,origins = app.config['CORS_ORIGINS'])

    jwt = JWTManager(app)

    @jwt.user_identity_loader
    def user_identity_lookup(user_id):
        return user_id

    @jwt.user_lookup_loader
    def user_lookup_callback(jwt_header,jwt_payload):
        user_id = jwt_payload['sub']
        return User.objects(id=user_id).first()


    @jwt.expired_token_loader
    def expired_token_callback(_jwt_header,_jwt_payload):
        return jsonify({
            'error':'Token has expired',
            'message':'The token has expired'
        }),401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        """Handle invalid tokens"""
        return jsonify({
            'error': 'Invalid Token',
            'message': 'The provided token is invalid or malformed.'
        }), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        """Handle missing tokens"""
        return jsonify({
            'error': 'Authorization Required',
            'message': 'This endpoint requires authentication. Please provide a valid token.'
        }), 401



    try:
        connect(
            host = app.config['MONGODB_URI'],
        )
        app.logger.info(f"Connected to MongoDB: {app.config['MONGODB_DB']}")
    except Exception as e:
        app.logger.error(f"Error connecting to MongoDB: {e}")

def register_blueprints(app):
    app.register_blueprint(auth_bp,url_prefix='/auth')
    app.register_blueprint(entries_bp,url_prefix='/api/entries')
    app.register_blueprint(audio_bp,url_prefix='/api/audio')
    app.register_blueprint(insights_bp,url_prefix='/api/insights')
    @app.route('/test')
    def simple_test():
        return "Hello World!"

    @app.route('/')
    def home():
        return jsonify({
            'message': 'Mood Journal API',
            'status': 'JWT Authentication Ready',
            'timestamp': datetime.now().isoformat(),
            'endpoints': {
                'auth': {
                    'signup': 'POST /api/auth/signup',
                    'login': 'POST /api/auth/login',
                    'me': 'GET /api/auth/me (requires token)',
                    'verify': 'POST /api/auth/verify (requires token)',
                    'logout': 'POST /api/auth/logout (requires token)'
                }
            }
        })

    @app.route('/health/')
    def health_check():
        try:
            user_count = User.objects.count()
            db_status = 'connected'

        except Exception as e:
            user_count = None
            db_status = f"error: {e}"

        return jsonify({
            'status': 'healthy',
            'timestamp' : datetime.now().isoformat(),
            'database':{
                'status':db_status,
                'users_count':user_count
            }
        })

    @app.route('/users/',methods = ['GET'])
    def list_users():
        try:
            users = User.objects.all()
            return jsonify({
                'users':[user.to_dict() for user in users],
                'total': len(users)
            })
        except Exception as e:
            return jsonify({
                'error':'Database Error',
                'message':str(e)
            }),500

def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error':'Not Found',
            'message':'The requested resource was not found'
        }),404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'error':'Internal Server Error',
            'message':'An unexpected error occurred'
        }),500
        


if __name__=='__main__':
    app = create_app()
    app.run(host='0.0.0.0',port=8000,debug=True)