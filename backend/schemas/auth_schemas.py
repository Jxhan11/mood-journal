from marshmallow import Schema,fields,validate,validates,ValidationError
import re
class UserRegistrationSchema(Schema):
    email = fields.Email(required=True,validate=validate.Email())
    password = fields.Str(required=True,validate = validate.Length(min=8,max=50),load_only=True)
    first_name = fields.Str(validate=validate.Length(min=1,max=50))
    last_name = fields.Str(validate=validate.Length(min=1,max=50))

    @validates('email')
    def validate_email(self,email):
        if not email or '@' not in email:
            raise ValidationError("Invalid email address")

    @validates('password')
    def validate_password(self,value):
        if not re.search(r'[A-Z]', value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', value):
            raise ValidationError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValidationError('Password must contain at least one special character')

class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True,validate = validate.Length(min=1))

class UserResponseSchema(Schema):   
    id = fields.Str()
    email = fields.Email()
    first_name = fields.Str()
    last_name = fields.Str()
    is_active = fields.Bool()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    last_login = fields.DateTime()

class AuthResponseSchema(Schema):
    access_token = fields.Str()
    user = fields.Nested(UserResponseSchema)
    expires_in = fields.Int()



    