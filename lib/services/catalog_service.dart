import 'package:http/http.dart' as http;
import 'package:xml/xml.dart';
import '../models/media_item.dart';
import '../models/channel_item.dart';

class CatalogService {
  static const Map<String, String> _gistSources = {
    'filme': 'https://gist.githubusercontent.com/skyrisk/5b87797329c7b46422565ffbaab3be7e/raw/page.xml',
    'serie': 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/SeriesBase',
    'anime': 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/AnimesBase',
    'dorama': 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/DoramasBase',
    'desenho': 'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/DesenhosBase',
    'novela': 'https://gist.githubusercontent.com/skyrisk/07f1f4cd1b203cbf2efec959c4e8645a/raw/novelas.xml',
  };

  static const String _channelsGistUrl =
      'https://gist.githubusercontent.com/skyrisk/16070347f20c87c72540f9f805b57a66/raw/724314f19365a9b0d37511b82e4ec72c89d639a3/channels.xml';

  /// Fetches media items (filmes, series, animes, etc.) directly from XML Gists
  /// Sempre adiciona timestamp na URL e headers no-cache para garantir dados 100% atualizados a cada abertura
  static Future<List<MediaItem>> fetchCategory(String category) async {
    final baseUrl = _gistSources[category];
    if (baseUrl == null) return [];

    try {
      // Cache buster com timestamp garante que nunca pegue resposta antiga
      final cacheBusterUri = Uri.parse('$baseUrl?t=${DateTime.now().millisecondsSinceEpoch}');
      final response = await http.get(
        cacheBusterUri,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      ).timeout(const Duration(seconds: 15));
      if (response.statusCode != 200) return [];

      final document = XmlDocument.parse(response.body);
      final items = <MediaItem>[];

      final tagName = category == 'filme' ? 'item' : 'channel';
      final elements = document.findAllElements(tagName);

      for (var element in elements) {
        final title = element.findElements('title').firstOrNull?.innerText.trim() ?? '';
        final poster = element.findElements('thumbnail').firstOrNull?.innerText.trim() ??
            element.findElements('poster').firstOrNull?.innerText.trim();
        final desc = element.findElements('description').firstOrNull?.innerText.trim();
        final link = element.findElements('link').firstOrNull?.innerText.trim() ?? '';

        if (title.isNotEmpty) {
          items.add(MediaItem(
            id: '${category}_${title.toLowerCase().replaceAll(RegExp(r'\s+'), '_')}',
            title: title,
            category: category,
            poster: poster,
            description: desc,
            streamUrl: link.isNotEmpty ? link : null,
          ));
        }
      }

      return items;
    } catch (e) {
      return [];
    }
  }

  /// Fetches Live TV channels directly from channels XML (Always fresh)
  static Future<List<ChannelItem>> fetchChannels() async {
    try {
      final cacheBusterUri = Uri.parse('$_channelsGistUrl?t=${DateTime.now().millisecondsSinceEpoch}');
      final response = await http.get(
        cacheBusterUri,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      ).timeout(const Duration(seconds: 15));
      if (response.statusCode != 200) return [];

      final document = XmlDocument.parse(response.body);
      final channels = <ChannelItem>[];
      final elements = document.findAllElements('channel');

      for (var element in elements) {
        final name = element.findElements('name').firstOrNull?.innerText.trim() ??
            element.findElements('title').firstOrNull?.innerText.trim() ?? '';
        final logo = element.findElements('logo').firstOrNull?.innerText.trim() ??
            element.findElements('thumbnail').firstOrNull?.innerText.trim();
        final streamUrl = element.findElements('stream_url').firstOrNull?.innerText.trim() ??
            element.findElements('link').firstOrNull?.innerText.trim() ?? '';
        final group = element.findElements('category').firstOrNull?.innerText.trim() ?? 'Geral';

        if (name.isNotEmpty && streamUrl.isNotEmpty) {
          channels.add(ChannelItem(
            id: 'channel_${name.toLowerCase().replaceAll(RegExp(r'\s+'), '_')}',
            name: name,
            category: group,
            streamUrl: streamUrl,
            logo: logo,
          ));
        }
      }

      return channels;
    } catch (e) {
      return [];
    }
  }
}
