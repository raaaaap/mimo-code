export type Language = 'zh-CN' | 'en' | 'ja';

export const LANGUAGES: Language[] = ['zh-CN', 'en', 'ja'];

export const LANGUAGE_LABELS: Record<Language, string> = {
  'zh-CN': '简体中文',
  'en': 'English',
  'ja': '日本語',
};

interface Translations {
  thinking: string;
  executing: string;
  abort_hint: string;
  commands_hint: string;
  commands_title: string;
  commands_more: string;
  error_connect: string;
  error_unknown: string;
  language_changed: string;
  language_available: string;
  language_usage: string;
}

const translations: Record<Language, Translations> = {
  'zh-CN': {
    thinking: '💭 思考中...',
    executing: '⚡ 执行中:',
    abort_hint: '按 Escape 中止',
    commands_hint: '按 Tab 查看常用命令',
    commands_title: '常用命令：',
    commands_more: '输入 /help 查看全部命令',
    error_connect: '无法连接到 API 服务器',
    error_unknown: '未知错误',
    language_changed: '语言已切换为：',
    language_available: '可用语言：',
    language_usage: '用法：/language <语言代码>',
  },
  'en': {
    thinking: '💭 Thinking...',
    executing: '⚡ Executing:',
    abort_hint: 'Press Escape to abort',
    commands_hint: 'Press Tab for common commands',
    commands_title: 'Common Commands:',
    commands_more: 'Type /help for all commands',
    error_connect: 'Cannot connect to API server',
    error_unknown: 'Unknown error',
    language_changed: 'Language changed to:',
    language_available: 'Available languages:',
    language_usage: 'Usage: /language <code>',
  },
  'ja': {
    thinking: '💭 思考中...',
    executing: '⚡ 実行中:',
    abort_hint: 'Escape で中止',
    commands_hint: 'Tab でよく使うコマンド',
    commands_title: 'よく使うコマンド：',
    commands_more: '/help ですべてのコマンドを表示',
    error_connect: 'API サーバーに接続できません',
    error_unknown: '不明なエラー',
    language_changed: '言語が変更されました：',
    language_available: '利用可能な言語：',
    language_usage: '使い方：/language <コード>',
  },
};

export function t(lang: Language, key: keyof Translations): string {
  return translations[lang]?.[key] ?? translations['en'][key] ?? key;
}
