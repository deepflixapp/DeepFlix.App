import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/profile.dart';
import '../models/media_item.dart';

class StorageService {
  static const String _keyProfiles = 'deepflix_profiles';
  static const String _keyCurrentProfile = 'deepflix_current_profile_id';
  static const String _keyHistoryPrefix = 'deepflix_history_';
  static const String _keyFavPrefix = 'deepflix_favorites_';

  static SharedPreferences? _prefs;

  static Future<SharedPreferences> _getPrefs() async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  // Fallback em memória para o app NUNCA travar se o disco falhar
  static final List<Profile> _memoryProfiles = [
    Profile(
      id: 'default',
      name: 'Principal',
      avatar: '🎬',
      createdAt: DateTime.now(),
    )
  ];

  // --- Profiles ---
  static Future<List<Profile>> getProfiles() async {
    try {
      final prefs = await _getPrefs();
      final jsonString = prefs.getString(_keyProfiles);
      if (jsonString == null || jsonString.isEmpty) {
        final defaultProfile = Profile(
          id: 'default',
          name: 'Principal',
          avatar: '🎬',
          createdAt: DateTime.now(),
        );
        await saveProfile(defaultProfile);
        return [defaultProfile];
      }
      final List<dynamic> decoded = json.decode(jsonString);
      final list = decoded.map((e) => Profile.fromMap(e)).toList();
      return list.isNotEmpty ? list : _memoryProfiles;
    } catch (_) {
      return _memoryProfiles;
    }
  }

  static Future<void> saveProfile(Profile profile) async {
    try {
      final prefs = await _getPrefs();
      final list = await getProfiles();
      final index = list.indexWhere((p) => p.id == profile.id);
      if (index >= 0) {
        list[index] = profile;
      } else {
        list.add(profile);
      }
      await prefs.setString(_keyProfiles, json.encode(list.map((p) => p.toMap()).toList()));
    } catch (_) {}
  }

  static Future<void> deleteProfile(String profileId) async {
    try {
      final prefs = await _getPrefs();
      final list = await getProfiles();
      list.removeWhere((p) => p.id == profileId);
      await prefs.setString(_keyProfiles, json.encode(list.map((p) => p.toMap()).toList()));
      await prefs.remove('$_keyHistoryPrefix$profileId');
      await prefs.remove('$_keyFavPrefix$profileId');
    } catch (_) {}
  }

  static Future<String?> getCurrentProfileId() async {
    try {
      final prefs = await _getPrefs();
      return prefs.getString(_keyCurrentProfile);
    } catch (_) {
      return 'default';
    }
  }

  static Future<void> setCurrentProfileId(String id) async {
    try {
      final prefs = await _getPrefs();
      await prefs.setString(_keyCurrentProfile, id);
    } catch (_) {}
  }

  // --- Watch History per Profile ---
  static Future<List<WatchHistoryItem>> getHistory(String profileId) async {
    try {
      final prefs = await _getPrefs();
      final jsonString = prefs.getString('$_keyHistoryPrefix$profileId');
      if (jsonString == null || jsonString.isEmpty) return [];
      final List<dynamic> decoded = json.decode(jsonString);
      return decoded.map((e) => WatchHistoryItem.fromMap(e)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<void> saveWatchProgress(WatchHistoryItem item) async {
    try {
      final prefs = await _getPrefs();
      final list = await getHistory(item.profileId);
      list.removeWhere((h) => h.mediaId == item.mediaId);
      list.insert(0, item);
      if (list.length > 50) list.removeRange(50, list.length);
      await prefs.setString('$_keyHistoryPrefix${item.profileId}', json.encode(list.map((e) => e.toMap()).toList()));
    } catch (_) {}
  }

  // --- Favorites per Profile ---
  static Future<List<String>> getFavorites(String profileId) async {
    try {
      final prefs = await _getPrefs();
      return prefs.getStringList('$_keyFavPrefix$profileId') ?? [];
    } catch (_) {
      return [];
    }
  }

  static Future<void> toggleFavorite(String profileId, String mediaOrChannelId) async {
    try {
      final prefs = await _getPrefs();
      final favs = await getFavorites(profileId);
      if (favs.contains(mediaOrChannelId)) {
        favs.remove(mediaOrChannelId);
      } else {
        favs.add(mediaOrChannelId);
      }
      await prefs.setStringList('$_keyFavPrefix$profileId', favs);
    } catch (_) {}
  }
}
