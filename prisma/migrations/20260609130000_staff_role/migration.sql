-- Add STAFF role for admin panel users
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'STAFF';
