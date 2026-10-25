import 'package:flutter/material.dart';

class DisclaimerModal {
  static void show(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1B2030),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.info_outline, color: Color(0xFF00E5FF)),
            SizedBox(width: 8),
            Text('Aviso Legal & Isenção', style: TextStyle(color: Colors.white, fontSize: 18)),
          ],
        ),
        content: const SingleChildScrollView(
          child: Text(
            '• PROJETO 100% GRATUITO E SEM FINS LUCRATIVOS:\n'
            'O DEEPFLIX é um projeto pessoal de código aberto desenvolvido para fins educacionais e de estudo. O aplicativo NUNCA cobrará nenhum valor, mensalidade ou taxa de acesso. Não pague a ninguém por este aplicativo.\n\n'
            '• APENAS AGREGADOR E INDEXADOR:\n'
            'O aplicativo opera exclusivamente como um indexador e reprodutor de links de mídia disponíveis publicamente na rede mundial de computadores (web).\n\n'
            '• ZERO SERVIDORES / ZERO HOSPEDAGEM:\n'
            'O aplicativo não hospeda, armazena, transmite ou faz upload de nenhum arquivo de vídeo, filme, série ou canal em servidores próprios. A reprodução ocorre via conexão direta entre o dispositivo do usuário e as fontes públicas.\n\n'
            '• PROPRIEDADE INTELECTUAL:\n'
            'Todos os direitos de propriedade intelectual, marcas e materiais audiovisuais pertencem aos seus respectivos proprietários legais.',
            style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.5),
          ),
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00E5FF),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Entendi e Aceito', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
