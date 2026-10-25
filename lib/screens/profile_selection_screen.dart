import 'package:flutter/material.dart';
import '../models/profile.dart';
import '../services/storage_service.dart';
import '../widgets/tv_focusable.dart';
import '../widgets/disclaimer_modal.dart';
import 'mode_selection_screen.dart';

class ProfileSelectionScreen extends StatefulWidget {
  const ProfileSelectionScreen({super.key});

  @override
  State<ProfileSelectionScreen> createState() => _ProfileSelectionScreenState();
}

class _ProfileSelectionScreenState extends State<ProfileSelectionScreen> {
  List<Profile> _profiles = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadProfiles();
  }

  Future<void> _loadProfiles() async {
    setState(() => _loading = true);
    try {
      final profiles = await StorageService.getProfiles();
      if (!mounted) return;
      setState(() {
        _profiles = profiles;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _profiles = [
          Profile(
            id: 'default',
            name: 'Principal',
            avatar: '🎬',
            createdAt: DateTime.now(),
          )
        ];
        _loading = false;
      });
    }
  }

  void _selectProfile(Profile profile) async {
    await StorageService.setCurrentProfileId(profile.id);
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => ModeSelectionScreen(currentProfile: profile),
      ),
    );
  }

  void _showAddProfileDialog() {
    final controller = TextEditingController();
    String selectedAvatar = '🍿';
    final avatars = ['🍿', '🎬', '📺', '🔥', '⚡', '🎮', '🚀', '🌟'];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: const Color(0xFF1E2230),
          title: const Text('Novo Perfil', style: TextStyle(color: Colors.white)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: controller,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Nome do Perfil',
                  labelStyle: TextStyle(color: Colors.white70),
                  enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFF00E5FF)),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                children: avatars.map((emoji) {
                  final isSelected = emoji == selectedAvatar;
                  return GestureDetector(
                    onTap: () => setDialogState(() => selectedAvatar = emoji),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF00E5FF).withOpacity(0.3) : Colors.transparent,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isSelected ? const Color(0xFF00E5FF) : Colors.transparent,
                          width: 2,
                        ),
                      ),
                      child: Text(emoji, style: const TextStyle(fontSize: 24)),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancelar', style: TextStyle(color: Colors.white54)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00E5FF)),
              onPressed: () async {
                final name = controller.text.trim();
                if (name.isNotEmpty) {
                  final newProfile = Profile(
                    id: DateTime.now().millisecondsSinceEpoch.toString(),
                    name: name,
                    avatar: selectedAvatar,
                    createdAt: DateTime.now(),
                  );
                  await StorageService.saveProfile(newProfile);
                  Navigator.pop(ctx);
                  _loadProfiles();
                }
              },
              child: const Text('Criar', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0E1118),
      body: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'DEEPFLIX',
                style: TextStyle(
                  color: Color(0xFF9D4EDD),
                  fontSize: 36,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 3,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Quem está assistindo?',
                style: TextStyle(color: Colors.white70, fontSize: 20),
              ),
              const SizedBox(height: 40),
              if (_loading)
                const Padding(
                  padding: EdgeInsets.all(32.0),
                  child: CircularProgressIndicator(color: Color(0xFF9D4EDD)),
                )
              else
                Wrap(
                  spacing: 24,
                  runSpacing: 24,
                  alignment: WrapAlignment.center,
                  children: [
                    ..._profiles.map((p) => _buildProfileCard(p)),
                    _buildAddProfileCard(),
                  ],
                ),
              const SizedBox(height: 36),
              // Rodapé com Declaração de Gratuidade e Termos
              GestureDetector(
                onTap: () => DisclaimerModal.show(context),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white12),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.volunteer_activism, color: Color(0xFF9D4EDD), size: 14),
                      SizedBox(width: 8),
                      Text(
                        'Projeto 100% Gratuito & Sem Fins Lucrativos • Ver Termos Legais',
                        style: TextStyle(
                          color: Colors.white60,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileCard(Profile profile) {
    return TvFocusable(
      onPressed: () => _selectProfile(profile),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 130,
        height: 150,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF1B2030),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 70,
              height: 70,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFF2B334C),
              ),
              child: Center(
                child: Text(profile.avatar, style: const TextStyle(fontSize: 34)),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              profile.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddProfileCard() {
    return TvFocusable(
      onPressed: _showAddProfileDialog,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 130,
        height: 150,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF141722),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white24, style: BorderStyle.solid),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add, color: Colors.white70, size: 40),
            SizedBox(height: 12),
            Text(
              'Novo Perfil',
              style: TextStyle(color: Colors.white70, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}
