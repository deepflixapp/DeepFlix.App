import 'package:flutter/material.dart';

enum DeviceScreenType {
  mobile,
  foldable,
  tablet,
  desktopOrTv,
}

class ResponsiveLayout extends StatelessWidget {
  final Widget Function(BuildContext context, DeviceScreenType screenType, BoxConstraints constraints) builder;

  const ResponsiveLayout({super.key, required this.builder});

  static DeviceScreenType getDeviceType(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width < 600) return DeviceScreenType.mobile;
    if (width < 840) return DeviceScreenType.foldable;
    if (width < 1200) return DeviceScreenType.tablet;
    return DeviceScreenType.desktopOrTv;
  }

  static bool isFoldableOrTablet(BuildContext context) {
    final type = getDeviceType(context);
    return type == DeviceScreenType.foldable || type == DeviceScreenType.tablet;
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final screenType = constraints.maxWidth < 600
            ? DeviceScreenType.mobile
            : constraints.maxWidth < 840
                ? DeviceScreenType.foldable
                : constraints.maxWidth < 1200
                    ? DeviceScreenType.tablet
                    : DeviceScreenType.desktopOrTv;

        return builder(context, screenType, constraints);
      },
    );
  }
}
