import 'package:flutter/material.dart';
import '../models/profile.dart';
import '../models/media_item.dart';
import '../services/catalog_service.dart';
import '../services/storage_service.dart';
import '../widgets/media_card.dart';
import '../widgets/cast_button.dart';
import '../widgets/tv_focusable.dart';
import '../widgets/feedback_dialog.dart';
import 'player_screen.dart';
import 'media_details_screen.dart';
import 'live_tv_screen.dart';

class StreamingHomeScreen extends StatefulWidget {
  final Profile profile;

  const StreamingHomeScreen({super.key, required this.profile});

  @override
  State<StreamingHomeScreen> createState() => _StreamingHomeScreenState();
}

class _StreamingHomeScreenState extends State<StreamingHomeScreen> {
  final Map<String, List<MediaItem>> _sections = {};
  List<WatchHistoryItem> _continueWatching = [];
  bool _isLoading = true;

  final List<Map<String, String>> _categories = [
    {'id': 'filme', 'label': 'Filmes'},
    {'id': 'serie', 'label': 'Séries'},
    {'id': 'anime', 'label': 'Animes'},
    {'id': 'dorama', 'label': 'Doramas'},
    {'id': 'desenho', 'label': 'Desenhos'},
    {'id': 'novela', 'label': 'Novelas'},
  ];

  @override
  void initState() {
    super.initState();
    _loadCatalog();
  }

  Future<void> _loadCatalog() async {
    setState(() => _isLoading = true);

    // Load watch history for current profile
    final history = await StorageService.getHistory(widget.profile.id);

    // Fetch initial categories in parallel
    for (var cat in _categories) {
      final items = await CatalogService.fetchCategory(cat['id']!);
      _sections[cat['id']!] = items;
    }

    setState(() {
      _continueWatching = history;
      _isLoading = false;
    });
  }

  void _openDetails(MediaItem item) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => MediaDetailsScreen(
          profile: widget.profile,
          item: item,
        ),
      ),
    ).then((_) {
      // Refresh history upon return
      StorageService.getHistory(widget.profile.id).then((hist) {
        if (mounted) setState(() => _continueWatching = hist);
      });
    });
  }

  void _resumeMedia(WatchHistoryItem item) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PlayerScreen(
          profile: widget.profile,
          title: item.title,
          streamUrl: item.streamUrl,
          mediaId: item.mediaId,
          poster: item.poster,
          initialPositionSeconds: item.positionSeconds,
        ),
      ),
    ).then((_) {
      StorageService.getHistory(widget.profile.id).then((hist) {
        if (mounted) setState(() => _continueWatching = hist);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0E1118),
      appBar: AppBar(
        backgroundColor: const Color(0xFF161A24),
        elevation: 0,
        title: Row(
          children: [
            const Text(
              'DEEPFLIX',
              style: TextStyle(
                color: Color(0xFF00E5FF),
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(width: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF262D42),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Text(widget.profile.avatar, style: const TextStyle(fontSize: 14)),
                  const SizedBox(width: 4),
                  Text(
                    widget.profile.name,
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            // Botão rápido para alternar para TV Ao Vivo
            TvFocusable(
              onPressed: () {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(
                    builder: (_) => LiveTvScreen(profile: widget.profile),
                  ),
                );
              },
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFE50914).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFFF5252), width: 1),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.live_tv, color: Color(0xFFFF5252), size: 16),
                    SizedBox(width: 6),
                    Text(
                      'Ir para TV Ao Vivo',
                      style: TextStyle(
                        color: Color(0xFFFF5252),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.feedback_outlined, color: Colors.white70),
            tooltip: 'Reportar Bug ou Sugestão',
            onPressed: () => FeedbackDialog.show(context),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            tooltip: 'Atualizar Catálogo',
            onPressed: _loadCatalog,
          ),
          const CastButton(),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)))
          : ListView(
              padding: const EdgeInsets.symmetric(vertical: 16),
              children: [
                // "Continuar Assistindo" Section (if available)
                if (_continueWatching.isNotEmpty) ...[
                  _buildSectionHeader('Continuar Assistindo (${widget.profile.name})'),
                  SizedBox(
                    height: 190,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _continueWatching.length,
                      itemBuilder: (ctx, i) {
                        final item = _continueWatching[i];
                        final progress = item.durationSeconds > 0
                            ? (item.positionSeconds / item.durationSeconds).clamp(0.0, 1.0)
                            : 0.0;

                        return Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: TvFocusable(
                            onPressed: () => _resumeMedia(item),
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              width: 150,
                              decoration: BoxDecoration(
                                color: const Color(0xFF1B2030),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Container(
                                      color: const Color(0xFF262D42),
                                      child: const Center(
                                        child: Icon(Icons.play_circle_fill, size: 48, color: Color(0xFF00E5FF)),
                                      ),
                                    ),
                                  ),
                                  LinearProgressIndicator(
                                    value: progress,
                                    backgroundColor: Colors.white12,
                                    color: const Color(0xFF00E5FF),
                                    minHeight: 4,
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(8.0),
                                    child: Text(
                                      item.title,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // Categories Carousels
                for (var cat in _categories)
                  if (_sections[cat['id']] != null && _sections[cat['id']]!.isNotEmpty) ...[
                    _buildSectionHeader(cat['label']!),
                    SizedBox(
                      height: 220,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _sections[cat['id']]!.length,
                        itemBuilder: (ctx, i) {
                          final item = _sections[cat['id']]![i];
                          return Padding(
                            padding: const EdgeInsets.only(right: 12),
                            child: MediaCard(
                              item: item,
                              onTap: () => _openDetails(item),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
              ],
            ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Text(
        title,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
