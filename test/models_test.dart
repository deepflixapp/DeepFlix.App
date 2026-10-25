import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:deepflix_app/models/profile.dart';
import 'package:deepflix_app/models/media_item.dart';
import 'package:deepflix_app/models/channel_item.dart';

void main() {
  group('Models & Data Integrity Tests', () {
    test('Profile serialization and deserialization', () {
      final profile = Profile(
        id: 'user_123',
        name: 'Carlos',
        avatar: '🍿',
        createdAt: DateTime(2026, 10, 25),
      );

      final map = profile.toMap();
      expect(map['id'], 'user_123');
      expect(map['name'], 'Carlos');
      expect(map['avatar'], '🍿');

      final fromMap = Profile.fromMap(map);
      expect(fromMap.id, profile.id);
      expect(fromMap.name, profile.name);
      expect(fromMap.avatar, profile.avatar);
    });

    test('WatchHistoryItem serialization with progress', () {
      final history = WatchHistoryItem(
        profileId: 'user_123',
        mediaId: 'filme_matrix',
        title: 'Matrix',
        poster: 'https://image.tmdb.org/matrix.jpg',
        streamUrl: 'https://stream.example.com/matrix.m3u8',
        positionSeconds: 1200,
        durationSeconds: 7200,
        updatedAt: DateTime.now(),
      );

      final map = history.toMap();
      final reconstructed = WatchHistoryItem.fromMap(map);

      expect(reconstructed.profileId, 'user_123');
      expect(reconstructed.positionSeconds, 1200);
      expect(reconstructed.durationSeconds, 7200);
      expect(reconstructed.streamUrl, contains('matrix.m3u8'));
    });

    test('ChannelItem parsing verification', () {
      final channelMap = {
        'id': 'ch_globo',
        'name': 'Globo SP',
        'category': 'Abertos',
        'streamUrl': 'https://stream.example.com/globo.m3u8',
        'logo': 'https://logo.example.com/globo.png',
      };

      final channel = ChannelItem.fromMap(channelMap);
      expect(channel.name, 'Globo SP');
      expect(channel.category, 'Abertos');
      expect(channel.streamUrl, startsWith('https://'));
    });
  });
}
