import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snljdgbyjmdjqbhahmax.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNubGpkZ2J5am1kanFiaGFobWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MDQzNTMsImV4cCI6MjA3NzI4MDM1M30.cDxHb8RlG7ZjBTw5WHn0NZMsnEb5W_EbSggYsAsS9BE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);