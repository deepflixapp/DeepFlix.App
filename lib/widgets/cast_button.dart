import 'package:flutter/material.dart';

class CastButton extends StatelessWidget {
  final Color? color;
  const CastButton({super.key, this.color});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(Icons.cast, color: color ?? Colors.white70),
      tooltip: 'Transmitir para TV',
      onPressed: () {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Dispositivos de transmissão na mesma rede local'),
            duration: Duration(seconds: 2),
          ),
        );
      },
    );
  }
}
