import 'package:flutter/material.dart';
import '../models/profile.dart';
import '../models/channel_item.dart';
import '../services/catalog_service.dart';
import '../widgets/tv_focusable.dart';
import '../widgets/cast_button.dart';
import '../widgets/feedback_dialog.dart';
import '../services/epg_service.dart';
import '../models/program_item.dart';
import 'player_screen.dart';
import 'streaming_home_screen.dart';

class LiveTvScreen extends StatefulWidget {
  final Profile profile;

  const LiveTvScreen({super.key, required this.profile});

  @override
  State<LiveTvScreen> createState() => _LiveTvScreenState();
}

class _LiveTvScreenState extends State<LiveTvScreen> {
  List<ChannelItem> _allChannels = [];
  List<ChannelItem> _filteredChannels = [];
  List<String> _categories = [];
  String _selectedCategory = 'Todos';
  bool _isLoading = true;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadChannels();
  }

  Future<void> _loadChannels() async {
    setState(() => _isLoading = true);
    final channels = await CatalogService.fetchChannels();
    final categoriesSet = <String>{'Todos'};
    for (var ch in channels) {
      if (ch.category.isNotEmpty) categoriesSet.add(ch.category);
    }

    setState(() {
      _allChannels = channels;
      _filteredChannels = channels;
      _categories = categoriesSet.toList();
      _isLoading = false;
    });

    // Dispara carregamento do Guia de Programação (EPG) em background
    EpgService.loadEpgInBackground().then((_) {
      if (mounted) setState(() {});
    });
  }

  void _filterChannels(String query) {
    setState(() {
      _filteredChannels = _allChannels.where((ch) {
        final matchesCat = _selectedCategory == 'Todos' || ch.category == _selectedCategory;
        final matchesQuery = query.isEmpty || ch.name.toLowerCase().contains(query.toLowerCase());
        return matchesCat && matchesQuery;
      }).toList();
    });
  }

  void _selectCategory(String cat) {
    setState(() {
      _selectedCategory = cat;
      _filterChannels(_searchController.text);
    });
  }

  void _openPlayer(ChannelItem channel) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PlayerScreen(
          profile: widget.profile,
          title: channel.name,
          streamUrl: channel.streamUrl,
          mediaId: channel.id,
          poster: channel.logo,
          liveChannel: channel,
        ),
      ),
    );
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
            const Icon(Icons.live_tv, color: Color(0xFFFF5252)),
            const SizedBox(width: 8),
            const Text('TV Ao Vivo', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            const SizedBox(width: 16),
            // Botão rápido para alternar para Streaming
            TvFocusable(
              onPressed: () {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(
                    builder: (_) => StreamingHomeScreen(profile: widget.profile),
                  ),
                );
              },
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF0072FF).withOpacity(0.25),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF00C6FF), width: 1),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.movie_filter, color: Color(0xFF00C6FF), size: 16),
                    SizedBox(width: 6),
                    Text(
                      'Ir para Streaming',
                      style: TextStyle(
                        color: Color(0xFF00C6FF),
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
            tooltip: 'Atualizar Canais',
            onPressed: _loadChannels,
          ),
          const CastButton(),
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF00E5FF)))
          : Column(
              children: [
                // Search bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                  child: TextField(
                    controller: _searchController,
                    onChanged: _filterChannels,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Buscar canal...',
                      hintStyle: const TextStyle(color: Colors.white38),
                      prefixIcon: const Icon(Icons.search, color: Colors.white70),
                      filled: true,
                      fillColor: const Color(0xFF1B2030),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                // Category Pills
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: _categories.length,
                    itemBuilder: (ctx, i) {
                      final cat = _categories[i];
                      final isSelected = cat == _selectedCategory;
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: TvFocusable(
                          onPressed: () => _selectCategory(cat),
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFFFF5252) : const Color(0xFF1E2333),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              cat,
                              style: TextStyle(
                                color: isSelected ? Colors.white : Colors.white70,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 12),
                // Channels Grid
                Expanded(
                  child: _filteredChannels.isEmpty
                      ? const Center(
                          child: Text('Nenhum canal encontrado', style: TextStyle(color: Colors.white54)),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                            maxCrossAxisExtent: 220,
                            childAspectRatio: 1.6,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                          ),
                          itemCount: _filteredChannels.length,
                          itemBuilder: (ctx, i) {
                            final channel = _filteredChannels[i];
                            final currentProgram = EpgService.getCurrentProgram(channel.name);

                            return TvFocusable(
                              onPressed: () => _openPlayer(channel),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: const Color(0xFF1B2030),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                padding: const EdgeInsets.all(12),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF262D42),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Icon(Icons.tv, color: Colors.white70),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            channel.name,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 13,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          // Exibe o que está passando agora (EPG)
                                          if (currentProgram != null) ...[
                                            Row(
                                              children: [
                                                const Icon(Icons.play_arrow, size: 12, color: Color(0xFF00E5FF)),
                                                const SizedBox(width: 2),
                                                Expanded(
                                                  child: Text(
                                                    currentProgram.title,
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                    style: const TextStyle(
                                                      color: Color(0xFF00E5FF),
                                                      fontSize: 11,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 3),
                                            ClipRRect(
                                              borderRadius: BorderRadius.circular(2),
                                              child: LinearProgressIndicator(
                                                value: currentProgram.progress,
                                                minHeight: 2.5,
                                                backgroundColor: Colors.white12,
                                                color: const Color(0xFF00E5FF),
                                              ),
                                            ),
                                          ] else ...[
                                            Text(
                                              channel.category,
                                              maxLines: 1,
                                              style: const TextStyle(
                                                color: Colors.white38,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }
}
