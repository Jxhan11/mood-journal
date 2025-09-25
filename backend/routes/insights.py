"""
Step 6: AI insights routes
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from mongoengine import DoesNotExist
from datetime import datetime, timedelta

from models.user_model import User
from models.mood_model import MoodEntry
from utils.ai_service import MoodInsightAI, AIServiceError

# Create Blueprint for insights routes
insights_bp = Blueprint('insights', __name__)

@insights_bp.route('/entry/<entry_id>', methods=['GET'])
@jwt_required()
def get_entry_insight(entry_id):
    """
    Get AI-generated insight for a specific mood entry
    Will generate insight if not already processed
    """
    
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({
                'error': 'User Not Found',
                'message': 'User account not found'
            }), 404
        
        # Find the mood entry
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
                'message': 'You can only access insights for your own mood entries'
            }), 403
        
        # Return existing insight if available
        if entry.ai_processed and entry.ai_insight:
            return jsonify({
                'insight': entry.ai_insight,
                'processed': True,
                'processed_at': entry.ai_processed_at.isoformat() if entry.ai_processed_at else None,
                'entry_id': entry_id
            }), 200
        
        # Check if processing failed previously
        if entry.ai_processing_failed:
            return jsonify({
                'insight': None,
                'processed': False,
                'failed': True,
                'error_message': entry.ai_error_message,
                'entry_id': entry_id
            }), 200
        
        # Check if entry has content for AI analysis
        if not entry.has_content_for_ai():
            return jsonify({
                'insight': 'No content available for insight generation. Please add a text note or voice recording.',
                'processed': True,
                'entry_id': entry_id
            }), 200
        
        # Generate insight
        try:
            ai_service = MoodInsightAI()
            
            if not ai_service.is_available():
                return jsonify({
                    'error': 'AI Service Unavailable',
                    'message': 'AI insights are currently unavailable. Please try again later.'
                }), 503
            
            # Generate the insight
            insight = ai_service.generate_insight(
                mood_emotion=entry.mood.emotion if entry.mood else "neutral",
                mood_emoji=entry.mood.emoji if entry.mood else "😐",
                text_note=entry.text_note,
                audio_transcript="[Voice note recorded]" if entry.audio_file else None
            )
            
            # Save the insight
            entry.mark_ai_processing_complete(insight)
            
            current_app.logger.info(f"AI insight generated for entry: {entry_id}")
            
            return jsonify({
                'insight': insight,
                'processed': True,
                'processed_at': entry.ai_processed_at.isoformat(),
                'entry_id': entry_id
            }), 200
            
        except AIServiceError as e:
            # Mark as failed and return error
            entry.mark_ai_processing_failed(str(e))
            
            return jsonify({
                'error': 'AI Processing Failed',
                'message': str(e),
                'entry_id': entry_id
            }), 500
        
    except DoesNotExist:
        return jsonify({
            'error': 'Entry Not Found',
            'message': 'Mood entry not found'
        }), 404
    except Exception as e:
        current_app.logger.error(f"Get insight error: {e}")
        return jsonify({
            'error': 'Insight Failed',
            'message': 'Unable to generate or retrieve insight'
        }), 500

@insights_bp.route('/entry/<entry_id>/regenerate', methods=['POST'])
@jwt_required()
def regenerate_entry_insight(entry_id):
    """Force regenerate AI insight for a mood entry"""
    
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({
                'error': 'User Not Found',
                'message': 'User account not found'
            }), 404
        
        # Find the mood entry
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
                'message': 'You can only regenerate insights for your own mood entries'
            }), 403
        
        # Check if entry has content for AI analysis
        if not entry.has_content_for_ai():
            return jsonify({
                'error': 'No Content',
                'message': 'Entry needs text note or voice recording for insight generation'
            }), 400
        
        try:
            ai_service = MoodInsightAI()
            
            if not ai_service.is_available():
                return jsonify({
                    'error': 'AI Service Unavailable',
                    'message': 'AI insights are currently unavailable'
                }), 503
            
            # Reset processing status and regenerate
            entry.reset_ai_processing()
            
            insight = ai_service.generate_insight(
                mood_emotion=entry.mood.emotion if entry.mood else "neutral",
                mood_emoji=entry.mood.emoji if entry.mood else "😐",
                text_note=entry.text_note,
                audio_transcript="[Voice note recorded]" if entry.audio_file else None
            )
            
            # Save the new insight
            entry.mark_ai_processing_complete(insight)
            
            current_app.logger.info(f"AI insight regenerated for entry: {entry_id}")
            
            return jsonify({
                'insight': insight,
                'processed': True,
                'processed_at': entry.ai_processed_at.isoformat(),
                'regenerated': True,
                'entry_id': entry_id
            }), 200
            
        except AIServiceError as e:
            entry.mark_ai_processing_failed(str(e))
            
            return jsonify({
                'error': 'AI Processing Failed',
                'message': str(e),
                'entry_id': entry_id
            }), 500
        
    except DoesNotExist:
        return jsonify({
            'error': 'Entry Not Found',
            'message': 'Mood entry not found'
        }), 404
    except Exception as e:
        current_app.logger.error(f"Regenerate insight error: {e}")
        return jsonify({
            'error': 'Regeneration Failed',
            'message': 'Unable to regenerate insight'
        }), 500

@insights_bp.route('/weekly', methods=['GET'])
@jwt_required()
def get_weekly_summary():
    """Get AI-generated weekly mood summary"""
    
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({
                'error': 'User Not Found',
                'message': 'User account not found'
            }), 404
        
        # Get entries from last 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        entries = MoodEntry.objects(
            user=user,
            entry_date__gte=seven_days_ago
        ).order_by('-entry_date')
        
        if not entries:
            return jsonify({
                'summary': 'No mood entries found for the past week. Start logging your daily mood to get personalized insights!',
                'entries_count': 0,
                'period': '7 days'
            }), 200
        
        try:
            ai_service = MoodInsightAI()
            print("Hello")
            current_app.logger.info(f"Generating weekly summary for user: {user.email}")
            if not ai_service.is_available():
                return jsonify({
                    'error': 'AI Service Unavailable',
                    'message': 'AI insights are currently unavailable'
                }), 503
            
            # Generate weekly summary
            summary = ai_service.generate_weekly_summary(list(entries))
            
            return jsonify({
                'summary': summary,
                'entries_count': len(entries),
                'period': '7 days',
                'generated_at': datetime.utcnow().isoformat()
            }), 200
            
        except AIServiceError as e:
            return jsonify({
                'error': 'AI Processing Failed',
                'message': str(e)
            }), 500
        
    except Exception as e:
        current_app.logger.error(f"Weekly summary error: {e}")
        return jsonify({
            'error': 'Summary Failed',
            'message': 'Unable to generate weekly summary',
            'details': str(e)
        }), 500

@insights_bp.route('/batch', methods=['POST'])
@jwt_required()
def get_batch_insights():
    """Get insights for multiple entries at once"""
    
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({
                'error': 'User Not Found',
                'message': 'User account not found'
            }), 404
        
        # Validate request
        if not request.json or 'entry_ids' not in request.json:
            return jsonify({
                'error': 'Missing Entry IDs',
                'message': 'entry_ids array is required'
            }), 400
        
        entry_ids = request.json['entry_ids']
        
        if not isinstance(entry_ids, list) or len(entry_ids) > 20:
            return jsonify({
                'error': 'Invalid Request',
                'message': 'entry_ids must be an array with maximum 20 entries'
            }), 400
        
        insights = []
        
        for entry_id in entry_ids:
            try:
                entry = MoodEntry.objects(id=entry_id).first()
                
                if not entry or entry.user.id != user.id:
                    insights.append({
                        'entry_id': entry_id,
                        'error': 'Entry not found or access denied'
                    })
                    continue
                
                insight_data = {
                    'entry_id': entry_id,
                    'insight': entry.ai_insight,
                    'processed': entry.ai_processed,
                    'failed': entry.ai_processing_failed,
                    'processed_at': entry.ai_processed_at.isoformat() if entry.ai_processed_at else None
                }
                
                if entry.ai_processing_failed:
                    insight_data['error_message'] = entry.ai_error_message
                
                insights.append(insight_data)
                
            except Exception as e:
                insights.append({
                    'entry_id': entry_id,
                    'error': str(e)
                })
        
        return jsonify({
            'insights': insights,
            'total': len(insights)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Batch insights error: {e}")
        return jsonify({
            'error': 'Batch Failed',
            'message': 'Unable to get batch insights'
        }), 500

@insights_bp.route('/status', methods=['GET'])
@jwt_required()
def get_ai_status():
    """Get AI service status and user's insight statistics"""
    
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({
                'error': 'User Not Found',
                'message': 'User account not found'
            }), 404
        
        # Test AI service
        ai_service = MoodInsightAI()
        ai_available, ai_message = ai_service.test_connection()
        
        # Get user's insight statistics
        total_entries = MoodEntry.objects(user=user).count()
        processed_entries = MoodEntry.objects(user=user, ai_processed=True).count()
        failed_entries = MoodEntry.objects(user=user, ai_processing_failed=True).count()
        pending_entries = MoodEntry.objects(user=user, ai_processed=False, ai_processing_failed=False).count()
        
        return jsonify({
            'ai_service': {
                'available': ai_available,
                'status': ai_message
            },
            'user_stats': {
                'total_entries': total_entries,
                'processed_insights': processed_entries,
                'failed_insights': failed_entries,
                'pending_insights': pending_entries,
                'processing_rate': round((processed_entries / total_entries * 100), 1) if total_entries > 0 else 0
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"AI status error: {e}")
        return jsonify({
            'error': 'Status Check Failed',
            'message': 'Unable to check AI service status'
        }), 500