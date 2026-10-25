import 'package:flutter/foundation.dart';
import 'package:flutter_cast_framework/flutter_cast_framework.dart';

class CastService {
  static bool get isSupportedOnCurrentPlatform =>
      !kIsWeb && (defaultTargetPlatform == TargetPlatform.android || defaultTargetPlatform == TargetPlatform.iOS);

  static Future<void> castMedia({
    required String title,
    required String streamUrl,
    String? posterUrl,
  }) async {
    if (!isSupportedOnCurrentPlatform) return;

    try {
      final castContext = FlutterCastFramework.instance;
      final sessionManager = castContext.sessionManager;
      final currentSession = await sessionManager.currentCastSession;

      if (currentSession != null) {
        final mediaInfo = MediaInfo(
          contentId: streamUrl,
          streamType: StreamType.buffered,
          contentType: streamUrl.contains('.m3u8') ? 'application/x-mpegurl' : 'video/mp4',
          metadata: MediaMetadata(
            title: title,
            images: posterUrl != null ? [WebImage(Uri.parse(posterUrl))] : [],
          ),
        );

        final remoteMediaClient = currentSession.remoteMediaClient;
        await remoteMediaClient.load(MediaLoadRequestData(mediaInfo: mediaInfo, autoplay: true));
      }
    } catch (_) {}
  }
}
