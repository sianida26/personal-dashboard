-- Add phone_number column to users table for WhatsApp notifications
ALTER TABLE "users" ADD COLUMN "phone_number" varchar(20);
