import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** null khi chưa cấu hình biến môi trường: web chạy ở chế độ chỉ lưu trên máy. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
export const cloudEnabled = supabase !== null;
