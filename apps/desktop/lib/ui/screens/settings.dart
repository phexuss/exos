import 'package:file_selector/file_selector.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/env.dart';
import '../../engine/engine.dart';
import '../../stores.dart';
import '../look.dart';
import '../tokens.dart';
import '../widgets/controls.dart';
import '../widgets/motion.dart';
import 'page.dart';

const _browsers = [
  ('', 'Не использовать'),
  ('chrome', 'Chrome'),
  ('firefox', 'Firefox'),
  ('edge', 'Edge'),
  ('brave', 'Brave'),
  ('opera', 'Opera'),
  ('vivaldi', 'Vivaldi'),
  ('safari', 'Safari'),
];

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Listenable.merge([settings, engineState, auth, library]),
    builder: (context, _) {
      final st = engineState.status;
      return PageScroll(
        children: [
          const Text('Настройки', style: T.h1),
          const SizedBox(height: 28),
          _Group(
            title: 'Локальный движок',
            children: [
              _ToolRow(
                tool: Tool.ytdlp,
                name: 'yt-dlp',
                info: st?.ytdlp,
                installable: st?.installable.contains(Tool.ytdlp) ?? false,
                hint: 'Ищет и качает аудио с YouTube и SoundCloud прямо с этого компьютера. Обновляется сам при запуске.',
                missing: 'Без него нельзя ни слушать, ни скачивать. EXØS поставит свою копию в папку приложения.',
              ),
              _ToolRow(
                tool: Tool.deno,
                name: 'JS-движок для YouTube',
                info: st?.jsRuntime,
                installable: st?.installable.contains(Tool.deno) ?? false,
                hint: 'YouTube проверяет клиента задачкой на JavaScript, yt-dlp решает её через ${st?.jsRuntime?.name ?? 'Deno'}.',
                missing: 'Нужен Deno, Node или Bun. Без него YouTube часто отдаёт ошибку или пустой список форматов.',
              ),
              _ToolRow(
                tool: Tool.ffmpeg,
                name: 'ffmpeg',
                info: st?.ffmpeg,
                installable: st?.installable.contains(Tool.ffmpeg) ?? false,
                hint: 'Склеивает HLS-потоки SoundCloud при скачивании и конвертирует в mp3.',
                missing:
                    'Без него не работает формат mp3 и часть загрузок с SoundCloud. На macOS: brew install ffmpeg, на Linux: пакет ffmpeg.',
              ),
              _Row(
                label: 'Куки браузера для YouTube',
                hint: 'Если YouTube пишет «Sign in to confirm you’re not a bot», yt-dlp возьмёт куки из браузера, где ты вошёл в YouTube. Куки не покидают компьютер.',
                trailing: _BrowserPicker(value: settings.cookiesBrowser),
              ),
              if (settings.cookiesBrowser.isNotEmpty)
                _CookiesCheck(key: ValueKey(settings.cookiesBrowser), browser: settings.cookiesBrowser),
            ],
          ),
          _Group(
            title: 'Скачивание',
            children: [
              _Row(
                label: 'Папка с музыкой',
                value: library.musicDir,
                trailing: Wrap(
                  spacing: 8,
                  children: [
                    Btn('Открыть', small: true, icon: LucideIcons.folderOpen, onTap: () => engine.openFolder(library.musicDir)),
                    Btn(
                      'Изменить',
                      small: true,
                      onTap: kIsWeb
                          ? null
                          : () async {
                              final dir = await getDirectoryPath(initialDirectory: library.musicDir);
                              if (dir != null) settings.set(musicDir: dir);
                            },
                    ),
                  ],
                ),
              ),
              _Row(
                label: 'Формат',
                hint:
                    'M4A (AAC) скачивается с YouTube как есть, без перекодирования. MP3 перекодируется ffmpeg и открывается вообще везде.',
                trailing: Segmented<String>(
                  value: settings.format,
                  width: 64,
                  options: const [('m4a', 'M4A'), ('mp3', 'MP3')],
                  onChanged: (v) => settings.set(format: v),
                ),
              ),
            ],
          ),
          _Group(
            title: 'Внешний вид',
            children: [
              _Row(
                label: 'Живое размытие',
                hint: 'Панели размывают свет под собой. Выключи, если окно подтормаживает: останется тонированное стекло.',
                trailing: Toggle(
                  on: settings.liveBlur,
                  onChanged: (v) => settings.set(liveBlur: v),
                ),
              ),
              _Row(
                label: 'Счётчик кадров',
                hint: 'Показывает в заголовке, сколько кадров в секунду реально выводится и самый долгий кадр. Нужен, чтобы проверить 144 и 165 Гц.',
                trailing: Toggle(
                  on: settings.showFps,
                  onChanged: (v) => settings.set(showFps: v),
                ),
              ),
            ],
          ),
          _Group(
            title: 'Аккаунт',
            children: [
              _Row(
                label: auth.user == null ? 'Аккаунт EXØS' : '${auth.user!.name} · @${auth.user!.username}',
                hint: 'Поиск, тексты и рекомендации идут через сервер EXØS, история и список скачанного синхронизируются с телефоном. Сам звук сервер не трогает.',
                value: kApiBase,
                trailing: Btn('Выйти', small: true, kind: BtnKind.danger, icon: LucideIcons.logOut, onTap: auth.logout),
              ),
            ],
          ),
          _Group(
            title: 'Клавиши',
            children: [
              for (final (k, v) in const [
                ('Пробел', 'Играть / пауза'),
                ('← →', 'Перемотка на 5 секунд'),
                ('Shift + ← →', 'Предыдущий / следующий трек'),
                ('↑ ↓', 'Громкость'),
                ('Ctrl + K или /', 'Поиск'),
                ('L · Q', 'Текст · очередь'),
                ('F · Esc', 'Плеер на всё окно · свернуть'),
                ('Alt + ← →', 'Назад / вперёд'),
              ])
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  child: Row(
                    children: [
                      Expanded(child: Text(v, style: T.body)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: C.fill2,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: C.border),
                        ),
                        child: Text(k, style: T.small.copyWith(color: C.text2)),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ],
      );
    },
  );
}

class _Group extends StatelessWidget {
  const _Group({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 32),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: T.h2),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: C.fill2,
            borderRadius: BorderRadius.circular(R.md),
            border: Border.all(color: C.divider),
          ),
          child: Column(
            children: [
              for (var i = 0; i < children.length; i++) ...[
                if (i > 0) const SizedBox(height: 1, child: ColoredBox(color: C.divider)),
                children[i],
              ],
            ],
          ),
        ),
      ],
    ),
  );
}

