class ChannelItem {
  final String id;
  final String name;
  final String category;
  final String streamUrl;
  final String? logo;

  ChannelItem({
    required this.id,
    required this.name,
    required this.category,
    required this.streamUrl,
    this.logo,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'streamUrl': streamUrl,
      'logo': logo,
    };
  }

  factory ChannelItem.fromMap(Map<String, dynamic> map) {
    return ChannelItem(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      category: map['category'] ?? 'Geral',
      streamUrl: map['streamUrl'] ?? '',
      logo: map['logo'],
    );
  }
}
