import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/profile.dart';
import '../models/media_item.dart';

class StorageService {
  static const String _keyProfiles = 'deepflix_profiles';
  static const String _keyCurrentProfile = 'deepflix_current_profile_id';
  static const String _keyHistoryPrefix = 'deepflix_history_';
  static const String _keyFavPrefix = 'deepflix_favorites_';

  // --- Profiles ---
  static Future<List<Profile>> getProfiles() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString(_keyProfiles);
    if (jsonString == null || jsonString.isEmpty) {
      // Default profile if none exist
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
    return decoded.map((e) => Profile.fromMap(e)).toList();
  }

  static Future<void> saveProfile(Profile profile) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getProfiles();
    final index = list.indexWhere((p) => p.id == profile.id);
    if (index >= 0) {
      list[index] = profile;
    } else {
      list.add(profile);
    }
    await prefs.setString(_keyProfiles, json.encode(list.map((p) => p.toMap()).toList()));
  }

  static Future<void> deleteProfile(String profileId) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getProfiles();
    list.removeWhere((p) => p.id == profileId);
    await prefs.setString(_keyProfiles, json.encode(list.map((p) => p.toMap()).toList()));
    // Clear history and favorites of this profile
    await prefs.remove('$_keyHistoryPrefix$profileId');
    await prefs.remove('$_keyFavPrefix$profileId');
  }

  static Future<String?> getCurrentProfileId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyCurrentProfile);
  }

  static Future<void> setCurrentProfileId(String id) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyCurrentProfile, id);
  }

  // --- Watch History per Profile ---
  static Future<List<WatchHistoryItem>> getHistory(String profileId) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString('$_keyHistoryPrefix$profileId');
    if (jsonString == null || jsonString.isEmpty) return [];
    final List<dynamic> decoded = json.decode(jsonString);
    return decoded.map((e) => WatchHistoryItem.fromMap(e)).toList();
  }

  static Future<void> saveWatchProgress(WatchHistoryItem item) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getHistory(item.profileId);
    list.removeWhere((h) => h.mediaId == item.mediaId);
    list.insert(0, item); // latest first
    // Limit to 50 items
    if (list.length > 50) list.removeRange(50, list.length);
    await prefs.setString('$_keyHistoryPrefix${item.profileId}', json.encode(list.map((e) => e.toMap()).toList()));
  }

  // --- Favorites per Profile ---
  static Future<List<String>> getFavorites(String profileId) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList('$_keyFavPrefix$profileId') ?? [];
  }

  static Future<void> toggleFavorite(String profileId, String mediaOrChannelId) async {
    final prefs = await SharedPreferences.getInstance();
    final favs = await getFavorites(profileId);
    if (favs.contains(mediaOrChannelId)) {
      favs.remove(mediaOrChannelId);
    } else {
      favs.add(mediaOrChannelId);
    }
    await prefs.setStringList('$_keyFavPrefix$profileId', favs);
  }
}
