import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/profile.dart';
import '../models/media_item.dart';
import '../services/tmdb_service.dart';
import '../services/storage_service.dart';
import '../widgets/tv_focusable.dart';
import '../widgets/cast_button.dart';
import 'player_screen.dart';

class MediaDetailsScreen extends StatefulWidget {
  final Profile profile;
  final MediaItem item;

  const MediaDetailsScreen({
    super.key,
    required this.profile,
    required this.item,
  });

  @override
  State<MediaDetailsScreen> createState() => _MediaDetailsScreenState();
}

class _MediaDetailsScreenState extends State<MediaDetailsScreen> {
  String? _synopsis;
  String? _backdropUrl;
  String? _releaseYear;
  double? _rating;
  bool _loadingTmdb = true;
  bool _isFavorite = false;

  @override
  void initState() {
    super.initState();
    _synopsis = widget.item.description;
    _checkFavorite();
    _loadTmdbDetails();
  }

  Future<void> _checkFavorite() async {
    final favs = await StorageService.getFavorites(widget.profile.id);
    if (mounted) {
      setState(() => _isFavorite = favs.contains(widget.item.id));
    }
  }

  Future<void> _loadTmdbDetails() async {
    final isTv = widget.item.category != 'filme';
    final tmdbData = await TmdbService.searchMedia(widget.item.title, isTv: isTv);

    if (mounted) {
      if (tmdbData != null) {
        setState(() {
          _synopsis = (tmdbData['overview'] as String?)?.isNotEmpty == true
              ? tmdbData['overview']
              : _synopsis;
          final backdropPath = tmdbData['backdrop_path'] as String?;
          if (backdropPath != null) {
            _backdropUrl = '${TmdbService.imageBaseUrl}$backdropPath';
          }
          final dateStr = (tmdbData['release_date'] ?? tmdbData['first_air_date']) as String?;
          if (dateStr != null && dateStr.length >= 4) {
            _releaseYear = dateStr.substring(0, 4);
          }
          _rating = (tmdbData['vote_average'] as num?)?.toDouble();
          _loadingTmdb = false;
        });
      } else {
        setState(() => _loadingTmdb = false);
      }
    }
  }

  void _startPlayback() {
    if (widget.item.streamUrl == null || widget.item.streamUrl!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Link de vídeo não disponível')),
      );
      return;
    }

    // Play manual em tela cheia direta
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PlayerScreen(
          profile: widget.profile,
          title: widget.item.title,
          streamUrl: widget.item.streamUrl!,
          mediaId: widget.item.id,
          poster: widget.item.poster,
        ),
      ),
    );
  }

  void _toggleFav() async {
    await StorageService.toggleFavorite(widget.profile.id, widget.item.id);
    setState(() => _isFavorite = !_isFavorite);
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isLargeScreen = screenWidth > 720;

    return Scaffold(
      backgroundColor: const Color(0xFF0E1118),
      body: Stack(
        children: [
          // Backdrop de Fundo com Gradiente
          if (_backdropUrl != null || widget.item.backdrop != null)
            Positioned.fill(
              child: Opacity(
                opacity: 0.35,
                child: CachedNetworkImage(
                  imageUrl: _backdropUrl ?? widget.item.backdrop!,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => const SizedBox.shrink(),
                ),
              ),
            ),
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Color(0xFF0E1118),
                    Colors.transparent,
                    Color(0xFF0E1118),
                  ],
                  stops: [0.0, 0.4, 0.95],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),

          // Conteúdo da Tela
          SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white, size: 28),
                        onPressed: () => Navigator.pop(context),
                      ),
                      const Spacer(),
                      CastButton(color: Colors.white),
                    ],
                  ),
                ),

                // Detalhes da Mídia
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Pôster
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            width: isLargeScreen ? 200 : 130,
                            height: isLargeScreen ? 300 : 195,
                            color: const Color(0xFF1E2230),
                            child: widget.item.poster != null && widget.item.poster!.isNotEmpty
                                ? CachedNetworkImage(
                                    imageUrl: widget.item.poster!,
                                    fit: BoxFit.cover,
                                    placeholder: (_, __) => const Center(
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF00E5FF)),
                                    ),
                                    errorWidget: (_, __, ___) => const Icon(Icons.movie, size: 50, color: Colors.white24),
                                  )
                                : const Icon(Icons.movie, size: 50, color: Colors.white24),
                          ),
                        ),
                        const SizedBox(width: 24),

                        // Informações e Ações
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.item.title,
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: isLargeScreen ? 32 : 22,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(height: 8),

                              // Metadados (Ano, Categoria, Avaliação)
                              Wrap(
                                spacing: 12,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  if (_releaseYear != null)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.white12,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        _releaseYear!,
                                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                                      ),
                                    ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF00E5FF).withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      widget.item.category.toUpperCase(),
                                      style: const TextStyle(color: Color(0xFF00E5FF), fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  if (_rating != null && _rating! > 0)
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.star, color: Colors.amber, size: 16),
                                        const SizedBox(width: 4),
                                        Text(
                                          _rating!.toStringAsFixed(1),
                                          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                                        ),
                                      ],
                                    ),
                                ],
                              ),
                              const SizedBox(height: 20),

                              // Botões de Ação (Play Manual e Favorito)
                              Wrap(
                                spacing: 16,
                                runSpacing: 12,
                                children: [
                                  TvFocusable(
                                    autofocus: true,
                                    onPressed: _startPlayback,
                                    borderRadius: BorderRadius.circular(12),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF00E5FF),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.play_arrow, color: Colors.black, size: 28),
                                          SizedBox(width: 8),
                                          Text(
                                            'Assistir Agora',
                                            style: TextStyle(
                                              color: Colors.black,
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  TvFocusable(
                                    onPressed: _toggleFav,
                                    borderRadius: BorderRadius.circular(12),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF1E2333),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            _isFavorite ? Icons.favorite : Icons.favorite_border,
                                            color: _isFavorite ? Colors.redAccent : Colors.white70,
                                            size: 24,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            _isFavorite ? 'Salvo' : 'Minha Lista',
                                            style: const TextStyle(color: Colors.white, fontSize: 14),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 24),

                              // Sinopse
                              const Text(
                                'Sinopse',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),
                              _loadingTmdb
                                  ? const Text(
                                      'Buscando informações...',
                                      style: TextStyle(color: Colors.white38, fontSize: 14),
                                    )
                                  : Text(
                                      _synopsis != null && _synopsis!.isNotEmpty
                                          ? _synopsis!
                                          : 'Sinopse não disponível para este título.',
                                      style: const TextStyle(
                                        color: Colors.white70,
                                        fontSize: 14,
                                        height: 1.5,
                                      ),
                                    ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
