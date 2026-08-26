import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // خروجی standalone فقط فایل‌های لازم برای اجرا را کنار هم می‌گذارد،
  // پس ایمیج داکر به‌جای کل node_modules چند ده مگابایت می‌شود.
  output: "standalone",
};

export default nextConfig;
