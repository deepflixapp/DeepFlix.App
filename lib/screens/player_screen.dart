import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart' hide CastButton;
import '../models/profile.dart';
import '../models/media_item.dart';
import '../services/storage_service.dart';
import '../services/cast_service.dart';
import '../widgets/cast_button.dart';
import '../models/channel_item.dart';
import '../services/match_service.dart';
import 'media_details_screen.dart';

class PlayerScreen extends StatefulWidget {
  final Profile profile;
  final String title;
  final String streamUrl;
  final String mediaId;
  final String? poster;
  final int? initialPositionSeconds;
  final ChannelItem? liveChannel;

  const PlayerScreen({
    super.key,
    required this.profile,
    required this.title,
    required this.streamUrl,
    required this.mediaId,
    this.poster,
    this.initialPositionSeconds,
    this.liveChannel,
  });

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  VideoPlayerController? _videoPlayerController;
  ChewieController? _chewieController;
  bool _isLoading = true;
  String? _errorMessage;
  MediaItem? _onDemandMatch;
  bool _searchingMatch = false;

  @override
  void initState() {
    super.initState();
    // Esconder barras do sistema (Fullscreen imersivo)
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    // Forçar orientação horizontal (Landscape)
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    _initPlayer();
    _checkLiveMatch();
  }

  void _checkLiveMatch() async {
    if (widget.liveChannel != null) {
      setState(() => _searchingMatch = true);
      final match = await MatchService.findOnDemandMatch(widget.liveChannel!);
      if (mounted) {
        setState(() {
          _onDemandMatch = match;
          _searchingMatch = false;
        });
      }
    }
  }

  Future<void> _initPlayer() async {
    try {
      _videoPlayerController = VideoPlayerController.networkUrl(
        Uri.parse(widget.streamUrl),
      );

      await _videoPlayerController!.initialize();

      if (widget.initialPositionSeconds != null && widget.initialPositionSeconds! > 0) {
        await _videoPlayerController!.seekTo(Duration(seconds: widget.initialPositionSeconds!));
      }

      _chewieController = ChewieController(
        videoPlayerController: _videoPlayerController!,
        autoPlay: true,
        looping: false,
        fullScreenByDefault: true,
        allowFullScreen: true,
        allowMuting: true,
        showControls: true,
        materialProgressColors: ChewieProgressColors(
          playedColor: const Color(0xFF00E5FF),
          handleColor: const Color(0xFF00E5FF),
          backgroundColor: Colors.white24,
          bufferedColor: Colors.white54,
        ),
      );

      _videoPlayerController!.addListener(_onPlaybackUpdate);

      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Não foi possível reproduzir este vídeo: $e';
      });
    }
  }

  void _onPlaybackUpdate() {
    if (_videoPlayerController == null || !_videoPlayerController!.value.isInitialized) return;

    final position = _videoPlayerController!.value.position.inSeconds;
    final duration = _videoPlayerController!.value.duration.inSeconds;

    // Save watch progress periodically (every 5 seconds)
    if (position > 0 && position % 5 == 0) {
      StorageService.saveWatchProgress(
        WatchHistoryItem(
          profileId: widget.profile.id,
          mediaId: widget.mediaId,
          title: widget.title,
          poster: widget.poster,
          streamUrl: widget.streamUrl,
          positionSeconds: position,
          durationSeconds: duration,
          updatedAt: DateTime.now(),
        ),
      );
    }
  }

  @override
  void dispose() {
    // Restaurar barras de sistema (UI normal)
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    // Restaurar orientação
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);

    // Save final progress on exit
    if (_videoPlayerController != null && _videoPlayerController!.value.isInitialized) {
      final position = _videoPlayerController!.value.position.inSeconds;
      final duration = _videoPlayerController!.value.duration.inSeconds;
      StorageService.saveWatchProgress(
        WatchHistoryItem(
          profileId: widget.profile.id,
          mediaId: widget.mediaId,
          title: widget.title,
          poster: widget.poster,
          streamUrl: widget.streamUrl,
          positionSeconds: position,
          durationSeconds: duration,
          updatedAt: DateTime.now(),
        ),
      );
    }

    _videoPlayerController?.removeListener(_onPlaybackUpdate);
    _videoPlayerController?.dispose();
    _chewieController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Center(
            child: _isLoading
                ? const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(color: Color(0xFF00E5FF)),
                      SizedBox(height: 16),
                      Text('Carregando stream...', style: TextStyle(color: Colors.white70)),
                    ],
                  )
                : _errorMessage != null
                    ? Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.redAccent, fontSize: 16),
                          textAlign: TextAlign.center,
                        ),
                      )
                    : Chewie(controller: _chewieController!),
          ),
          // Top bar overlay for back button and Chromecast
          Positioned(
            top: 20,
            left: 20,
            right: 20,
            child: SafeArea(
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white, size: 28),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      widget.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        shadows: [Shadow(blurRadius: 4, color: Colors.black)],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  // Botão Inteligente: Assistir do Início (Streaming)
                  if (_onDemandMatch != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 12.0),
                      child: GestureDetector(
                        onTap: () {
                          // Abre a mídia on-demand direto do início
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(
                              builder: (_) => MediaDetailsScreen(
                                profile: widget.profile,
                                item: _onDemandMatch!,
                              ),
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF00E5FF),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF00E5FF).withOpacity(0.4),
                                blurRadius: 8,
                              )
                            ],
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.replay, color: Colors.black, size: 16),
                              SizedBox(width: 6),
                              Text(
                                'Assistir do Início',
                                style: TextStyle(
                                  color: Colors.black,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  CastButton(color: Colors.white),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
