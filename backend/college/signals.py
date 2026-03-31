from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Student, Payment, FeeStructure
from datetime import timedelta
from django.utils import timezone


@receiver(post_save, sender=Student)
def create_student_fees(sender, instance, created, **kwargs):
    """
    Signal to auto-create payment record when a student is added
    """
    if created:
        try:
            # Get fee structure for the student's department and semester
            fee_structure = FeeStructure.objects.filter(
                department=instance.department,
                semester=instance.semester
            ).first()

            if fee_structure:
                # Calculate due date (30 days from today)
                due_date = (timezone.now() + timedelta(days=30)).date()
                
                # Create payment record
                Payment.objects.create(
                    student=instance,
                    fee_structure=fee_structure,
                    amount_due=fee_structure.total_fees,
                    amount_paid=0,
                    payment_date=timezone.now().date(),
                    due_date=due_date,
                    status='PENDING',
                    payment_method='CASH',
                    remarks=f'Auto-created for admission to {instance.department.name} - Semester {instance.semester}'
                )
        except Exception as e:
            print(f"Error creating payment for student {instance.roll_number}: {str(e)}")
