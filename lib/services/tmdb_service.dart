import 'dart:convert';
import 'package:http/http.dart' as http;

class TmdbService {
  static const String _readToken =
      'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxYzc0YTFkYjA2NmYwOWU4NDYzYTBkMDZiMDdlNTczNCIsIm5iZiI6MTc5MjU1ODY1Ny4zNjYwMDAyLCJzdWIiOiI2YWQ4NDY0MTljZDlmNjY0ZThlYzMyMmUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.rgR8Aqjfnjh5ooX8183IeK32uo-3QMcTzentGbYy5Ow';
  static const String _baseUrl = 'https://api.themoviedb.org/3';
  static const String imageBaseUrl = 'https://image.tmdb.org/t/p/w500';

  static Map<String, String> get _headers => {
        'Authorization': 'Bearer $_readToken',
        'Content-Type': 'application/json;charset=utf-8',
      };

  static Future<Map<String, dynamic>?> searchMedia(String query, {bool isTv = false}) async {
    try {
      final endpoint = isTv ? '/search/tv' : '/search/movie';
      final uri = Uri.parse('$_baseUrl$endpoint?query=${Uri.encodeComponent(query)}&language=pt-BR');
      final response = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final results = data['results'] as List<dynamic>?;
        if (results != null && results.isNotEmpty) {
          return results.first as Map<String, dynamic>;
        }
      }
    } catch (_) {}
    return null;
  }
}
