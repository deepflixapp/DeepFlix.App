import 'package:flutter/material.dart';
import '../models/profile.dart';
import '../widgets/tv_focusable.dart';
import 'streaming_home_screen.dart';
import 'live_tv_screen.dart';
import 'profile_selection_screen.dart';

class ModeSelectionScreen extends StatelessWidget {
  final Profile currentProfile;

  const ModeSelectionScreen({super.key, required this.currentProfile});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0E1118),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white70),
          onPressed: () {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const ProfileSelectionScreen()),
            );
          },
        ),
        title: Row(
          children: [
            Text(currentProfile.avatar, style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Text(
              'Olá, ${currentProfile.name}',
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
          ],
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'O QUE VOCÊ QUER ASSISTIR HOJE?',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildModeCard(
                    context,
                    title: 'TV AO VIVO',
                    subtitle: 'Canais de notícias, esportes, variedades e filmes em tempo real',
                    icon: Icons.live_tv,
                    gradient: const [Color(0xFFE50914), Color(0xFFFF5252)],
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => LiveTvScreen(profile: currentProfile),
                        ),
                      );
                    },
                  ),
                  const SizedBox(width: 32),
                  _buildModeCard(
                    context,
                    title: 'STREAMING',
                    subtitle: 'Filmes, Séries, Animes, Doramas, Desenhos e Novelas sob demanda',
                    icon: Icons.movie_filter,
                    gradient: const [Color(0xFF0072FF), Color(0xFF00C6FF)],
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => StreamingHomeScreen(profile: currentProfile),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModeCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required List<Color> gradient,
    required VoidCallback onTap,
  }) {
    final screenWidth = MediaQuery.of(context).size.width;
    final cardWidth = screenWidth > 700 ? 280.0 : screenWidth * 0.42;

    return TvFocusable(
      onPressed: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: cardWidth,
        height: 300,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            colors: gradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: gradient.first.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            )
          ],
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 64, color: Colors.white),
            const SizedBox(height: 20),
            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              subtitle,
              style: const TextStyle(color: Colors.white70, fontSize: 12),
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
