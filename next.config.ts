// next.config.ts

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // 你现有的 picsum.photos 配置 (保留它，如果你仍在使用)
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '', // 通常 port 为空字符串，除非有特定端口
        pathname: '/**', // 允许 picsum.photos 下的所有路径
      },
      // ↓↓↓ 添加 RHG 相关域名 ↓↓↓
      {
        protocol: 'https',
        hostname: 'rhg.com', // 错误信息中提到的域名
        // port: '', // 通常为空
        // pathname: '/wp-content/uploads/**', // 可以更具体地限制路径，如果需要
      },
      {
        protocol: 'https',
        hostname: 'assets.rhg.com', // 图片实际托管的域名
        // port: '', // 通常为空
        // pathname: '/wp-content/uploads/**', // 可以更具体地限制路径，如果需要
      },
      {
        protocol: 'https',
        hostname: 'www.mckinsey.com', // 麦肯锡图片通常来自主域名下的 /~/media/ 路径
        // port: '', // 通常不需要，除非有特殊端口
        // pathname: '/~/media/**', // 可以选择性地限制路径
      },
      {
        protocol: 'https',
        hostname: 'www.goldmansachs.com', // 麦肯锡图片通常来自主域名下的 /~/media/ 路径
        // port: '', // 通常不需要，除非有特殊端口
        // pathname: '/~/media/**', // 可以选择性地限制路径
      },





      // ↑↑↑ 添加 RHG 相关域名 ↑↑↑
    ],
  },
};

export default nextConfig;