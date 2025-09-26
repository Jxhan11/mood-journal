from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError as MarshmallowValidationError
from mongoengine import DoesNotExist, ValidationError as MongoValidationError

from models.user_model import User
from models.mood_model import MoodEntry
from schemas.mood_entry_schema import (
    MoodEntryCreateSchema, MoodEntryUpdateSchema, 
    MoodEntryQuerySchema, MoodEntryResponseSchema
)

entries_bp = Blueprint('entires',__name__)

@entries_bp.route('',methods = ['POST'])
@jwt_required()
def create_entry():
    try:
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        if not user:
            return jsonify({
                'error':'User not found',
                'message':'User account not found'
            }),404

        schema = MoodEntryCreateSchema()
        data = schema.load(request.get_json())

    except MarshmallowValidationError as e:
        return jsonify({
            'error':'Validation Error',
            'message':'Invalid input data',
            'details':e.messages
        }),400

    try:
        entry_date = data['entry_date']
        current_app.logger.info(f"Entry date: {entry_date}")
        # existing_entry = MoodEntry.objects(user=user,entry_date=entry_date).first()
        # if existing_entry:
        #     return jsonify({
        #         'error':'Entry already exists',
        #         'message':'An entry for this date already exists'
        #     }),400

        from models.mood_model import Mood
        
        # Create mood embedded document
        mood = Mood(
            emoji=data['mood']['emoji'],
            emotion=data['mood']['emotion']
        )
        
        entry = MoodEntry(
            user=user,
            mood=mood,
            text_note=data.get('text_note'),
            entry_date=entry_date,
            local_id=data.get('local_id'),
            synced=True
        )
        entry.save()
        current_app.logger.info(f"New entry created: {entry.id}")
        
        # Queue background insight generation
        from utils.insight_processor import queue_insight_generation
        queue_insight_generation(entry.id)
        
        return jsonify({
            'message':'Entry created successfully',
            'entry':entry.to_dict()
        }),201
    except MongoValidationError as e:
        return jsonify({
            'error':'Database Validation Error',
            'message':str(e)
        }),400
    except Exception as e:
        current_app.logger.error(f"Error creating entry: {e}")
        return jsonify({
            'error':'Creation Error',
            'message':str(e)
        }),500

@entries_bp.route('',methods = ['GET'])
@jwt_required()
def get_entries():
    try:
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        if not user:
            return jsonify({
                'error':'User not found',
                'message':'User account not found'
            }),404
            
        schema = MoodEntryQuerySchema()
        params = schema.load(request.args)

    except MarshmallowValidationError as e:
        return jsonify({
            'error':'Query Validation Error',
            'message':'Invalid query params',
            'details':e.messages
        }),400
    try:
        entries = MoodEntry.get_user_entries(user,limit=params['limit'],days = params['days'])
        if params['offset']>0:
            entries = entries.skip(params['offset'])

        entries_list = list(entries)
        total_count = MoodEntry.objects(user=user).count()

        entries_data = [entry.to_dict() for entry in entries_list]
        return jsonify({
            'entries':entries_data,
            'pagination':{
                'total':total_count,
                'limit':params['limit'],
                'offset':params['offset'],
                'returned':len(entries_data)
            },
            'filters':{
                'days':params['days']
            }
        }),200
    except Exception as e:
        current_app.logger.error(f"Error getting entries: {e}")
        return jsonify({
            'error':'Query Failed',
            'message':str(e)
        }),500

@entries_bp.route('/<entry_id>', methods=['GET'])
@jwt_required()
def get_entry(entry_id):
    """Get a specific mood entry by ID"""
    
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({
                'error': 'User Not Found',
                'message': 'User account not found'
            }), 404
        
        # Find the entry
        entry = MoodEntry.objects(id=entry_id).first()
        
        if not entry:
            return jsonify({
                'error': 'Entry Not Found',
                'message': 'Mood entry not found'
            }), 404
        
        # Check ownership
        if entry.user.id != user.id:
            return jsonify({
                'error': 'Access Denied',
                'message': 'You can only access your own mood entries'
            }), 403

        return jsonify({
            'entry': entry.to_dict()
        }), 200
        
    except DoesNotExist:
        return jsonify({
            'error': 'Entry Not Found',
            'message': 'Mood entry not found'
        }), 404
    except Exception as e:
        current_app.logger.error(f"Get entry error: {e}")
        return jsonify({
            'error': 'Query Failed',
            'message': 'Unable to retrieve mood entry'
        }), 500

@entries_bp.route('/<entry_id>',methods=['PUT'])
@jwt_required()
def update_entry(entry_id):
    """Update a specific mood entry by ID"""
    
    try:
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()

        schema = MoodEntryUpdateSchema()
        data = schema.load(request.get_json())

        entry = MoodEntry.objects(id=entry_id).first()
        if not entry:
            return jsonify({
                'error':'Entry not found',
                'message':'Mood entry not found'
            }),404

        if entry.user.id != user.id:
            return jsonify({
                'error':'Access denied',
                'message':'You can only update your own mood entries'
            }),403
        
        for field,value in data.items():
            setattr(entry,field,value)

        entry.save()
        current_app.logger.info(f"Entry updated: {entry.id}")
        return jsonify({
            'message':'Entry updated successfully',
            'entry':entry.to_dict()
        }),200

    except MarshmallowValidationError as e:
        return jsonify({
            'error':'Validation Error',
            'message':'Invalid input data',
            'details':e.messages
        }),400
        
    except DoesNotExist:
        return jsonify({
            'error':'Entry not found',
            'message':'Mood entry not found'
        }),404
    except Exception as e:
        current_app.logger.error(f"Update entry error: {e}")
        return jsonify({
            'error': 'Update Failed',
            'message': 'Unable to update mood entry'
        }), 500

@entries_bp.route('/<entry_id>', methods=['DELETE'])
@jwt_required()
def delete_entry(entry_id):
    """Delete a mood entry"""
    
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({
                'error': 'User Not Found',
                'message': 'User account not found'
            }), 404
        
        # Find the entry
        entry = MoodEntry.objects(id=entry_id).first()
        
        if not entry:
            return jsonify({
                'error': 'Entry Not Found',
                'message': 'Mood entry not found'
            }), 404
        # Check ownership
        if entry.user.id != user.id:
            return jsonify({
                'error': 'Access Denied',
                'message': 'You can only delete your own mood entries'
            }), 403
        
        # Delete the entry
        entry.delete()
        
        current_app.logger.info(f"Mood entry deleted: {entry_id}")
        
        return jsonify({
            'message': 'Mood entry deleted successfully'
        }), 200
        
    except DoesNotExist:
        return jsonify({
            'error': 'Entry Not Found',
            'message': 'Mood entry not found'
        }), 404
    except Exception as e:
        current_app.logger.error(f"Delete entry error: {e}")
        return jsonify({
            'error': 'Delete Failed',
            'message': 'Unable to delete mood entry'
        }), 500


@entries_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_mood_stats():
    """Get mood statistics for the current user"""
    
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({
                'error': 'User Not Found',
                'message': 'User account not found'
            }), 404
        
        # Get entries from last 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        entries = MoodEntry.objects(
            user=user,
            entry_date__gte=thirty_days_ago
        ).order_by('-entry_date')
        if not entries:
            return jsonify({
                'stats': {
                    'total_entries': 0,
                    'average_mood': None,
                    'mood_distribution': {},
                    'recent_trend': 'No data'
                }
            }), 200
        
        # Calculate statistics
        emotions = [entry.mood.emotion if entry.mood else "neutral" for entry in entries]
        total_entries = len(emotions)
        
        # Map emotions to mood scores for average calculation
        emotion_scores = {
            'happy': 5,
            'neutral': 3, 
            'sad': 2,
            'angry': 1,
            'anxious': 2
        }
        mood_scores = [emotion_scores.get(emotion, 3) for emotion in emotions]
        average_mood = sum(mood_scores) / total_entries if total_entries > 0 else 0

        # Mood distribution by emotion
        emotion_types = ['happy', 'sad', 'neutral', 'angry', 'anxious']
        mood_distribution = {emotion: emotions.count(emotion) for emotion in emotion_types}
        
        # Recent trend (last 7 vs previous 7 days)
        recent_trend = "stable"
        if total_entries >= 7:
            recent_7 = mood_scores[:7]
            previous_7 = mood_scores[7:14] if len(mood_scores) >= 14 else []
            
            if previous_7:
                recent_avg = sum(recent_7) / len(recent_7)
                previous_avg = sum(previous_7) / len(previous_7)
                
                if recent_avg > previous_avg + 0.5:
                    recent_trend = "improving"
                elif recent_avg < previous_avg - 0.5:
                    recent_trend = "declining"
        
        return jsonify({
            'stats': {
                'total_entries': total_entries,
                'average_mood': round(average_mood, 1),
                'mood_distribution': mood_distribution,
                'recent_trend': recent_trend,
                'period': '30 days'
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Get stats error: {e}")
        return jsonify({
            'error': 'Stats Failed',
            'message': 'Unable to calculate mood statistics'
        }), 500

        

    

        
        