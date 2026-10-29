import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/api.dart';
import 'controls.dart';

/// Runs `load` when `deps` change and shows a skeleton, the error, or the result.
class Loader<T> extends StatefulWidget {
  const Loader({
    super.key,
    required this.load,
    required this.builder,
    this.deps = const [],
    this.loading,
    this.errorTitle = 'Не загрузилось',
  });
  final Future<T> Function() load;
  final Widget Function(BuildContext context, T data) builder;
  final List<Object?> deps;
  final Widget? loading;
  final String errorTitle;

  @override
  State<Loader<T>> createState() => _LoaderState<T>();
}

class _LoaderState<T> extends State<Loader<T>> {
  late Future<T> _f = widget.load();

  @override
  void didUpdateWidget(Loader<T> old) {
    super.didUpdateWidget(old);
    if (!_same(old.deps, widget.deps)) _f = widget.load();
  }

  static bool _same(List<Object?> a, List<Object?> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<T>(
    future: _f,
    builder: (context, snap) {
      if (snap.connectionState != ConnectionState.done) return widget.loading ?? const Skeleton();
      if (snap.hasError) {
        final e = snap.error;
        return EmptyState(
          icon: LucideIcons.cloudOff,
          title: widget.errorTitle,
          text: e is ApiError ? e.message : '$e',
          action: Btn('Ещё раз', small: true, icon: LucideIcons.refreshCw, onTap: () => setState(() => _f = widget.load())),
        );
      }
      return widget.builder(context, snap.data as T);
    },
  );
}
