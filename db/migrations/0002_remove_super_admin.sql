ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users
SET role = 'content_admin', updated_at = CURRENT_TIMESTAMP
WHERE role = 'super_admin';

ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('student', 'content_admin'));
