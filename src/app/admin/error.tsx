"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return <section className="admin-error" role="alert"><h1>管理工作台加载失败</h1><p>请检查数据库连接与迁移状态。</p><button onClick={reset}>重试</button></section>;
}
