/**
 * preprocess_washoku.js
 * 漢字テキストを ElevenLabs 向けひらがなに変換するモジュール。
 *
 * 処理順序:
 *   1. カスタム辞書で固有名詞・難読語を先にひらがな置換
 *   2. kuroshiro + kuromoji で残りの漢字をひらがな変換
 *
 * 使い方:
 *   const { initPreprocessor, toKana } = require('./preprocess_washoku');
 *   await initPreprocessor();
 *   const kana = await toKana('節子はお玉を持った。');
 *   // → 'せつこはおたまをもった。'
 */

const path     = require('path');
const Kuroshiro = require(path.join(__dirname, '../node_modules/kuroshiro')).default;
const KuromojiAnalyzer = require(path.join(__dirname, '../node_modules/kuroshiro-analyzer-kuromoji'));

// =====================================================
// ★ カスタム辞書（読み間違いやすい語を優先置換）
//   キー: 置換対象文字列（長い順に適用）
//   値  : ひらがな読み
// =====================================================
const CUSTOM_DICT = [
  // --- 固有名詞（人名）---
  ['山田節子', 'やまだせつこ'],
  ['節子',     'せつこ'     ],
  ['茂',       'しげる'     ],

  // --- 料理・食材 ---
  ['煮干し',   'にぼし'     ],
  ['塩鮭',     'しおざけ'   ],
  ['汁椀',     'しるわん'   ],
  ['お玉',     'おたま'     ],
  ['出汁',     'だし'       ],
  ['漬物',     'つけもの'   ],
  ['味噌汁',   'みそしる'   ],
  ['味噌',     'みそ'       ],
  ['醤油',     'しょうゆ'   ],
  ['納豆',     'なっとう'   ],
  ['白米',     'はくまい'   ],
  ['焼き鮭',   'やきざけ'   ],
  ['一椀',     'いちわん'   ],
  ['お椀',     'おわん'     ],

  // --- 健康・医療 ---
  ['血圧',     'けつあつ'   ],
  ['塩分',     'えんぶん'   ],
  ['食塩',     'しょくえん' ],
  ['摂取',     'せっしゅ'   ],
  ['診察',     'しんさつ'   ],
  ['高血圧',   'こうけつあつ'],
  ['動脈',     'どうみゃく' ],

  // --- その他読み間違いやすい語 ---
  ['今日',     'きょう'     ],
  ['今朝',     'けさ'       ],
  ['昨日',     'きのう'     ],
  ['一日',     'いちにち'   ],
  ['何日',     'なんにち'   ],
  ['今年',     'ことし'     ],
  ['毎日',     'まいにち'   ],
  ['毎朝',     'まいあさ'   ],
  ['人参',     'にんじん'   ],
  ['大根',     'だいこん'   ],
  ['豆腐',     'とうふ'     ],
  ['七十一歳', 'ななじゅういっさい'],
  ['七十',     'ななじゅう' ],
];

// =====================================================

let kuroshiro = null;

async function initPreprocessor() {
  if (kuroshiro) return; // 初期化済み
  const instance = new Kuroshiro();
  await instance.init(new KuromojiAnalyzer());
  kuroshiro = instance;
  console.log('  ✅ kuroshiro 初期化完了');
}

/**
 * テキストをひらがなに変換する。
 * @param {string} text - 元テキスト（漢字混じり）
 * @returns {Promise<string>} - ひらがな変換後のテキスト
 */
async function toKana(text) {
  if (!kuroshiro) throw new Error('initPreprocessor() を先に呼び出してください。');

  // ステップ1: カスタム辞書で固有名詞・難読語を置換（長い順に適用）
  let processed = text;
  for (const [from, to] of CUSTOM_DICT) {
    processed = processed.split(from).join(to);
  }

  // ステップ2: 残りの漢字を kuroshiro でひらがな変換
  const result = await kuroshiro.convert(processed, {
    to:   'hiragana',
    mode: 'normal',
  });

  return result;
}

module.exports = { initPreprocessor, toKana };