class _Row extends StatelessWidget {
  const _Row({required this.label, this.hint, this.value, this.trailing, this.icon});
  final String label;
  final String? hint;
  final String? value;
  final Widget? trailing;
  final Widget? icon;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
    child: LayoutBuilder(
      builder: (context, c) {
        final text = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (icon != null) ...[icon!, const SizedBox(width: 8)],
                Flexible(child: Text(label, style: T.title)),
              ],
            ),
            if (hint != null) ...[const SizedBox(height: 3), Text(hint!, style: T.sub)],
            if (value != null) ...[
              const SizedBox(height: 4),
              Text(
                value!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: T.small.copyWith(color: C.text2),
              ),
            ],
          ],
        );
        if (trailing == null) return text;
        if (c.maxWidth < 560) {
          return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [text, const SizedBox(height: 12), trailing!]);
        }
        return Row(
          children: [
            Expanded(child: text),
            const SizedBox(width: 24),
            trailing!,
          ],
        );
      },
    ),
  );
}

class _ToolRow extends StatelessWidget {
  const _ToolRow({
    required this.tool,
    required this.name,
    required this.info,
    required this.installable,
    required this.hint,
    required this.missing,
  });
  final Tool tool;
  final String name;
  final ToolInfo? info;
  final bool installable;
  final String hint;
  final String missing;

