from datetime import datetime
from flask import Blueprint,request,jsonify,request,current_app
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from marshmallow import ValidationError as MarshmallowValidationError
from models.user_model import User
from schemas.auth_schemas import UserLoginSchema, UserRegistrationSchema
from mongoengine import NotUniqueError,ValidationError as MongoValidationError


auth_bp = Blueprint('auth',__name__)

@auth_bp.route('/signup',methods = ['POST'])
def signup():
    try:
        schema = UserRegistrationSchema()
        data = schema.load(request.get_json())

    except MarshmallowValidationError as e:
        return jsonify({
            'error':'Validation Error',
            'message':'Invalid input data',
            'details':e.messages
        }),400

    try:
        existing_user = User.objects(email = data['email']).first()
        if existing_user:
            return jsonify({
                'error':'User already exists',
                'message':'User with this email already exists'
            }),400
        
        user = User(
            email = data['email'],
            first_name = data['first_name'],
            last_name = data['last_name'],
            password_hash = data['password']
            
        )
        user.set_password(user.password_hash)
        user.save()

        access_token = create_access_token(identity=user.id)
        current_app.logger.info(f"New user registered: {user.email}")
        return jsonify({
            'message':'User created successfully',
            'user':user.to_dict(),
            'access_token':access_token,
            'expires_in':current_app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds()
        }),201

    except NotUniqueError as e:
        return jsonify({
            'error':'Database Error',
            'message':'User with this email already exists'
        }),409

    except Exception as e:
        current_app.logger.error(f"Error registering user: {e}")
        return jsonify({
            'error':'Database Error',
            'message':str(e)
        }),500

@auth_bp.route('/login/',methods = ['POST'])
def login():
    try:
        schema = UserLoginSchema()
        data = schema.load(request.get_json())
    except MarshmallowValidationError as e:
        return jsonify({
            'error':'Validation Error',
            'message':'Invalid input data',
            'details':e.messages
        }),400
    
    try:
        user = User.objects(email = data['email']).first()
        if not user or not user.check_password(data['password']):
            return jsonify({
                'error':'Authentication Error',
                'message':'Invalid email or password'
            }),401
        
        if not user.is_active:
            return jsonify({
                'error':'Authentication Error',
                'message':'User is not active'
            }),403
        
        user.last_login = datetime.now()
        user.save()

        access_token = create_access_token(identity=user.id)
        current_app.logger.info(f"User logged in: {user.email}")
        return jsonify({
            'message':'Login successful',
            'user':user.to_dict(),
            'access_token':access_token,
            'expires_in':current_app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds()
        }),200

    except Exception as e:
        current_app.logger.error(f"Error logging in user: {e}")
        return jsonify({
            'error':'Database Error',
            'message':str(e)
        }),500

@auth_bp.route('/me/',methods = ['GET'])
@jwt_required()
def get_current_user_info():
    try:
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        if not user or not user.is_active:
            return jsonify({
                'valid':False,
                'message':'User not found or is inactive'
            }),401

        return jsonify({
            'valid':True,
            'user':user.to_dict()
        }),200
    except Exception as e:
        current_app.logger.error(f"Error getting current user info: {e}")
        return jsonify({
            'valid':False,
            'error':'Token Error',
            'message':str(e)
        }),401

@auth_bp.route('/logout/',methods = ['POST'])
@jwt_required()
def logout():
    try:
        user_id = get_jwt_identity()
        current_app.logger.info(f"User logged out: {user_id}")
        return jsonify({
            'message':'Logout successful'
        }),200

    except Exception as e:
        current_app.logger.error(f"Error logging out user: {e}")
        return jsonify({
            'error':'Database Error',
            'message':str(e)
        }),500
    


