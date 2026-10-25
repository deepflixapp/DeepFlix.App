import 'package:flutter/material.dart';
import 'package:flutter_cast_framework/flutter_cast_framework.dart';
import '../services/cast_service.dart';

class CastButton extends StatelessWidget {
  final Color? color;
  const CastButton({super.key, this.color});

  @override
  Widget build(BuildContext context) {
    if (!CastService.isSupportedOnCurrentPlatform) {
      return const SizedBox.shrink();
    }

    return CastMiniController(
      // Cast Framework Media Route Button
      child: IconButton(
        icon: Icon(Icons.cast, color: color ?? Colors.white),
        tooltip: 'Transmitir para TV (Chromecast)',
        onPressed: () {
          FlutterCastFramework.instance.showCastDialog();
        },
      ),
    );
  }
}
