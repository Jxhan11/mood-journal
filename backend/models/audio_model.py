from mongoengine import Document, EmbeddedDocument, FloatField, IntField,StringField,ReferenceField,DateTimeField
from datetime import datetime


class AudioFile(EmbeddedDocument):
    filename = StringField(required=True)
    original_filename = StringField()
    file_size = IntField()
    duration = FloatField()
    content_type = StringField()
    uploaded_timestamp = DateTimeField()

    def to_dict(self):
        return {
            'filename':self.filename,
            'original_filename':self.original_filename,
            'file_size':self.file_size,
            'duration':self.duration,
            'content_type':self.content_type,
            'uploaded_timestamp':self.uploaded_timestamp,
            'url':f"/api/audio/{self.filename}"
        }
