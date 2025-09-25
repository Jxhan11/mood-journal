"""
Step 5: Audio file upload and management routes
"""

import os
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import RequestEntityTooLarge
from mongoengine import DoesNotExist

from models.user_model import User
from models.mood_model import MoodEntry
from models.audio_model import AudioFile
from utils.file_handler import AudioFileHandler, FileUploadError

# Create Blueprint for audio routes
audio_bp = Blueprint('audio', __name__)

@audio_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_audio():
    """
    Upload audio file for a mood entry
    
    Form data:
    - audio: Audio file
    - entry_id: ID of the mood entry to attach audio to
    - duration: Optional duration in seconds (client-provided)
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
        
        # Check if file is present
        if 'audio' not in request.files:
            return jsonify({
                'error': 'No File',
                'message': 'No audio file provided in request'
            }), 400
        
        audio_file = request.files['audio']
        entry_id = request.form.get('entry_id')
        
        if not entry_id:
            return jsonify({
                'error': 'Missing Entry ID',
                'message': 'entry_id is required'
            }), 400
        
        # Find and validate mood entry
        try:
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
                    'message': 'You can only upload audio to your own mood entries'
                }), 403
            
            # Check if entry already has audio
            if entry.audio_file:
                return jsonify({
                    'error': 'Audio Exists',
                    'message': 'This mood entry already has an audio file. Delete it first or use update.',
                    'existing_audio': entry.audio_file.to_dict()
                }), 409
                
        except DoesNotExist:
            return jsonify({
                'error': 'Entry Not Found',
                'message': 'Mood entry not found'
            }), 404
        
        # Save audio file
        try:
            file_info = AudioFileHandler.save_audio_file(audio_file)
        except FileUploadError as e:
            return jsonify({
                'error': 'File Upload Error',
                'message': str(e)
            }), 400
        
        # Create audio file document
        audio_doc = AudioFile(
            filename=file_info['filename'],
            original_filename=file_info['original_filename'],
            file_size=file_info['file_size'],
            content_type=file_info['content_type'],
            duration=file_info.get('duration')
        )
        
        # Override duration if provided by client (for cases where server can't calculate it)
        client_duration = request.form.get('duration')
        if client_duration:
            try:
                audio_doc.duration = int(client_duration)
            except ValueError:
                pass  # Ignore invalid duration
        
        # Update mood entry with audio file
        entry.audio_file = audio_doc
        entry.save()
        
        current_app.logger.info(f"Audio uploaded for entry: {entry_id}, file: {file_info['filename']}")
        
        return jsonify({
            'message': 'Audio uploaded successfully',
            'audio_file': audio_doc.to_dict(),
            'entry_id': entry_id
        }), 201
        
    except RequestEntityTooLarge:
        return jsonify({
            'error': 'File Too Large',
            'message': 'Audio file exceeds maximum allowed size'
        }), 413
    except Exception as e:
        current_app.logger.error(f"Audio upload error: {e}")
        return jsonify({
            'error': 'Upload Failed',
            'message': 'Unable to upload audio file'
        }), 500

@audio_bp.route('/<filename>', methods=['GET'])
@jwt_required()
def get_audio(filename):
    """
    Serve audio file
    
    Returns the actual audio file for streaming/download
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
        
        # Find mood entry with this audio file
        entry = MoodEntry.objects(audio_file__filename=filename).first()
        
        if not entry:
            return jsonify({
                'error': 'Audio Not Found',
                'message': 'Audio file not found'
            }), 404
        
        # Check ownership
        if entry.user.id != user.id:
            return jsonify({
                'error': 'Access Denied',
                'message': 'You can only access your own audio files'
            }), 403
        
        # Check if file exists on disk
        file_path = AudioFileHandler.get_audio_file_path(filename)
        if not os.path.exists(file_path):
            return jsonify({
                'error': 'File Not Found',
                'message': 'Audio file not found on server'
            }), 404
        
        # Serve file
        return send_file(
            file_path,
            mimetype=entry.audio_file.content_type,
            as_attachment=False,  # Stream instead of download
            download_name=entry.audio_file.original_filename
        )
        
    except Exception as e:
        current_app.logger.error(f"Audio serving error: {e}")
        return jsonify({
            'error': 'Serve Failed',
            'message': 'Unable to serve audio file'
        }), 500

