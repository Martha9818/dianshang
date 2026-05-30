import "dotenv/config";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl?.startsWith("file:")) {
  throw new Error('DATABASE_URL must use a SQLite file path such as "file:./dev.db".');
}

const sqliteTarget = databaseUrl.slice("file:".length);
const databasePath =
  sqliteTarget === ":memory:"
    ? sqliteTarget
    : path.isAbsolute(sqliteTarget)
      ? sqliteTarget
      : path.resolve(process.cwd(), "prisma", sqliteTarget);

const db = new DatabaseSync(databasePath);

const bannedWordGroups = [
  {
    category: "绝对化用语",
    riskLevel: "高",
    words: [
      "最",
      "最佳",
      "最好",
      "第一",
      "顶级",
      "首选",
      "唯一",
      "绝对",
      "100%",
      "百分百",
      "永久",
      "永不",
      "彻底",
      "完全",
      "无敌",
      "极致",
      "全网第一",
      "全网最低",
      "销量第一",
      "行业第一",
    ],
  },
  {
    category: "夸大承诺词",
    riskLevel: "高",
    words: [
      "必买",
      "必爆",
      "必火",
      "保证有效",
      "保证满意",
      "立刻见效",
      "马上见效",
      "一用就好",
      "用了就离不开",
      "买了不后悔",
      "零差评",
      "无风险",
    ],
  },
  {
    category: "医疗功效词",
    riskLevel: "高",
    words: [
      "治疗",
      "治愈",
      "药效",
      "疗效",
      "根治",
      "防病",
      "抗菌率",
      "杀菌率",
      "消炎",
      "止痛",
      "医学级",
      "医用级",
      "临床证明",
    ],
  },
  {
    category: "宠物用品风险词",
    riskLevel: "高",
    words: [
      "治皮肤病",
      "防寄生虫",
      "彻底除菌",
      "永久除味",
      "100%无害",
      "绝对安全",
      "防病",
      "治病",
      "药用",
      "保健功效",
      "增强免疫",
    ],
  },
  {
    category: "站外交易风险词",
    riskLevel: "高",
    words: [
      "全网最低",
      "亏本甩卖",
      "假一赔十",
      "官方正品",
      "品牌授权",
      "原厂正品",
      "私聊优惠",
      "加微信",
      "VX",
      "站外交易",
      "绕平台",
    ],
  },
];

function main() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "BannedWord" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "word" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "riskLevel" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS "BannedWord_word_key"
    ON "BannedWord"("word");
  `);

  const statement = db.prepare(`
    INSERT OR IGNORE INTO "BannedWord" ("word", "category", "riskLevel")
    VALUES (?, ?, ?)
  `);

  let total = 0;

  for (const group of bannedWordGroups) {
    for (const word of group.words) {
      statement.run(word, group.category, group.riskLevel);
      total += 1;
    }
  }

  const uniqueRow = db
    .prepare('SELECT COUNT(*) AS count FROM "BannedWord"')
    .get();

  console.log(
    `Seed completed: ${total} candidate words processed, ${uniqueRow.count} unique banned words stored.`,
  );
}

try {
  main();
} finally {
  db.close();
}
