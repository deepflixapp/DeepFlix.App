import 'dart:convert';
import 'package:http/http.dart' as http;

class FeedbackService {
  // Envio direto via serviço FormSubmit (ou Formspree) que entrega no Gmail sem expor senhas
  static const String _destinationEmail = 'deepflix.app@gmail.com';
  static const String _endpoint = 'https://formsubmit.co/ajax/deepflix.app@gmail.com';

  static Future<bool> sendFeedback({
    required String type, // 'Bug / Problema' ou 'Sugestão'
    required String message,
    String? userContact,
    String? channelOrMovieName,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(_endpoint),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: json.encode({
          '_subject': '[DEEPFLIX APP] Novo $type reportado',
          'tipo': type,
          'mensagem': message,
          'item_relacionado': channelOrMovieName ?? 'N/A',
          'contato_usuario': (userContact != null && userContact.isNotEmpty) ? userContact : 'Anônimo',
          '_captcha': 'false', // desativa captcha para requisição de app móvel/TV
        }),
      ).timeout(const Duration(seconds: 12));

      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}
