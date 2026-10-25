import 'package:flutter/material.dart';

class CastService {
  static bool get isSupportedOnCurrentPlatform => false;

  static Future<void> castMedia({
    required String title,
    required String streamUrl,
    String? posterUrl,
  }) async {
    // Placeholder limpo e leve para expansão de Cast
  }
}
