from django.conf import settings
from django.core.mail import send_mail

def send_order_created_email(order) -> None:
    send_mail(
        subject=f"سفارش {order.order_number} ثبت شد",
        message=f"سفارش شما به مبلغ {order.final_amount:,} تومان ثبت شد.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.user.email],
        fail_silently=True,
    )
