# User Guide

Orbit is a consultation booking system. Students book consultation slots with their lecturers,
lecturers publish their availability and decide requests, and administrators manage accounts and
courses.

## Getting started

### Opening the app

| Environment | Address                                       | Purpose                            |
| ----------- | --------------------------------------------- | ---------------------------------- |
| Production  | <https://cs3227-2610-mp3.vercel.app>          | The released version               |
| Development | The latest deployment of the `develop` branch | Features under test before release |

Signed-out visitors can only see the sign-in page. Every other address sends you to `/login`.

### Accounts

There is no self-registration. An administrator creates every account and gives you a one-time
password (see [Administrator](#administrator)). Each account has exactly one role: **Student**,
**Lecturer** or **Administrator**.

### Signing in

1. Open the app and enter your **Email** and **Password**.
2. Select **Sign in**.
3. You arrive at the page for your role: `/student`, `/lecturer` or `/admin`.

If the email or password is wrong, the page shows **Incorrect email or password.** It does not say
which of the two was wrong. A deactivated account cannot sign in, and an account that is
deactivated while signed in is signed out on its next request.

To sign out, select **Sign out**.

### Changing your password

Every signed-in user can change their own password. You should do this after your first sign-in,
because the administrator saw your one-time password.

1. Select **Change password** in the navigation.
2. Enter your **Current password**, a **New password** and **Confirm new password**.
3. Select **Change password**.

Rules:

- The new password must be 12–72 bytes long and different from your current password. Most
  characters count as one byte; some accented and non-Latin characters count as two or more.
- If the current password is wrong, the page shows **Current password is incorrect.** and you
  re-enter all three fields.
- After **5 wrong current passwords within 15 minutes**, further attempts are refused with **Too
  many attempts. Try again in N minutes.** This applies even if the next attempt is correct.

When the change succeeds, the page shows **Password changed**. You stay signed in on this device,
and your other devices are signed out. They may keep working for up to an hour until their current
sign-in expires (see [Known limitations](#known-limitations)).

## Student

_This section is maintained by the Student feature owner._

## Lecturer

_This section is maintained by the Lecturer feature owner._

## Administrator

The administrator dashboard (`/admin`) links to **Manage accounts**. It also lists pending
consultation requests.

### Finding accounts

**Manage accounts** (`/admin/accounts`) lists every account with its name, email, role and status
(**Active** or **Deactivated**).

- **Search** by part of an email address or name.
- Filter by **Role** (All roles, Student, Lecturer, Administrator) and **Status** (All statuses,
  Active, Deactivated), then select **Search**.
- **Clear filters** shows every account again.

If nothing matches, the page shows **No accounts match these filters.**

### Creating an account

1. In **Create account**, enter the **Email**, **Full name** and **Role**.
2. Select **Create account**.
3. The page shows a **One-time password (copy it now — it cannot be shown again)**. Select
   **Copy**, give the password to the new user through a private channel, then select **Done**.

After **Done**, or if you leave the page, the password cannot be shown again. If it is lost, reset
the password (below). The email must not already be in use; otherwise the page shows **An account
with that email already exists.**

### Changing a role

Choose the new role for the account and select **Change role**. The page shows **Role updated.**
Administrators can make other users administrators.

### Deactivating and reactivating an account

Select **Deactivate** to block an account immediately: the user is signed out on their next request
and cannot sign in. Select **Activate** to restore it. The account and its history are kept.

### Resetting a password

Select **Reset password** for a user who has forgotten their password or whose account may be
compromised. A new one-time password appears with **Copy** and **Done**, as when creating an
account. The user's existing sessions are ended.

For a suspected compromise, **deactivate the account first** (immediate), then reset the password,
then reactivate it.

### Rules that protect the system

| You try to…                                                          | Result                                                                |
| -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Change your own role, deactivate yourself or reset your own password | No controls are shown on your own account; use **Change password**    |
| Demote or deactivate the last active administrator                   | **That change would leave no active administrators and was refused.** |
| Change, deactivate or reset the **Protected** administrator          | No controls are shown for it                                          |

The **protected recovery administrator** is the first administrator account in each environment.
Nobody can demote, deactivate or reset it from the app, so the system always has one administrator
account to recover from. Its owner can still change its password with **Change password**.

## AI features

_To be added with the AI features._

## Known limitations

- After a password change or reset, other devices can stay signed in for up to one hour, until
  their current sign-in expires. They cannot renew it. To lock someone out immediately, an
  administrator deactivates the account.
- Public sign-up through the Supabase API is still enabled; the app itself offers no sign-up page.
- The administrator dashboard currently shows the text of pending consultation requests; a privacy
  review of this is planned.
