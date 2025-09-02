-- Xeless Janitorial Management System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'client')),
  assigned_room_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations/Buildings table
CREATE TABLE IF NOT EXISTS locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  building_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  location_id UUID REFERENCES locations(id) NOT NULL,
  room_number TEXT NOT NULL,
  qr_code_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location_id, room_number)
);

-- Cleaning logs table
CREATE TABLE IF NOT EXISTS cleaning_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'cleaned',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Problem reports table
CREATE TABLE IF NOT EXISTS problem_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES users(id) NOT NULL,
  room_id UUID REFERENCES rooms(id) NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for assigned_room_id
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_assigned_room') THEN
    ALTER TABLE users ADD CONSTRAINT fk_users_assigned_room 
      FOREIGN KEY (assigned_room_id) REFERENCES rooms(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cleaning_logs_room_id ON cleaning_logs(room_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_logs_user_id ON cleaning_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_logs_timestamp ON cleaning_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_problem_reports_client_id ON problem_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_problem_reports_room_id ON problem_reports(room_id);
CREATE INDEX IF NOT EXISTS idx_problem_reports_status ON problem_reports(status);
CREATE INDEX IF NOT EXISTS idx_rooms_location_id ON rooms(location_id);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_reports ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Locations policies
CREATE POLICY "Everyone can view locations" ON locations
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage locations" ON locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Rooms policies
CREATE POLICY "Everyone can view rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage rooms" ON rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cleaning logs policies
CREATE POLICY "Staff can insert cleaning logs" ON cleaning_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('staff', 'admin')
    )
  );

CREATE POLICY "Everyone can view cleaning logs" ON cleaning_logs
  FOR SELECT USING (true);

-- Problem reports policies
CREATE POLICY "Clients can insert their own reports" ON problem_reports
  FOR INSERT WITH CHECK (
    auth.uid() = client_id AND
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'client'
    )
  );

CREATE POLICY "Users can view relevant reports" ON problem_reports
  FOR SELECT USING (
    auth.uid() = client_id OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update reports" ON problem_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.email, NEW.raw_user_meta_data->>'name', 'client');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data for 17 buildings
INSERT INTO locations (building_name) VALUES
  ('Building A'), ('Building B'), ('Building C'), ('Building D'), ('Building E'),
  ('Building F'), ('Building G'), ('Building H'), ('Building I'), ('Building J'),
  ('Building K'), ('Building L'), ('Building M'), ('Building N'), ('Building O'),
  ('Building P'), ('Building Q');

-- Function to generate rooms for all buildings (670 total)
DO $$
DECLARE
  building_record RECORD;
  room_count INTEGER;
  i INTEGER;
BEGIN
  FOR building_record IN SELECT id, building_name FROM locations LOOP
    -- Different room counts per building to total 670
    CASE 
      WHEN building_record.building_name IN ('Building A', 'Building B', 'Building C') THEN
        room_count := 50;
      WHEN building_record.building_name IN ('Building D', 'Building E', 'Building F', 'Building G') THEN
        room_count := 45;
      WHEN building_record.building_name IN ('Building H', 'Building I', 'Building J') THEN
        room_count := 40;
      ELSE
        room_count := 35;
    END CASE;
    
    FOR i IN 1..room_count LOOP
      INSERT INTO rooms (location_id, room_number)
      VALUES (building_record.id, LPAD(i::TEXT, 3, '0'));
    END LOOP;
  END LOOP;
END $$;

-- Create admin user (you'll need to update this with actual admin email)
-- This should be run after the admin user signs up through Supabase Auth
-- UPDATE users SET role = 'admin' WHERE email = 'admin@xeless.com';