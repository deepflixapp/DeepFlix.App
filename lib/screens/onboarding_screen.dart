import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../widgets/tv_focusable.dart';
import 'profile_selection_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, dynamic>> _slides = [
    {
      'icon': Icons.devices,
      'color': Color(0xFF00E5FF),
      'title': 'Bem-vindo ao DEEPFLIX',
      'subtitle':
          'Feito para Android TV, Celular, Tablet e Desktop.\nTudo roda direto no seu aparelho, com carregamento ultra-rápido e sem depender de servidores intermediários.',
    },
    {
      'icon': Icons.live_tv,
      'color': Color(0xFFFF5252),
      'title': 'TV Ao Vivo & Streaming',
      'subtitle':
          'Logo na entrada, escolha se deseja assistir canais de TV ao vivo ou o catálogo sob demanda com Filmes, Séries, Animes e Novelas. Você pode alternar entre os modos a qualquer momento no topo da tela.',
    },
    {
      'icon': Icons.account_circle,
      'color': Color(0xFF00E5FF),
      'title': 'Perfis & Seu Histórico',
      'subtitle':
          'Sem precisar de cadastro com senha na internet! Crie perfis para cada pessoa da casa. O histórico "Continuar Assistindo" e os favoritos ficam salvos de forma independente para cada perfil.',
    },
    {
      'icon': Icons.cast,
      'color': Color(0xFFFFB300),
      'title': 'Controle Remoto & Transmissão',
      'subtitle':
          'Na TV Box ou Android TV: use as setas do controle remoto (D-Pad) com foco automático.\nNo Celular ou Tablet: use o botão de Cast no topo para jogar os vídeos direto na sua televisão via Wi-Fi.',
    },
  ];

  Future<void> _finishOnboarding() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('deepflix_tutorial_seen', true);
    } catch (_) {}

    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const ProfileSelectionScreen()),
      (route) => false,
    );
  }

  void _nextPage() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      _finishOnboarding();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0E1118),
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar com Botão Pular
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'DEEPFLIX',
                    style: TextStyle(
                      color: Color(0xFF00E5FF),
                      fontWeight: FontWeight.w900,
                      fontSize: 20,
                      letterSpacing: 2,
                    ),
                  ),
                  TextButton(
                    onPressed: _finishOnboarding,
                    child: const Text('Pular Tutorial', style: TextStyle(color: Colors.white54)),
                  ),
                ],
              ),
            ),
            // Banner de Isenção de Responsabilidade
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 4.0),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.volunteer_activism, color: Color(0xFF00E5FF), size: 14),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '100% Gratuito & Livre: Este app nunca cobrará nenhum valor. Projeto sem fins lucrativos, apenas agregador de links públicos da web.',
                        style: TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Carrossel de Slides do Tutorial
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _slides.length,
                onPageChanged: (idx) => setState(() => _currentPage = idx),
                itemBuilder: (ctx, i) {
                  final slide = _slides[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: (slide['color'] as Color).withOpacity(0.15),
                            shape: BoxShape.circle,
                            border: Border.all(color: slide['color'] as Color, width: 2),
                          ),
                          child: Icon(
                            slide['icon'] as IconData,
                            size: 60,
                            color: slide['color'] as Color,
                          ),
                        ),
                        const SizedBox(height: 32),
                        Text(
                          slide['title'] as String,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 500),
                          child: Text(
                            slide['subtitle'] as String,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 15,
                              height: 1.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

            // Indicadores de Página & Botão Avançar/Começar (Focalizável para TV)
            Padding(
              padding: const EdgeInsets.all(32.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Bolinhas indicadoras
                  Row(
                    children: List.generate(
                      _slides.length,
                      (i) => AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.only(right: 8),
                        width: _currentPage == i ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _currentPage == i ? const Color(0xFF00E5FF) : Colors.white24,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),

                  // Botão Avançar / Concluir
                  TvFocusable(
                    autofocus: true,
                    onPressed: _nextPage,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00E5FF),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _currentPage == _slides.length - 1 ? 'Começar' : 'Avançar',
                            style: const TextStyle(
                              color: Colors.black,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(
                            _currentPage == _slides.length - 1 ? Icons.check : Icons.arrow_forward,
                            color: Colors.black,
                            size: 18,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
