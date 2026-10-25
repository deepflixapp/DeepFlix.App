class MediaItem {
  final String id;
  final String title;
  final String category; // filme, serie, anime, dorama, desenho, novela
  final String? poster;
  final String? backdrop;
  final String? description;
  final String? streamUrl;
  final String? tmdbId;
  final List<MediaSeason>? seasons;

  MediaItem({
    required this.id,
    required this.title,
    required this.category,
    this.poster,
    this.backdrop,
    this.description,
    this.streamUrl,
    this.tmdbId,
    this.seasons,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'category': category,
      'poster': poster,
      'backdrop': backdrop,
      'description': description,
      'streamUrl': streamUrl,
      'tmdbId': tmdbId,
    };
  }
}

class MediaSeason {
  final int seasonNumber;
  final String title;
  final List<MediaEpisode> episodes;

  MediaSeason({
    required this.seasonNumber,
    required this.title,
    required this.episodes,
  });
}

class MediaEpisode {
  final int episodeNumber;
  final String title;
  final String streamUrl;

  MediaEpisode({
    required this.episodeNumber,
    required this.title,
    required this.streamUrl,
  });
}

class WatchHistoryItem {
  final String profileId;
  final String mediaId;
  final String title;
  final String? poster;
  final String streamUrl;
  final int positionSeconds;
  final int durationSeconds;
  final DateTime updatedAt;

  WatchHistoryItem({
    required this.profileId,
    required this.mediaId,
    required this.title,
    this.poster,
    required this.streamUrl,
    required this.positionSeconds,
    required this.durationSeconds,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'profileId': profileId,
      'mediaId': mediaId,
      'title': title,
      'poster': poster,
      'streamUrl': streamUrl,
      'positionSeconds': positionSeconds,
      'durationSeconds': durationSeconds,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory WatchHistoryItem.fromMap(Map<String, dynamic> map) {
    return WatchHistoryItem(
      profileId: map['profileId'] ?? '',
      mediaId: map['mediaId'] ?? '',
      title: map['title'] ?? '',
      poster: map['poster'],
      streamUrl: map['streamUrl'] ?? '',
      positionSeconds: map['positionSeconds'] ?? 0,
      durationSeconds: map['durationSeconds'] ?? 0,
      updatedAt: DateTime.tryParse(map['updatedAt'] ?? '') ?? DateTime.now(),
    );
  }
}
