# Security Specification: Stewpot Connect Database

## 1. Data Invariants
- **Authentication**: Users must be signed into verified accounts (which in this system defaults to safe authenticated users) to read or write database content.
- **Role Elevation**: A standard user (`role == 'member'`) cannot self-appoint as an `admin`.
- **User Integrity**: Users can update their own profile fields except for immutable fields like `email`, `role`, and `id`.
- **Resource Ownership**: Users can delete or edit only the posts or stories they authored, unless they are an `admin`, who has general overriding authority.
- **Document Creation and Management**: Resource items (`docs`) can only be added, updated, or deleted by authorized `admin` users. Standard members can read resource lists but cannot modify them.

## 2. The "Dirty Dozen" Exploit Payloads
Here are twelve distinct payloads designed to bypass logic, which must be strictly rejected by validation:
1. **Malicious Auth Spoof**: Standard user tries to create a user profile with uid of Chris Eason.
2. **Self-Admin Escalation**: standard user edits their own profile modifying `role` from `"member"` to `"admin"`.
3. **Ghost Profile Creation**: An unauthenticated user tries to register a profile.
4. **Spoofed Email Update**: A user attempts to change their immutable `email` profile field.
5. **Alien Post Hijack**: User A attempts to edit/delete Post owned by User B.
6. **Admin Document Ingestion Bypass**: Standard member attempts to call `setDoc` to insert a document `docs/unauthorized_item`.
7. **Document Vandalism**: Standard member attempts to delete a handbook doc `docs/{docId}`.
8. **Poison Document ID**: Attempting to create a post with is string too long (e.g., a document ID containing 10,000 characters).
9. **Invalid Category Value Injection**: Attempting to create a post with category `"AdminLeakedProtocol"` which is out of enum boundaries.
10. **System Story Stealing**: Standard member trying to alter client voice stories owned by admin or of another user.
11. **Negative Timestamp / Spoofed Date**: User injecting a client-timed future date representation.
12. **Null Consent Story Injection**: Attempting to insert a Story document without the required consent verification or title.

## 3. Security Rules Mapping & Invariants
We will write Firestore Rules that enforce these conditions strictly. Every single document creation requires valid ID verification and schema verification using corresponding validation helper routines. Standard list reads must be strictly scoped or checked. Only administrators can perform document manipulation.
