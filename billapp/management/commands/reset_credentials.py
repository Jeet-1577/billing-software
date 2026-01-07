from __future__ import annotations

import getpass
from typing import Optional

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from billapp.models import Employee, Owner


class Command(BaseCommand):
    help = (
        "List and reset credentials for dashboard users (Owner/Employee) and Django /admin/ users.\n\n"
        "Examples:\n"
        "  python manage.py reset_credentials --list\n"
        "  python manage.py reset_credentials --owner-id owner001\n"
        "  python manage.py reset_credentials --employee-id EMPABC123 --password NewPass123\n"
        "  python manage.py reset_credentials --django-username admin\n"
        "  python manage.py reset_credentials --create-django-superuser --django-username admin --email a@b.com\n"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--list",
            action="store_true",
            help="List existing Owner IDs, Employee IDs, and Django auth usernames.",
        )

        parser.add_argument(
            "--owner-id",
            dest="owner_id",
            help="Owner owner_id to reset (used for /login dashboard).",
        )
        parser.add_argument(
            "--employee-id",
            dest="employee_id",
            help="Employee employee_id to reset (used for /login dashboard).",
        )
        parser.add_argument(
            "--django-username",
            dest="django_username",
            help="Django auth username to reset (used for /admin).",
        )
        parser.add_argument(
            "--password",
            dest="password",
            help="New password. If omitted, you will be prompted securely.",
        )

        parser.add_argument(
            "--create-django-superuser",
            action="store_true",
            help=(
                "Create a Django /admin superuser if it doesn't exist (or update the password if it does)."
            ),
        )
        parser.add_argument(
            "--email",
            dest="email",
            help="Email to use when creating a Django superuser.",
        )

    def handle(self, *args, **options):
        do_list: bool = options["list"]
        owner_id: Optional[str] = options.get("owner_id")
        employee_id: Optional[str] = options.get("employee_id")
        django_username: Optional[str] = options.get("django_username")
        password: Optional[str] = options.get("password")
        create_django_superuser: bool = options["create_django_superuser"]
        email: Optional[str] = options.get("email")

        if do_list:
            self._print_existing_accounts()

        targets = [bool(owner_id), bool(employee_id), bool(django_username)]
        if sum(targets) > 1:
            raise CommandError("Please reset only one of --owner-id, --employee-id, or --django-username at a time.")

        if owner_id:
            new_password = self._get_new_password(password)
            self._reset_owner_password(owner_id, new_password)
            return

        if employee_id:
            new_password = self._get_new_password(password)
            self._reset_employee_password(employee_id, new_password)
            return

        if django_username:
            if create_django_superuser:
                if not email:
                    raise CommandError("--email is required when using --create-django-superuser.")
                new_password = self._get_new_password(password)
                self._create_or_update_django_superuser(django_username, email, new_password)
            else:
                new_password = self._get_new_password(password)
                self._reset_django_user_password(django_username, new_password)
            return

        if not do_list:
            raise CommandError(
                "Nothing to do. Use --list, or specify one of --owner-id / --employee-id / --django-username."
            )

    def _print_existing_accounts(self) -> None:
        self.stdout.write(self.style.SUCCESS("=== Owners (dashboard /login) ==="))
        owners = Owner.objects.all().order_by("id")
        if not owners.exists():
            self.stdout.write("(none)")
        else:
            for o in owners:
                self.stdout.write(f"id={o.id} owner_id={o.owner_id} name={o.name} email={o.email}")

        self.stdout.write(self.style.SUCCESS("\n=== Employees (dashboard /login) ==="))
        employees = Employee.objects.all().order_by("id")
        if not employees.exists():
            self.stdout.write("(none)")
        else:
            for e in employees:
                self.stdout.write(
                    f"id={e.id} employee_id={e.employee_id} name={e.name} email={e.email} mobile={e.mobile_number}"
                )

        self.stdout.write(self.style.SUCCESS("\n=== Django auth users (/admin) ==="))
        User = get_user_model()
        users = User.objects.all().order_by("id")
        if not users.exists():
            self.stdout.write("(none)")
        else:
            for u in users:
                # Keep output minimal and safe (no passwords)
                self.stdout.write(
                    f"id={u.id} username={u.get_username()} is_superuser={u.is_superuser} "
                    f"is_staff={u.is_staff} is_active={u.is_active}"
                )

        self.stdout.write("")
        self.stdout.write("Login notes:")
        self.stdout.write("- Dashboard login uses Owner.owner_id or Employee.employee_id at /login/")
        self.stdout.write("- Django admin login uses Django auth username at /admin/")

    def _get_new_password(self, provided: Optional[str]) -> str:
        if provided:
            return provided

        while True:
            p1 = getpass.getpass("New password: ")
            if len(p1) < 6:
                self.stdout.write(self.style.ERROR("Password must be at least 6 characters."))
                continue
            p2 = getpass.getpass("Confirm password: ")
            if p1 != p2:
                self.stdout.write(self.style.ERROR("Passwords do not match."))
                continue
            return p1

    def _reset_owner_password(self, owner_id: str, new_password: str) -> None:
        try:
            owner = Owner.objects.get(owner_id=owner_id)
        except Owner.DoesNotExist as e:
            raise CommandError(f"Owner with owner_id='{owner_id}' was not found.") from e

        owner.set_password(new_password)
        owner.save(update_fields=["password"])  # already hashed
        self.stdout.write(self.style.SUCCESS(f"Owner password updated for owner_id={owner_id}"))

    def _reset_employee_password(self, employee_id: str, new_password: str) -> None:
        try:
            employee = Employee.objects.get(employee_id=employee_id)
        except Employee.DoesNotExist as e:
            raise CommandError(f"Employee with employee_id='{employee_id}' was not found.") from e

        employee.set_password(new_password)
        employee.save(update_fields=["password"])  # already hashed
        self.stdout.write(self.style.SUCCESS(f"Employee password updated for employee_id={employee_id}"))

    def _reset_django_user_password(self, username: str, new_password: str) -> None:
        User = get_user_model()
        try:
            user = User.objects.get(**{User.USERNAME_FIELD: username})
        except User.DoesNotExist as e:
            raise CommandError(
                f"Django user '{username}' not found. Use --create-django-superuser to create one."
            ) from e

        user.set_password(new_password)
        user.save(update_fields=["password"])
        self.stdout.write(self.style.SUCCESS(f"Django user password updated for username={username}"))

    def _create_or_update_django_superuser(self, username: str, email: str, new_password: str) -> None:
        User = get_user_model()
        lookup = {User.USERNAME_FIELD: username}
        user, created = User.objects.get_or_create(defaults={"email": email}, **lookup)

        if created:
            # If created via get_or_create, it won't be a superuser yet
            user.email = email
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True

        user.set_password(new_password)
        user.save()

        action = "created" if created else "updated"
        self.stdout.write(self.style.SUCCESS(f"Django superuser {action}: username={username}"))