@audio_bp.route('/<filename>', methods=['DELETE'])
@jwt_required()
def delete_audio(filename):
    """Delete audio file"""
    
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({
                'error': 'User Not Found',
                'message': 'User account not found'
            }), 404
        
        # Find mood entry with this audio file
        entry = MoodEntry.objects(audio_file__filename=filename).first()
        
        if not entry:
            return jsonify({
                'error': 'Audio Not Found',
                'message': 'Audio file not found'
            }), 404
        
        # Check ownership
        if entry.user.id != user.id:
            return jsonify({
                'error': 'Access Denied',
                'message': 'You can only delete your own audio files'
            }), 403
        
        # Delete file from disk
        AudioFileHandler.delete_audio_file(filename)
        
        # Remove audio file from entry
        entry.audio_file = None
        entry.save()
        
        current_app.logger.info(f"Audio deleted: {filename}")
        
        return jsonify({
            'message': 'Audio file deleted successfully'
        }), 200
        
    except DoesNotExist:
        return jsonify({
            'error': 'Audio Not Found',
            'message': 'Audio file not found'
        }), 404
    except Exception as e:
        current_app.logger.error(f"Audio deletion error: {e}")
        return jsonify({
            'error': 'Delete Failed',
            'message': 'Unable to delete audio file'
        }), 500

@audio_bp.route('/entry/<entry_id>', methods=['DELETE'])
@jwt_required()
def delete_entry_audio(entry_id):
    """Delete audio file for a specific mood entry"""
    
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({
                'error': 'User Not Found',
                'message': 'User account not found'
            }), 404
        
        # Find mood entry
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
                'message': 'You can only modify your own mood entries'
            }), 403
        
        if not entry.audio_file:
            return jsonify({
                'error': 'No Audio',
                'message': 'This mood entry has no audio file'
            }), 404
        
        # Delete file from disk
        AudioFileHandler.delete_audio_file(entry.audio_file.filename)
        
        # Remove audio file from entry
        entry.audio_file = None
        entry.save()
        
        current_app.logger.info(f"Audio deleted for entry: {entry_id}")
        
        return jsonify({
            'message': 'Audio file deleted successfully'
        }), 200
        
    except DoesNotExist:
        return jsonify({
            'error': 'Entry Not Found',
            'message': 'Mood entry not found'
        }), 404
    except Exception as e:
        current_app.logger.error(f"Entry audio deletion error: {e}")
        return jsonify({
            'error': 'Delete Failed',
            'message': 'Unable to delete audio file'
        }), 500

@audio_bp.route('/info/<filename>', methods=['GET'])
@jwt_required()
def get_audio_info(filename):
    """Get audio file metadata without downloading the file"""
    
    try:
        # Get current user
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        
        if not user:
            return jsonify({
                'error': 'User Not Found',
                'message': 'User account not found'
            }), 404
        
        # Find mood entry with this audio file
        entry = MoodEntry.objects(audio_file__filename=filename).first()
        
        if not entry:
            return jsonify({
                'error': 'Audio Not Found',
                'message': 'Audio file not found'
            }), 404
        
        # Check ownership
        if entry.user.id != user.id:
            return jsonify({
                'error': 'Access Denied',
                'message': 'You can only access your own audio files'
            }), 403
        
        # Return audio file metadata
        return jsonify({
            'audio_file': entry.audio_file.to_dict(),
            'entry_id': entry.id,
            'file_exists': AudioFileHandler.file_exists(filename)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Audio info error: {e}")
        return jsonify({
            'error': 'Info Failed',
            'message': 'Unable to get audio file information'
        }), 500