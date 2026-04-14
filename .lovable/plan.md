

# Create Admin Account

There are currently **zero users** in the database — no admin account was ever created. We need to set one up.

## New Admin Credentials
- **Email:** `exu@admin.com`
- **Password:** `EXU-ADMIN-2026`

## Steps

1. **Enable auto-confirm for email signups** temporarily so the admin account can be created without email verification.

2. **Create the admin user** by signing up via the Supabase auth API with the credentials above. The `handle_new_user` trigger will auto-create a profile and assign the `user` role.

3. **Assign admin role** by inserting an `admin` role into `user_roles` for the new user (the trigger only assigns `user` by default).

4. **Disable auto-confirm** after account creation so regular users must verify their email.

5. **Update the stored memory** with the new admin credentials.

## Technical Details
- The `handle_new_user` trigger already creates a profile and assigns the `user` role automatically
- We just need to additionally insert the `admin` role into `user_roles`
- No database schema changes required

