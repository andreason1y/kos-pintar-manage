-- Update paket Bisnis dari 60 kamar menjadi 80 kamar
UPDATE plan_limits SET max_rooms = 80 WHERE plan = 'bisnis';
