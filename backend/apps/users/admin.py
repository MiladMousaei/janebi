from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Address, User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    ordering = ["-date_joined"]
    list_display = ["email", "phone", "first_name", "last_name", "is_staff", "is_active"]
    search_fields = ["email", "phone", "first_name", "last_name"]
    fieldsets = ((None, {"fields": ("email", "phone", "password")}), ("اطلاعات", {"fields": ("first_name", "last_name")}), ("دسترسی", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}), ("تاریخ‌ها", {"fields": ("last_login", "date_joined")}))
    add_fieldsets = ((None, {"classes": ("wide",), "fields": ("email", "phone", "password1", "password2", "is_staff")}),)

admin.site.register(Address)
