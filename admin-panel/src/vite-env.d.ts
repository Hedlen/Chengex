/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly BASE_URL: string
  // 添加其他环境变量类型
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}