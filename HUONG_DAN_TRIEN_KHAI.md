# Đưa Hán Tự lên Supabase + Vercel

## 1. Tạo project Supabase
1. Vào supabase.com, tạo project mới.
2. SQL Editor, dán toàn bộ `supabase/schema.sql`, bấm Run (tạo bảng `user_progress`, `user_starred` và bảo mật RLS).
3. Project Settings, API: copy **Project URL** và **anon / publishable key**. Không dùng service_role.

## 2. Bật đăng nhập
**Email:** Authentication, Providers, Email: bật, giữ "Confirm email" bật.

**Google:**
1. Google Cloud Console, APIs & Services, Credentials, Create OAuth client ID (Web application).
2. Authorized redirect URI: dán `https://<project-ref>.supabase.co/auth/v1/callback` (có sẵn trong Supabase, Providers, Google).
3. Dán Client ID và Client Secret vào Supabase, Providers, Google, bật lên.

**URL:** Authentication, URL Configuration:
- Site URL: địa chỉ Vercel của bạn, vd `https://hantu.vercel.app`
- Redirect URLs: thêm `https://hantu.vercel.app/**` và `http://localhost:5173/**`

## 3. Gửi email thật sự
Email mặc định của Supabase chỉ gửi được vài thư mỗi giờ và hay vào Spam. Trước khi mở cho nhiều người dùng, vào Authentication, SMTP Settings và gắn SMTP riêng (Resend, Brevo, Gmail SMTP...).

## 4. Chạy thử trên máy
```
npm install        # tạo lại package-lock.json (file cũ đã bị xóa vì lệch với package.json)
cp .env.example .env.local     # điền URL và key
npm run typecheck
npm run dev
```

## 5. Deploy Vercel
1. Đẩy code lên GitHub (nhớ commit `package-lock.json` mới sau `npm install`).
2. Vercel, Add New Project, chọn repo. Vercel tự nhận Vite (build: `npm run build`, output: `dist`).
3. Settings, Environment Variables: thêm `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`, rồi Deploy.
4. Quay lại bước 2 để chắc Site URL và Redirect URLs đúng domain Vercel.

## Cách đồng bộ hoạt động
- Chưa đăng nhập: lưu localStorage như cũ.
- Đăng nhập lần đầu: tiến độ và dấu sao trên máy được gộp với tài khoản. Mỗi thẻ lấy bản được ôn gần nhất; dấu sao lấy thay đổi mới nhất.
- Sau đó mỗi lần chấm thẻ hoặc bấm sao sẽ tự đẩy lên sau khoảng 1 giây. Mất mạng thì tự thử lại khi có mạng.
- Đăng xuất: xóa tiến độ trên máy này (dữ liệu vẫn nằm trên tài khoản), tránh lộ dữ liệu trên máy dùng chung.
- Cài đặt giọng đọc và chế độ tối vẫn chỉ lưu theo từng thiết bị.
