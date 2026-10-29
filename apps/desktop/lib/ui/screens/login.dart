import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../stores.dart';
import '../titlebar.dart';
import '../tokens.dart';
import '../widgets/controls.dart';
import '../widgets/glass.dart';
import '../widgets/motion.dart';

/// Sign-in with the same account as the phone app.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _user = TextEditingController();
  final _pass = TextEditingController();
  final _passFocus = FocusNode();

  @override
  void dispose() {
    _user.dispose();
    _pass.dispose();
    _passFocus.dispose();
    super.dispose();
  }

  void _submit() {
    if (_user.text.trim().isEmpty || _pass.text.isEmpty || auth.busy) return;
    auth.login(_user.text.trim(), _pass.text);
  }

  @override
  Widget build(BuildContext context) => Column(
    children: [
      SizedBox(
        height: 48,
        child: DragArea(child: Row(children: [const Spacer(), if (isDesktop && !isMac) const WindowButtons()])),
      ),
      Expanded(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Rise(
              offset: 24,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 400),
                child: Glass(
                  tint: C.glassThick,
                  padding: const EdgeInsets.all(32),
                  child: ListenableBuilder(
                    listenable: auth,
                    builder: (context, _) => Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Align(alignment: Alignment.centerLeft, child: Wordmark()),
                        const SizedBox(height: 26),
                        const Text('Вход', style: T.h1),
                        const SizedBox(height: 6),
                        const Text('Тот же аккаунт, что в приложении на телефоне. История и скачанное синхронизируются.', style: T.sub),
                        const SizedBox(height: 26),
                        Field(
                          controller: _user,
                          hint: 'Логин',
                          icon: LucideIcons.user,
                          autofocus: true,
                          onSubmitted: (_) => _passFocus.requestFocus(),
                        ),
                        const SizedBox(height: 12),
                        Field(
                          controller: _pass,
                          focusNode: _passFocus,
                          hint: 'Пароль',
                          icon: LucideIcons.lock,
                          obscure: true,
                          onSubmitted: (_) => _submit(),
                        ),
                        AnimatedSize(
                          duration: D.mid,
                          curve: easeOut,
                          child: auth.error == null
                              ? const SizedBox(width: double.infinity)
                              : Padding(
                                  padding: const EdgeInsets.only(top: 12),
                                  child: Text(auth.error!, style: T.sub.copyWith(color: C.danger)),
                                ),
                        ),
                        const SizedBox(height: 22),
                        Btn('Войти', kind: BtnKind.primary, busy: auth.busy, onTap: _submit),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ],
  );
}
