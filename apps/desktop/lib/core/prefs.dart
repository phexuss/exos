import 'package:shared_preferences/shared_preferences.dart';

/// Small settings and tokens; loaded once at start so reads are synchronous.
class Prefs {
  Prefs._();
  static SharedPreferences? _p;

  static Future<void> init() async {
    try {
      _p = await SharedPreferences.getInstance();
    } catch (_) {
      _p = null;
    }
  }

  static String? str(String key) => _p?.getString(key);
  static bool? flag(String key) => _p?.getBool(key);
  static double? num(String key) => _p?.getDouble(key);

  static Future<void> set(String key, Object? value) async {
    final p = _p;
    if (p == null) return;
    switch (value) {
      case null:
        await p.remove(key);
      case String v:
        await p.setString(key, v);
      case bool v:
        await p.setBool(key, v);
      case double v:
        await p.setDouble(key, v);
      case int v:
        await p.setDouble(key, v.toDouble());
    }
  }
}
