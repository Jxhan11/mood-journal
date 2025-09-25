
from datetime import datetime,timedelta
from marshmallow import Schema, ValidationError, fields, validate, validates


class MoodSchema(Schema):
    emoji = fields.Str(required=True, validate=validate.Length(max=10))
    emotion = fields.Str(required=True, validate=validate.OneOf(['happy', 'sad', 'neutral', 'angry', 'anxious']))


class MoodEntryCreateSchema(Schema):
    mood = fields.Nested(MoodSchema, required=True)
    text_note = fields.Str(required=False, max_length=2000, allow_none=True)
    entry_date = fields.DateTime(required=True)
    local_id = fields.Str(validate=validate.Length(max=100), required=False)

    @validates('entry_date')
    def validate_entry_date(self, value):
        now = datetime.now()
        # Handle timezone issues by converting to naive datetime
        if hasattr(value, 'tzinfo') and value.tzinfo is not None:
            value = value.replace(tzinfo=None)
        if hasattr(now, 'tzinfo') and now.tzinfo is not None:
            now = now.replace(tzinfo=None)
            
        if value > now + timedelta(days=7):
            raise ValidationError("Entry date cannot be more than 7 days from now")

        if value < now - timedelta(days=365):
            raise ValidationError("Entry date cannot be more than 1 year in the past")



class MoodEntryUpdateSchema(Schema):
    mood = fields.Nested(MoodSchema, required=False)
    text_note = fields.Str(required=False, max_length=2000, allow_none=True)
    entry_date = fields.DateTime(required=False)

    @validates('entry_date')
    def validate_entry_date(self, value):
        if value is None:
            return
            
        now = datetime.now()
        # Handle timezone issues by converting to naive datetime
        if hasattr(value, 'tzinfo') and value.tzinfo is not None:
            value = value.replace(tzinfo=None)
        if hasattr(now, 'tzinfo') and now.tzinfo is not None:
            now = now.replace(tzinfo=None)
            
        if value > now + timedelta(days=7):
            raise ValidationError("Entry date cannot be more than 7 days from now")

        if value < now - timedelta(days=365):
            raise ValidationError("Entry date cannot be more than 1 year in the past")

    
class MoodEntryQuerySchema(Schema):
    limit = fields.Int(
        validate=validate.Range(min=1, max=100),
        missing=10  # Default limit
    )
    days = fields.Int(
        validate=validate.Range(min=1, max=365),
        missing=7  # Default to last 7 days
    )
    offset = fields.Int(
        validate=validate.Range(min=0),
        missing=0  # For pagination
    )


class MoodEntryResponseSchema(Schema):
    id = fields.Str()
    user_id = fields.Str()
    mood = fields.Nested(MoodSchema)
    text_note = fields.Str()
    entry_date = fields.DateTime()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    local_id = fields.Str()
    synced = fields.Bool()
    ai_processed = fields.Bool()
    ai_insight = fields.Str()