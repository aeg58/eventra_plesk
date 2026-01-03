/** @type {import('next').NextConfig} */
const nextConfig = {
  // Uygulama alt yol altında çalışacak: http://blackwool.app/eventra
  basePath: '/eventra',
  async headers() {
    return [
      {
        source: '/eventra/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig







