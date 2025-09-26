from mongoengine import CASCADE, Document, StringField, IntField, ReferenceField, DateTimeField, BooleanField, EmbeddedDocumentField, EmbeddedDocument
from datetime import datetime
import uuid
from models.user_model import User
from models.audio_model import AudioFile

class Mood(EmbeddedDocument):
    emoji = StringField(required=True, max_length=10)
    emotion = StringField(required=True, choices=['happy', 'sad', 'neutral', 'angry', 'anxious'])

class MoodEntry(Document):
    id = StringField(primary_key=True,default=lambda:str(uuid.uuid4()))
    user = ReferenceField(User,required=True,reverse_delete_rule=CASCADE)
    mood = EmbeddedDocumentField(Mood, required=True)

    text_note = StringField(max_length=2000)
    audio_file = EmbeddedDocumentField(AudioFile)

    ai_insight = StringField(max_length=1000)  # Generated AI insight
    ai_processed = BooleanField(default=False)  # Whether AI processing is complete
    ai_processing_failed = BooleanField(default=False)  # Whether AI processing failed
    ai_error_message = StringField()  # Error message if AI processing failed
    ai_processed_at = DateTimeField()  # When AI processing completed

    entry_date = DateTimeField(required=True)
    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)

    local_id = StringField()
    synced = BooleanField(default=True)

    meta = {
        'collection':'mood_entries',
        'indexes':[
            'user',
            'entry_date',
            'created_at',
            'ai_processed',
            ('user','ai_processed'),
            ('user','entry_date'),
            ('user','created_at')
        ]
    }

    def to_dict(self,include_audio_url=False):
        data = {
            'id':self.id,
            'user':self.user.to_dict(),
            'mood': {
                'emoji': self.mood.emoji,
                'emotion': self.mood.emotion
            } if self.mood else None,
            'text_note':self.text_note,
            'entry_date':self.entry_date,
            'created_at':self.created_at,
            'updated_at':self.updated_at,
            'local_id':self.local_id,
            'synced':self.synced,
            'ai_processed':self.ai_processed,
            'ai_processing_failed':self.ai_processing_failed,
            'ai_error_message':self.ai_error_message,
            'ai_processed_at':self.ai_processed_at,
            'ai_insight':self.ai_insight
        }
        if self.audio_file:
            data['audio_file'] = self.audio_file.to_dict()

        if include_audio_url:
            data['audio_url'] = self.audio_file.url
        return data

    def save(self,*args,**kwargs):
        self.updated_at = datetime.now()
        return super().save(*args,**kwargs)


    @classmethod
    def get_unprocessed_entries(cls, limit=10):
        """Get entries that need AI processing"""
        return cls.objects(
            ai_processed=False,
            ai_processing_failed=False
        ).limit(limit)

    
    def mark_ai_processing_complete(self, insight):
        """Mark entry as AI processed with insight"""
        self.ai_insight = insight
        self.ai_processed = True
        self.ai_processing_failed = False
        self.ai_error_message = None
        self.ai_processed_at = datetime.utcnow()
        self.save()
    
    def mark_ai_processing_failed(self, error_message):
        """Mark entry as AI processing failed"""
        self.ai_processing_failed = True
        self.ai_processed = False
        self.ai_error_message = error_message
        self.ai_processed_at = datetime.utcnow()
        self.save()
    
    def reset_ai_processing(self):
        """Reset AI processing status for retry"""
        self.ai_processed = False
        self.ai_processing_failed = False
        self.ai_error_message = None
        self.ai_processed_at = None
        self.save()

    def has_content_for_ai(self):
        """Check if entry has content suitable for AI analysis"""
        return bool(self.text_note and self.text_note.strip()) or bool(self.audio_file)

    @classmethod
    def get_user_entries(cls,user,limit=None,days=None):
        query = cls.objects(user=user).order_by('-entry_date')
        if days:
            from datetime import timedelta
            cutoff_date = datetime.now() - timedelta(days=days)
            query = query.filter(entry_date__gte=cutoff_date)

        if limit:
            query = query.limit(limit)

        return query

    def __str__(self):
        audio_indicator = " 🎵" if self.audio_file else ""
        ai_indicator = " 🤖" if self.ai_processed else (" ❌" if self.ai_processing_failed else " ⏳")
        mood_display = f"{self.mood.emotion} {self.mood.emoji}" if self.mood else "No mood"
        return f"MoodEntry({self.user.email}, {mood_display}, {self.entry_date.date()}){audio_indicator}{ai_indicator}"

