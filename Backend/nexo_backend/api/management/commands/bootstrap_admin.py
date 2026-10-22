import os

from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Create the configured Django superuser if it does not already exist.'

    def handle(self, *args, **options):
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME', '').strip()
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', '').strip()
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '')

        if not username or not email or not password:
            raise CommandError(
                'Set DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL, '
                'and DJANGO_SUPERUSER_PASSWORD environment variables.'
            )

        user_model = get_user_model()
        user = user_model.objects.filter(username=username).first()
        if user:
            if not user.is_staff or not user.is_superuser:
                raise CommandError(
                    f'User "{username}" already exists but is not a superuser.'
                )
            self.stdout.write(f'Superuser "{username}" already exists.')
            return

        candidate = user_model(username=username, email=email)
        try:
            password_validation.validate_password(password, user=candidate)
        except ValidationError as error:
            raise CommandError('; '.join(error.messages)) from error

        user_model.objects.create_superuser(
            username=username,
            email=email,
            password=password,
        )
        self.stdout.write(f'Superuser "{username}" created.')
