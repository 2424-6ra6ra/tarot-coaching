/** @type {import('next').NextConfig} */
const nextConfig = {
  // 画像最適化 API（/_next/image）は使っていないので止める。
  // Next.js 14 系には修正版が出ていない画像最適化の脆弱性があるため、入口ごと閉じておく。
  images: { unoptimized: true },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
