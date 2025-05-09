// postcss.config.mjs
export default {
  plugins: {
    // 尝试直接导入 tailwindcss 包的主入口
    // 这通常会自动解析为 PostCSS 插件
    'tailwindcss/nesting': {}, // 有些配置会先用这个处理嵌套
    tailwindcss: {},
    autoprefixer: {},
  },
};