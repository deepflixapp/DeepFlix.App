import '../models/media_item.dart';
import '../models/channel_item.dart';
import '../services/catalog_service.dart';
import '../services/epg_service.dart';

class MatchService {
  /// Procura se o programa que está passando ao vivo na TV tem correspondente no catálogo on-demand de Streaming
  static Future<MediaItem?> findOnDemandMatch(ChannelItem channel) async {
    final currentProgram = EpgService.getCurrentProgram(channel.name);
    if (currentProgram == null || currentProgram.title.isEmpty) return null;

    final query = _cleanTitle(currentProgram.title);
    if (query.length < 3) return null;

    // Busca nas categorias de filmes e séries
    final categories = ['filme', 'serie', 'anime', 'dorama', 'desenho'];
    for (var cat in categories) {
      final items = await CatalogService.fetchCategory(cat);
      for (var item in items) {
        if (_titlesMatch(item.title, query)) {
          return item;
        }
      }
    }
    return null;
  }

  static String _cleanTitle(String raw) {
    return raw
        .toLowerCase()
        .replaceAll(RegExp(r'\b(filme:|série:|serie:|ep\.?|temp\.?|\d+ª|\d+x\d+)\b'), '')
        .replaceAll(RegExp(r'[^a-z0-9\s]'), '')
        .trim();
  }

  static bool _titlesMatch(String a, String b) {
    final normA = _cleanTitle(a);
    final normB = _cleanTitle(b);
    return normA.contains(normB) || normB.contains(normA);
  }
}
