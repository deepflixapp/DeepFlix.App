class ProgramItem {
  final String title;
  final String? description;
  final DateTime startTime;
  final DateTime endTime;

  ProgramItem({
    required this.title,
    this.description,
    required this.startTime,
    required this.endTime,
  });

  bool get isLiveNow {
    final now = DateTime.now();
    return now.isAfter(startTime) && now.isBefore(endTime);
  }

  double get progress {
    final now = DateTime.now();
    if (now.isBefore(startTime)) return 0.0;
    if (now.isAfter(endTime)) return 1.0;
    final total = endTime.difference(startTime).inSeconds;
    if (total <= 0) return 0.0;
    final elapsed = now.difference(startTime).inSeconds;
    return (elapsed / total).clamp(0.0, 1.0);
  }
}