  @override
  Widget build(BuildContext context) {
    final i = info;
    final busy = engineState.installing?.$1 == tool;
    Widget? trailing;
    if (busy) {
      trailing = Text('${((engineState.installing?.$2 ?? 0) * 100).round()}%', style: T.num.copyWith(color: C.text2));
    } else if (i != null && tool == Tool.ytdlp) {
      trailing = Btn(
        engineState.updating ? 'Обновляю…' : 'Обновить',
        small: true,
        icon: LucideIcons.refreshCw,
        busy: engineState.updating,
        onTap: engineState.updateYtdlp,
      );
    } else if (i == null && installable) {
      trailing = Btn('Установить', small: true, kind: BtnKind.primary, icon: LucideIcons.download, onTap: () => engineState.install(tool));
    }
    return _Row(
      icon: Icon(i != null ? LucideIcons.circleCheck : LucideIcons.circleAlert, size: 16, color: i != null ? C.ok : C.warning),
      label: i == null ? name : '$name  ${i.version}',
      hint: i == null ? missing : hint,
      value: i == null ? null : '${i.path} · ${i.managed ? 'ставит EXØS' : 'системный'}',
      trailing: trailing,
    );
  }
}

class _BrowserPicker extends StatelessWidget {
  const _BrowserPicker({required this.value});
  final String value;

  @override
  Widget build(BuildContext context) {
    final label = _browsers.firstWhere((b) => b.$1 == value, orElse: () => _browsers.first).$2;
    return Tappable(
      onTap: () {
        final box = context.findRenderObject() as RenderBox;
        final at = box.localToGlobal(Offset(0, box.size.height + 6));
        showMenuAt(context, at, [
          for (final (v, l) in _browsers)
            MenuItem(l, v == value ? LucideIcons.check : LucideIcons.globe, () => settings.set(cookiesBrowser: v)),
        ]);
      },
      builder: (context, s) => AnimatedContainer(
        duration: D.fast,
        height: 34,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(color: s.hovered ? C.fill5 : C.fill3, borderRadius: BorderRadius.circular(99)),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label, style: T.sub.copyWith(color: C.text)),
            const SizedBox(width: 8),
            const Icon(LucideIcons.chevronDown, size: 14, color: C.text2),
          ],
        ),
      ),
    );
  }
}

class _CookiesCheck extends StatefulWidget {
  const _CookiesCheck({super.key, required this.browser});
  final String browser;
  @override
  State<_CookiesCheck> createState() => _CookiesCheckState();
}

class _CookiesCheckState extends State<_CookiesCheck> {
  bool _busy = false;
  CookieCheck? _r;
  String? _error;

  Future<void> _run() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final r = await engine.checkCookies(widget.browser);
      if (mounted) setState(() => _r = r);
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = _r;
    final hint =
        _error ??
        (r == null
            ? 'Прочитает куки прямо сейчас и покажет, видит ли yt-dlp вход в YouTube. Дальше они обновляются раз в полчаса.'
            : r.signedIn
            ? 'yt-dlp прочитал ${r.count} куки, из них ${r.youtube} от YouTube. Вход в YouTube есть.'
            : 'yt-dlp прочитал ${r.count} куки, из них ${r.youtube} от YouTube, но входа в YouTube в этом браузере нет. Войди в YouTube и проверь снова.');
    return _Row(
      label: 'Проверить куки',
      hint: hint,
      icon: _error != null
          ? const Icon(LucideIcons.circleAlert, size: 16, color: C.danger)
          : (r?.signedIn ?? false ? Icon(LucideIcons.circleCheck, size: 16, color: Accent.of(context)) : null),
      trailing: Btn(_busy ? 'Читаю…' : 'Проверить', small: true, icon: LucideIcons.refreshCw, busy: _busy, onTap: _run),
    );
  }
}
