from rest_framework.permissions import BasePermission
from .models import Faculty, Student


class IsAdmin(BasePermission):
    """
    Permission class to check if user is admin
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class IsFaculty(BasePermission):
    """
    Permission class to check if user is faculty
    """
    def has_permission(self, request, view):
        if not request.user:
            return False
        try:
            Faculty.objects.get(user=request.user)
            return True
        except Faculty.DoesNotExist:
            return False


class IsStudent(BasePermission):
    """
    Permission class to check if user is student
    """
    def has_permission(self, request, view):
        if not request.user:
            return False
        try:
            Student.objects.get(user=request.user)
            return True
        except Student.DoesNotExist:
            return False


class IsAdminOrFacultyOrStudent(BasePermission):
    """
    Permission class to check if user is admin, faculty, or student
    """
    def has_permission(self, request, view):
        if not request.user:
            return False
        if request.user.is_staff:
            return True
        try:
            Faculty.objects.get(user=request.user)
            return True
        except Faculty.DoesNotExist:
            pass
        try:
            Student.objects.get(user=request.user)
            return True
        except Student.DoesNotExist:
            pass
        return False
