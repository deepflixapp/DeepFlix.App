import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/onboarding_screen.dart';
import 'screens/profile_selection_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const DeepflixApp());
}

class DeepflixApp extends StatelessWidget {
  const DeepflixApp({super.key});

  Future<bool> _hasSeenTutorial() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool('deepflix_tutorial_seen') ?? false;
    } catch (_) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Shortcuts(
      shortcuts: <LogicalKeySet, Intent>{
        LogicalKeySet(LogicalKeyboardKey.select): const ActivateIntent(),
        LogicalKeySet(LogicalKeyboardKey.enter): const ActivateIntent(),
        LogicalKeySet(LogicalKeyboardKey.numpadEnter): const ActivateIntent(),
      },
      child: MaterialApp(
        title: 'DEEPFLIX',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          brightness: Brightness.dark,
          scaffoldBackgroundColor: const Color(0xFF0E1118),
          primaryColor: const Color(0xFF00E5FF),
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFF00E5FF),
            secondary: Color(0xFFFF5252),
            surface: Color(0xFF161A24),
          ),
          fontFamily: 'Roboto',
        ),
        home: FutureBuilder<bool>(
          future: _hasSeenTutorial(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Scaffold(
                backgroundColor: Color(0xFF0E1118),
                body: Center(
                  child: CircularProgressIndicator(color: Color(0xFF9D4EDD)),
                ),
              );
            }
            final seenTutorial = snapshot.data ?? false;
            return seenTutorial ? const ProfileSelectionScreen() : const OnboardingScreen();
          },
        ),
      ),
    );
  }
}
