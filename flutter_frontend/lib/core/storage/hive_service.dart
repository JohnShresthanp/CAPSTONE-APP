import 'package:hive_flutter/hive_flutter.dart';

class HiveService {
  static const String _boxName = 'app_cache';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(_boxName);
  }

  static Box get _box => Hive.box(_boxName);

  static Future<void> put(String key, dynamic value) async {
    await _box.put(key, value);
  }

  static dynamic get(String key) {
    return _box.get(key);
  }

  static Future<void> delete(String key) async {
    await _box.delete(key);
  }

  static Future<void> clear() async {
    await _box.clear();
  }

  static Future<void> putList<T>(String key, List<T> value) async {
    await _box.put(key, value);
  }

  static List<T> getList<T>(String key) {
    final data = _box.get(key);
    if (data is List) {
      return data.cast<T>();
    }
    return [];
  }
}
