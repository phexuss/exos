String formatTime(num sec) {
  if (sec.isNaN || sec.isInfinite || sec < 0) return '0:00';
  final total = sec.floor();
  final h = total ~/ 3600, m = (total % 3600) ~/ 60;
  final s = (total % 60).toString().padLeft(2, '0');
  return h > 0 ? '$h:${m.toString().padLeft(2, '0')}:$s' : '$m:$s';
}

String formatTotal(int sec) {
  final min = (sec / 60).round();
  if (min < 60) return '$min мин';
  return '${min ~/ 60} ч ${min % 60} мин';
}

/// Russian plural: plural(5, ['трек', 'трека', 'треков']).
String plural(int n, List<String> forms) {
  final mod10 = n % 10, mod100 = n % 100;
  if (mod10 == 1 && mod100 != 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

String tracksLabel(int n) => '$n ${plural(n, ['трек', 'трека', 'треков'])}';

String formatCount(int n) {
  if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1).replaceAll('.0', '')} млн';
  if (n >= 1000) return '${(n / 1000).round()} тыс';
  return '$n';
}

/// "Kai Angel & 9mice" → "Kai Angel": lyrics and Last.fm match on the lead artist.
String primaryArtist(String artist) => artist.split(RegExp(r'\s*[&,]\s*|\s+feat\.?\s+|\s+ft\.?\s+', caseSensitive: false)).first.trim();

/// A stable number from a string, for placeholder hues and generated art.
int seedHash(String seed) {
  var h = 0;
  for (final c in seed.codeUnits) {
    h = (h * 31 + c) & 0x7fffffff;
  }
  return h;
}
