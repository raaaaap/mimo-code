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
  // Command responses
  cmd_vim_toggled: string;
  cmd_vim_hint: string;
  cmd_login_instructions: string;
  cmd_logout_instructions: string;
  cmd_memory_empty: string;
  cmd_memory_cleared: string;
  cmd_memory_added: string;
  cmd_memory_usage: string;
  cmd_review_no_changes: string;
  cmd_review_hint: string;
  cmd_history_empty: string;
  cmd_history_hint: string;
  cmd_context_active: string;
  cmd_context_hint: string;
  cmd_stats_title: string;
  cmd_effort_set: string;
  cmd_effort_invalid: string;
  cmd_effort_usage: string;
  cmd_files_none: string;
  cmd_copy_unsupported: string;
  cmd_env_title: string;
  cmd_init_instructions: string;
  cmd_keybindings_title: string;
  cmd_output_style_set: string;
  cmd_output_style_invalid: string;
  cmd_output_style_usage: string;
  cmd_feedback_url: string;
  cmd_sandbox_toggled: string;
  cmd_sandbox_hint: string;
  cmd_upgrade_current: string;
  cmd_upgrade_url: string;
  cmd_issue_url: string;
  cmd_add_dir_not_found: string;
  cmd_add_dir_added: string;
  cmd_add_dir_usage: string;
  cmd_branch_current: string;
  cmd_branch_switched: string;
  cmd_branch_failed: string;
  cmd_branch_not_git: string;
  cmd_pr_comments_hint: string;
  cmd_help_hint: string;
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
    // Command responses
    cmd_vim_toggled: 'Vim 模式已切换。Vim 键绑定现已激活。',
    cmd_vim_hint: '使用 /keybindings 查看可用按键。',
    cmd_login_instructions: '要进行认证，请设置 API 密钥：\n  /config set apiKey sk-你的密钥\n\n或设置环境变量：\n  export MIMO_API_KEY=sk-你的密钥',
    cmd_logout_instructions: '要清除认证，请从 ~/.mimo/settings.json 中移除 API 密钥',
    cmd_memory_empty: '记忆为空。',
    cmd_memory_cleared: '记忆已清除。',
    cmd_memory_added: '已添加到记忆：',
    cmd_memory_usage: '用法：/memory [show|add <文本>|clear]',
    cmd_review_no_changes: '未找到最近的更改或不在 git 仓库中。',
    cmd_review_hint: '使用 /diff 查看完整差异。',
    cmd_history_empty: '未找到会话历史。',
    cmd_history_hint: '使用 /resume 恢复会话。',
    cmd_context_active: '上下文窗口：活跃',
    cmd_context_hint: '使用 /compact 压缩上下文大小。',
    cmd_stats_title: '会话统计：',
    cmd_effort_set: '推理努力程度已设置为：',
    cmd_effort_invalid: '无效级别。使用：low、medium 或 high',
    cmd_effort_usage: '用法：/effort <low|medium|high>',
    cmd_files_none: '本次会话中修改的文件：\n  （追踪尚未实现）',
    cmd_copy_unsupported: '终端模式下暂不支持剪贴板复制。',
    cmd_env_title: '环境变量：',
    cmd_init_instructions: '要初始化，请在项目根目录创建 .mimo/settings.json。\n参见 README 了解配置选项。',
    cmd_keybindings_title: '键绑定：',
    cmd_output_style_set: '输出风格已设置为：',
    cmd_output_style_invalid: '无效风格。使用：text、json 或 markdown',
    cmd_output_style_usage: '用法：/output-style <text|json|markdown>',
    cmd_feedback_url: '感谢您的反馈！请访问：https://github.com/raaaaap/mimo-code/issues',
    cmd_sandbox_toggled: '沙箱模式已切换。沙箱模式下，破坏性操作将被限制。',
    cmd_sandbox_hint: '使用 /permissions 查看当前权限模式。',
    cmd_upgrade_current: '当前版本：1.0.0',
    cmd_upgrade_url: '检查更新：https://github.com/raaaaap/mimo-code',
    cmd_issue_url: '要报告问题，请访问：\nhttps://github.com/raaaaap/mimo-code/issues/new',
    cmd_add_dir_not_found: '目录未找到：',
    cmd_add_dir_added: '已添加工作目录：',
    cmd_add_dir_usage: '用法：/add-dir <路径>',
    cmd_branch_current: '当前分支：',
    cmd_branch_switched: '已切换到分支：',
    cmd_branch_failed: '切换分支失败：',
    cmd_branch_not_git: '不是 git 仓库。',
    cmd_pr_comments_hint: 'PR 评论查看需要 GitHub 集成。\n使用：gh pr view --comments',
    cmd_help_hint: '输入 /help <类别> 查看分类详情',
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
    // Command responses
    cmd_vim_toggled: 'Vim mode toggled. Vim keybindings are now active.',
    cmd_vim_hint: 'Use /keybindings to see available keys.',
    cmd_login_instructions: 'To authenticate, set your API key:\n  /config set apiKey sk-your-key-here\n\nOr set environment variable:\n  export MIMO_API_KEY=sk-your-key-here',
    cmd_logout_instructions: 'To clear authentication, remove your API key from ~/.mimo/settings.json',
    cmd_memory_empty: 'Memory is empty.',
    cmd_memory_cleared: 'Memory cleared.',
    cmd_memory_added: 'Added to memory: ',
    cmd_memory_usage: 'Usage: /memory [show|add <text>|clear]',
    cmd_review_no_changes: 'No recent changes found or not a git repository.',
    cmd_review_hint: 'Use /diff for full diff.',
    cmd_history_empty: 'No session history found.',
    cmd_history_hint: 'Use /resume to continue a session.',
    cmd_context_active: 'Context window: active',
    cmd_context_hint: 'Use /compact to reduce context size.',
    cmd_stats_title: 'Session statistics:',
    cmd_effort_set: 'Reasoning effort set to: ',
    cmd_effort_invalid: 'Invalid level. Use: low, medium, or high',
    cmd_effort_usage: 'Usage: /effort <low|medium|high>',
    cmd_files_none: 'Files modified in this session:\n  (tracking not yet implemented)',
    cmd_copy_unsupported: 'Clipboard copy is not yet supported in terminal mode.',
    cmd_env_title: 'Environment:',
    cmd_init_instructions: 'To initialize, create a .mimo/settings.json in your project root.\nSee README for configuration options.',
    cmd_keybindings_title: 'Keybindings:',
    cmd_output_style_set: 'Output style set to: ',
    cmd_output_style_invalid: 'Invalid style. Use: text, json, or markdown',
    cmd_output_style_usage: 'Usage: /output-style <text|json|markdown>',
    cmd_feedback_url: 'Thank you for your feedback! Please visit: https://github.com/raaaaap/mimo-code/issues',
    cmd_sandbox_toggled: 'Sandbox mode toggled. In sandbox mode, destructive operations are restricted.',
    cmd_sandbox_hint: 'Use /permissions to see current permission mode.',
    cmd_upgrade_current: 'Current version: 1.0.0',
    cmd_upgrade_url: 'Check for updates: https://github.com/raaaaap/mimo-code',
    cmd_issue_url: 'To report an issue, please visit:\nhttps://github.com/raaaaap/mimo-code/issues/new',
    cmd_add_dir_not_found: 'Directory not found: ',
    cmd_add_dir_added: 'Added working directory: ',
    cmd_add_dir_usage: 'Usage: /add-dir <path>',
    cmd_branch_current: 'Current branch: ',
    cmd_branch_switched: 'Switched to branch: ',
    cmd_branch_failed: 'Failed to switch branch: ',
    cmd_branch_not_git: 'Not a git repository.',
    cmd_pr_comments_hint: 'PR comments viewing requires GitHub integration.\nUse: gh pr view --comments',
    cmd_help_hint: 'Type /help <category> for category details',
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
    // Command responses
    cmd_vim_toggled: 'Vim モードが切り替わりました。Vim キーバインドが有効になりました。',
    cmd_vim_hint: '/keybindings で利用可能なキーを確認。',
    cmd_login_instructions: '認証するには、API キーを設定してください：\n  /config set apiKey sk-あなたのキー\n\nまたは環境変数を設定：\n  export MIMO_API_KEY=sk-あなたのキー',
    cmd_logout_instructions: '認証をクリアするには、~/.mimo/settings.json から API キーを削除してください',
    cmd_memory_empty: 'メモリは空です。',
    cmd_memory_cleared: 'メモリがクリアされました。',
    cmd_memory_added: 'メモリに追加：',
    cmd_memory_usage: '使い方：/memory [show|add <テキスト>|clear]',
    cmd_review_no_changes: '最近の変更が見つからないか、git リポジトリではありません。',
    cmd_review_hint: '/diff で完全な差分を表示。',
    cmd_history_empty: 'セッション履歴が見つかりません。',
    cmd_history_hint: '/resume でセッションを続行。',
    cmd_context_active: 'コンテキストウィンドウ：アクティブ',
    cmd_context_hint: '/compact でコンテキストサイズを削減。',
    cmd_stats_title: 'セッション統計：',
    cmd_effort_set: '推論努力レベルが設定されました：',
    cmd_effort_invalid: '無効なレベル。使用：low、medium、high',
    cmd_effort_usage: '使い方：/effort <low|medium|high>',
    cmd_files_none: 'このセッションで変更されたファイル：\n  （追跡はまだ実装されていません）',
    cmd_copy_unsupported: 'ターミナルモードではクリップボードコピーはまだサポートされていません。',
    cmd_env_title: '環境変数：',
    cmd_init_instructions: '初期化するには、プロジェクトルートに .mimo/settings.json を作成してください。\n設定オプションは README を参照。',
    cmd_keybindings_title: 'キーバインド：',
    cmd_output_style_set: '出力スタイルが設定されました：',
    cmd_output_style_invalid: '無効なスタイル。使用：text、json、markdown',
    cmd_output_style_usage: '使い方：/output-style <text|json|markdown>',
    cmd_feedback_url: 'フィードバックありがとうございます！こちらへ：https://github.com/raaaaap/mimo-code/issues',
    cmd_sandbox_toggled: 'サンドボックスモードが切り替わりました。サンドボックスモードでは、破壊的な操作が制限されます。',
    cmd_sandbox_hint: '/permissions で現在の権限モードを確認。',
    cmd_upgrade_current: '現在のバージョン：1.0.0',
    cmd_upgrade_url: 'アップデート確認：https://github.com/raaaaap/mimo-code',
    cmd_issue_url: '問題を報告するには：\nhttps://github.com/raaaaap/mimo-code/issues/new',
    cmd_add_dir_not_found: 'ディレクトリが見つかりません：',
    cmd_add_dir_added: '作業ディレクトリを追加：',
    cmd_add_dir_usage: '使い方：/add-dir <パス>',
    cmd_branch_current: '現在のブランチ：',
    cmd_branch_switched: 'ブランチを切り替え：',
    cmd_branch_failed: 'ブランチ切り替え失敗：',
    cmd_branch_not_git: 'git リポジトリではありません。',
    cmd_pr_comments_hint: 'PR コメントの表示には GitHub 統合が必要です。\n使用：gh pr view --comments',
    cmd_help_hint: '/help <カテゴリ> でカテゴリ詳細を表示',
  },
};

export function t(lang: Language, key: keyof Translations): string {
  return translations[lang]?.[key] ?? translations['en'][key] ?? key;
}
