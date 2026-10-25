import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:xml/xml.dart';
import '../models/program_item.dart';

class EpgService {
  // Feed EPG público brasileiro atualizado diariamente
  static const String _epgUrl = 'https://epg.lat/files/br.xml.gz';
  static final Map<String, ProgramItem> _currentPrograms = {};
  static bool _isLoading = false;

  /// Retorna o programa atual ("Passando Agora") para o canal informado
  static ProgramItem? getCurrentProgram(String channelName) {
    final normalized = _normalize(channelName);
    return _currentPrograms[normalized];
  }

  static String _normalize(String name) {
    return name
        .toLowerCase()
        .replaceAll(RegExp(r'\b(fhd|hd|sd|4k|br|brasil|aovivo|ao vivo)\b'), '')
        .replaceAll(RegExp(r'[^a-z0-9]'), '')
        .trim();
  }

  /// Carrega o guia de programação em segundo plano de forma assíncrona e leve
  static Future<void> loadEpgInBackground() async {
    if (_isLoading || _currentPrograms.isNotEmpty) return;
    _isLoading = true;

    try {
      // Baixar feed de programação (ou espelho leve)
      final response = await http.get(
        Uri.parse('https://raw.githubusercontent.com/limaalef/BrazilTVEPG/main/epg.xml'),
        headers: {'Accept-Encoding': 'gzip'},
      ).timeout(const Duration(seconds: 12));

      if (response.statusCode == 200) {
        final document = XmlDocument.parse(response.body);
        final now = DateTime.now();

        final programmes = document.findAllElements('programme');
        for (var prog in programmes) {
          final channelId = prog.getAttribute('channel') ?? '';
          final startStr = prog.getAttribute('start') ?? '';
          final stopStr = prog.getAttribute('stop') ?? '';

          final start = _parseEpgDate(startStr);
          final stop = _parseEpgDate(stopStr);

          if (start != null && stop != null && now.isAfter(start) && now.isBefore(stop)) {
            final title = prog.findElements('title').firstOrNull?.innerText.trim() ?? '';
            final desc = prog.findElements('desc').firstOrNull?.innerText.trim();

            if (title.isNotEmpty) {
              final normChannel = _normalize(channelId);
              _currentPrograms[normChannel] = ProgramItem(
                title: title,
                description: desc,
                startTime: start,
                endTime: stop,
              );
            }
          }
        }
      }
    } catch (_) {
      // Falha silenciosa: o app segue funcionando normalmente mesmo sem EPG
    } finally {
      _isLoading = false;
    }
  }

  static DateTime? _parseEpgDate(String raw) {
    if (raw.length < 14) return null;
    try {
      final y = int.parse(raw.substring(0, 4));
      final m = int.parse(raw.substring(4, 6));
      final d = int.parse(raw.substring(6, 8));
      final h = int.parse(raw.substring(8, 10));
      final min = int.parse(raw.substring(10, 12));
      final s = int.parse(raw.substring(12, 14));
      return DateTime(y, m, d, h, min, s);
    } catch (_) {
      return null;
    }
  }
}
