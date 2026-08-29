from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Address, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "phone", "email", "is_staff", "date_joined"]
        read_only_fields = ["id", "is_staff", "date_joined"]

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(write_only=True, min_length=6, error_messages={"blank": "رمز عبور را وارد کنید.", "required": "رمز عبور را وارد کنید.", "min_length": "رمز عبور باید حداقل ۶ کاراکتر باشد."})
    confirm_password = serializers.CharField(write_only=True, error_messages={"blank": "تکرار رمز عبور را وارد کنید.", "required": "تکرار رمز عبور را وارد کنید."})
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "phone", "email", "password", "confirm_password"]
        extra_kwargs = {
            "first_name": {"required": True, "allow_blank": False, "error_messages": {"blank": "نام را وارد کنید.", "required": "نام را وارد کنید."}},
            "last_name": {"required": True, "allow_blank": False, "error_messages": {"blank": "نام خانوادگی را وارد کنید.", "required": "نام خانوادگی را وارد کنید."}},
            "phone": {"required": True, "allow_blank": False, "error_messages": {"blank": "شماره موبایل را وارد کنید.", "required": "شماره موبایل را وارد کنید.", "unique": "این شماره موبایل قبلاً ثبت شده است."}},
        }
    def validate(self, attrs):
        if not attrs.get("email"):
            attrs["email"] = None
        if attrs["password"] != attrs.pop("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "تکرار رمز عبور یکسان نیست."})
        return attrs
    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)
    def validate(self, attrs):
        identifier = attrs["identifier"].strip()
        user_obj = User.objects.filter(Q(email__iexact=identifier) | Q(phone=identifier)).first()
        user = user_obj if user_obj and user_obj.check_password(attrs["password"]) else None
        if not user or not user.is_active:
            raise serializers.ValidationError("ایمیل/موبایل یا رمز عبور نادرست است.")
        refresh = RefreshToken.for_user(user)
        return {"access": str(refresh.access_token), "refresh": str(refresh), "user": UserSerializer(user).data}

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        exclude = ["user"]

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("رمز فعلی نادرست است.")
        return value
