import 'package:flutter/foundation.dart';

import '../core/api.dart' as api;
import '../core/env.dart';
import '../core/models.dart';
import '../core/services.dart' as services;

enum AuthState { unknown, signedOut, signedIn }

class Auth extends ChangeNotifier {
  AuthState state = AuthState.unknown;
  User? user;
  String? error;
  bool busy = false;

  Future<void> bootstrap() async {
    api.onUnauthorized = () {
      state = AuthState.signedOut;
      user = null;
      notifyListeners();
    };
    if (!kMock && !api.hasTokens()) {
      state = AuthState.signedOut;
      notifyListeners();
      return;
    }
    try {
      user = await services.getMe();
      state = AuthState.signedIn;
    } on api.ApiError catch (e) {
      state = e.status == 401 ? AuthState.signedOut : AuthState.signedIn;
    } catch (_) {
      // Offline: keep the session and let the library work.
      state = AuthState.signedIn;
    }
    notifyListeners();
  }

  Future<void> login(String username, String password) async {
    busy = true;
    error = null;
    notifyListeners();
    try {
      await services.login(username, password);
      user = await services.getMe();
      state = AuthState.signedIn;
    } catch (e) {
      error = e is api.ApiError && e.status == 401 ? 'Неверный логин или пароль' : '$e';
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await services.logout();
    user = null;
    state = AuthState.signedOut;
    notifyListeners();
  }
}
