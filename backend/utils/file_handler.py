from ast import Import
import datetime
import os 
import uuid 
from click import File
import magic
from werkzeug.utils import secure_filename
from flask import current_app

class FileUploadError(Exception):
    pass

class AudioFileHandler:
    ALLOWED_EXTENSIONS = {'mp3','wav','m4a','ogg','aac','flac'}

    ALLOWED_MIME_TYPES = {'audio/mpeg','audio/wav','audio/x-m4a','audio/ogg','audio/aac','audio/flac'}

    @staticmethod
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.',1)[1].lower() in AudioFileHandler.ALLOWED_EXTENSIONS

    @staticmethod
    def validate_audio_file(file):
        if not file or file.filename == '':
            raise FileUploadError("No file provided")

        if not AudioFileHandler.allowed_file(file.filename):
            allowed = ', '.join(AudioFileHandler.ALLOWED_EXTENSIONS)
            raise FileUploadError(f"Invalid file extension. Allowed extensions: {allowed}")

        file.seek(0,os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        max_size = current_app.config.get('MAX_AUDIO_SIZE', 16*1024*1024)  # 16 mb default
        if file_size > max_size:
            max_mb = max_size / (1024 * 1024)
            raise FileUploadError(f"File size exceeds the maximum allowed size of {max_mb:.1f} MB")
        
        try:
            file_content = file.read(1024)
            file.seek(0)

            mime_type = magic.from_buffer(file_content,mime = True)

            if mime_type not in AudioFileHandler.ALLOWED_MIME_TYPES:
                raise FileUploadError(f"Invalid file type. Detected Type: {mime_type}")

        except Exception as e:
            current_app.logger.warning(f"MIME type validation failed: {e}")

        return True

    @staticmethod
    def save_audio_file(file):
        AudioFileHandler.validate_audio_file(file)
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"

        upload_path = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        audio_path = os.path.join(upload_path, 'audio')
        os.makedirs(audio_path, exist_ok=True)

        # Save file
        file_path = os.path.join(audio_path, unique_filename)
        file.save(file_path)

        file_size = os.path.getsize(file_path)

        duration=None
        try:
            from pydub import AudioSegment
            audio_segment = AudioSegment.from_file(file_path)
            duration = len(audio_segment)/1000
        
        except ImportError:
            current_app.logger.warning("pydub not installed. Duration calculation skipped")

        except Exception as e:
            current_app.logger.warning(f"Could not calculate audio duration: {e}")

        return {
            'filename':unique_filename,
            'original_filename':file.filename,
            'file_path':file_path,
            'file_size':file_size,
            'duration':duration,
            'content_type':file.content_type,

        }

    @staticmethod
    def delete_audio_file(filename):
        try:
            upload_path = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            file_path = os.path.join(upload_path, 'audio', filename)
            
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            else:
                current_app.logger.warning(f"File not found for deletion: {filename}")
                return False
                
        except Exception as e:
            current_app.logger.error(f"Error deleting file {filename}: {e}")
            return False

    @staticmethod
    def get_audio_file_path(filename):
        """Get full path to audio file"""
        upload_path = current_app.config.get('UPLOAD_FOLDER', 'uploads')
        return os.path.join(upload_path, 'audio', filename)
    
    @staticmethod
    def file_exists(filename):
        """Check if audio file exists on disk"""
        file_path = AudioFileHandler.get_audio_file_path(filename)
        return os.path.exists(file_path)