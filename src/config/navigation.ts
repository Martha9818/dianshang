export type NavigationIcon =
  | "home"
  | "products"
  | "copywriting"
  | "promptTasks"
  | "materials"
  | "inspirations"
  | "export"
  | "backup"
  | "diagnostics"
  | "aiSettings"
  | "bannedWords";

export type NavigationItem = {
  href: string;
  title: string;
  description: string;
  icon: NavigationIcon;
};

export const primaryNavigation: NavigationItem[] = [
  {
    href: "/",
    title: "首页",
    description: "查看仪表盘总览与本地运行基线",
    icon: "home",
  },
  {
    href: "/products",
    title: "商品池",
    description: "查看商品、变体、竞品与评分骨架",
    icon: "products",
  },
  {
    href: "/copywriting",
    title: "文案生成",
    description: "查看平台文案工作区与审核骨架",
    icon: "copywriting",
  },
  {
    href: "/prompt-tasks",
    title: "Prompt 任务",
    description: "查看图片任务列表与详情骨架",
    icon: "promptTasks",
  },
  {
    href: "/materials",
    title: "素材库",
    description: "查看素材网格、详情与状态骨架",
    icon: "materials",
  },
  {
    href: "/inspirations",
    title: "灵感箱",
    description: "手动扫描本地图片，生成待审核灵感草稿与 AI 建议",
    icon: "inspirations",
  },
  {
    href: "/export",
    title: "导出",
    description: "查看导出说明、设置与记录骨架",
    icon: "export",
  },
  {
    href: "/backup",
    title: "备份",
    description: "查看本地备份状态与历史骨架",
    icon: "backup",
  },
  {
    href: "/system/diagnostics",
    title: "诊断中心",
    description: "查看本地运行、数据库、目录和脱敏诊断摘要",
    icon: "diagnostics",
  },
];

export const settingsNavigation: NavigationItem[] = [
  {
    href: "/settings/ai",
    title: "AI 设置",
    description: "查看 Provider 列表与配置骨架",
    icon: "aiSettings",
  },
  {
    href: "/settings/banned-words",
    title: "违禁词设置",
    description: "查看默认违禁词统计与只读明细",
    icon: "bannedWords",
  },
];
