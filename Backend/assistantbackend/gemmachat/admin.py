from django.contrib import admin

# Register your models here.
from .models import ChatMessage

admin.site.register(ChatMessage)