import 'dart:async';

import 'package:flutter/foundation.dart';

enum ToastKind { info, error }

class ToastItem {
  ToastItem(this.id, this.text, this.kind);
  final int id;
  final String text;
  final ToastKind kind;
}

class Toasts extends ChangeNotifier {
  final items = <ToastItem>[];
  var _next = 0;

  void show(String text, [ToastKind kind = ToastKind.info]) {
    final t = ToastItem(_next++, text, kind);
    items.add(t);
    if (items.length > 3) items.removeAt(0);
    notifyListeners();
    Timer(Duration(milliseconds: kind == ToastKind.error ? 6000 : 3200), () => dismiss(t.id));
  }

  void dismiss(int id) {
    items.removeWhere((t) => t.id == id);
    notifyListeners();
  }
}
