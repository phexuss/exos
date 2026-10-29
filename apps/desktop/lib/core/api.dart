import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'env.dart';
import 'prefs.dart';

const _accessKey = 'exos.accessToken';
const _refreshKey = 'exos.refreshToken';
const _refreshSkew = Duration(seconds: 30);

class ApiError implements Exception {
  ApiError(this.status, this.message);
  final int status;
  final String message;
  @override
  String toString() => message;
}

final _client = http.Client();

void saveTokens(String access, String refresh) {
  Prefs.set(_accessKey, access);
  Prefs.set(_refreshKey, refresh);
}

void clearTokens() {
  Prefs.set(_accessKey, null);
  Prefs.set(_refreshKey, null);
}

bool hasTokens() => Prefs.str(_refreshKey) != null;
String? refreshToken() => Prefs.str(_refreshKey);

void Function()? onUnauthorized;

DateTime? _expiresAt(String jwt) {
  try {
    final part = base64Url.normalize(jwt.split('.')[1]);
    final json = jsonDecode(utf8.decode(base64Url.decode(part))) as Map<String, Object?>;
    final exp = json['exp'];
    return exp is num ? DateTime.fromMillisecondsSinceEpoch((exp * 1000).toInt()) : null;
  } catch (_) {
    return null;
  }
}

Future<String?>? _refreshing;

Future<String?> _refresh() => _refreshing ??= () async {
  try {
    final token = Prefs.str(_refreshKey);
    if (token == null) return null;
    final res = await _client.post(
      Uri.parse('$kApiBase/auth/refresh'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refreshToken': token}),
    );
    if (res.statusCode >= 400) {
      if (const [400, 401, 403].contains(res.statusCode)) clearTokens();
      return null;
    }
    final data = jsonDecode(res.body) as Map<String, Object?>;
    saveTokens(data['accessToken'] as String, data['refreshToken'] as String);
    return data['accessToken'] as String;
  } catch (_) {
    return null;
  } finally {
    _refreshing = null;
  }
}();

Future<String?> _token() async {
  final token = Prefs.str(_accessKey);
  if (token == null) return _refresh();
  final exp = _expiresAt(token);
  if (exp == null || exp.isAfter(DateTime.now().add(_refreshSkew))) return token;
  return await _refresh() ?? (exp.isAfter(DateTime.now()) ? token : null);
}

ApiError _errorFrom(http.Response res, String path) {
  var message = 'API ${res.statusCode}: $path';
  try {
    final body = jsonDecode(res.body);
    final m = body is Map ? body['message'] : null;
    if (m is String) message = m;
    if (m is List && m.isNotEmpty && m.first is String) message = m.first as String;
  } catch (_) {}
  return ApiError(res.statusCode, message);
}

Future<Object?> apiRequest(String path, {String method = 'GET', Object? body, Map<String, Object?>? params, bool skipAuth = false}) async {
  final query = {
    for (final e in (params ?? const <String, Object?>{}).entries)
      if (e.value != null && '${e.value}'.isNotEmpty) e.key: '${e.value}',
  };
  final uri = Uri.parse('$kApiBase$path').replace(queryParameters: query.isEmpty ? null : query);
  final headers = <String, String>{if (body != null) 'Content-Type': 'application/json'};
  if (!skipAuth) {
    final t = await _token();
    if (t != null) headers['Authorization'] = 'Bearer $t';
  }
  Future<http.Response> send() {
    final req = http.Request(method, uri)..headers.addAll(headers);
    if (body != null) req.body = jsonEncode(body);
    return _client.send(req).then(http.Response.fromStream).timeout(const Duration(seconds: 30));
  }

  var res = await send();
  if (res.statusCode == 401 && !skipAuth) {
    final fresh = await _refresh();
    if (fresh != null) {
      headers['Authorization'] = 'Bearer $fresh';
      res = await send();
    } else {
      onUnauthorized?.call();
    }
  }
  if (res.statusCode >= 400) throw _errorFrom(res, path);
  return res.body.isEmpty ? null : jsonDecode(utf8.decode(res.bodyBytes));
}

Future<Object?> apiGet(String path, [Map<String, Object?>? params]) => apiRequest(path, params: params);
