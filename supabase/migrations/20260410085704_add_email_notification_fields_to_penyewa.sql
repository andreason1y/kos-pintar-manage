-- Add email notification fields to penyewa table
ALTER TABLE penyewa
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS send_email_notifications BOOLEAN DEFAULT false;

-- Add comment to explain purpose
COMMENT ON COLUMN penyewa.email IS 'Tenant email address for notifications (optional)';
COMMENT ON COLUMN penyewa.send_email_notifications IS 'Enable/disable email notifications for this tenant (default: false)';
