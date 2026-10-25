import 'package:flutter/material.dart';
import '../services/feedback_service.dart';
import 'tv_focusable.dart';

class FeedbackDialog extends StatefulWidget {
  final String? initialContextItem;

  const FeedbackDialog({super.key, this.initialContextItem});

  static void show(BuildContext context, {String? initialContextItem}) {
    showDialog(
      context: context,
      builder: (_) => FeedbackDialog(initialContextItem: initialContextItem),
    );
  }

  @override
  State<FeedbackDialog> createState() => _FeedbackDialogState();
}

class _FeedbackDialogState extends State<FeedbackDialog> {
  String _selectedType = 'Bug / Problema';
  final TextEditingController _messageController = TextEditingController();
  final TextEditingController _contactController = TextEditingController();
  bool _isSending = false;

  void _submit() async {
    final msg = _messageController.text.trim();
    if (msg.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor, digite uma mensagem.')),
      );
      return;
    }

    setState(() => _isSending = true);

    final success = await FeedbackService.sendFeedback(
      type: _selectedType,
      message: msg,
      userContact: _contactController.text.trim(),
      channelOrMovieName: widget.initialContextItem,
    );

    if (!mounted) return;
    setState(() => _isSending = false);

    if (success) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.green,
          content: Text('Obrigado! Sua mensagem foi enviada para deepflix.app@gmail.com'),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.redAccent,
          content: Text('Erro ao enviar mensagem. Verifique sua conexão.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: const Color(0xFF1B2030),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          Icon(
            _selectedType.startsWith('Bug') ? Icons.bug_report : Icons.lightbulb,
            color: const Color(0xFF00E5FF),
          ),
          const SizedBox(width: 8),
          const Text('Feedback & Suporte', style: TextStyle(color: Colors.white, fontSize: 18)),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Ajude a melhorar o DEEPFLIX! Envie um erro ou ideia:',
              style: TextStyle(color: Colors.white70, fontSize: 13),
            ),
            const SizedBox(height: 16),

            // Seletor Tipo (Bug ou Sugestão)
            Row(
              children: [
                _buildTypePill('Bug / Problema'),
                const SizedBox(width: 12),
                _buildTypePill('Sugestão'),
              ],
            ),
            const SizedBox(height: 16),

            // Mensagem
            TextField(
              controller: _messageController,
              maxLines: 4,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: _selectedType.startsWith('Bug')
                    ? 'Qual canal ou filme travou? O que aconteceu?'
                    : 'Qual recurso ou melhoria você gostaria de ver?',
                hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
                filled: true,
                fillColor: const Color(0xFF141722),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Contato Opcional
            TextField(
              controller: _contactController,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Seu E-mail ou Telegram (opcional)',
                hintStyle: const TextStyle(color: Colors.white38, fontSize: 12),
                filled: true,
                fillColor: const Color(0xFF141722),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isSending ? null : () => Navigator.pop(context),
          child: const Text('Cancelar', style: TextStyle(color: Colors.white54)),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E5FF)),
          onPressed: _isSending ? null : _submit,
          child: _isSending
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                )
              : const Text('Enviar', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  Widget _buildTypePill(String type) {
    final isSelected = _selectedType == type;
    return GestureDetector(
      onTap: () => setState(() => _selectedType = type),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF00E5FF).withOpacity(0.2) : const Color(0xFF141722),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF00E5FF) : Colors.white12,
          ),
        ),
        child: Text(
          type,
          style: TextStyle(
            color: isSelected ? const Color(0xFF00E5FF) : Colors.white70,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}
