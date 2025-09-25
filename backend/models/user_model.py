from datetime import datetime
from mongoengine import IntField, ReferenceField, StringField,EmailField,DateTimeField,BooleanField,Document
from werkzeug.security import generate_password_hash,check_password_hash
import uuid
class User(Document):
    id = StringField(primary_key=True,default=lambda:str(uuid.uuid4()))
    email = EmailField(required=True,unique=True)
    password_hash = StringField(required=True)
    first_name = StringField(required=True, max_length=50)
    last_name = StringField(required=True, max_length=50)

    is_active = BooleanField(default=True)

    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)
    last_login = DateTimeField()

    meta = {
        'collection':'users',
        'indexes':['email','created_at']
    }

    def set_password(self,password):
        self.password_hash = generate_password_hash(password)

    def check_password(self,password):
        return check_password_hash(self.password_hash,password)

    def to_dict(self):
        return {
            'id':self.id,
            'email':self.email,
            'first_name':self.first_name,
            'last_name':self.last_name,
            'is_active':self.is_active,
            'created_at':self.created_at,
            'updated_at':self.updated_at,
            'last_login':self.last_login
        }

    def save(self,*args,**kwargs):
        self.updated_at  = datetime.now()
        return super().save(*args,**kwargs)

    def __str__(self):
        return f"User({self.email})"


