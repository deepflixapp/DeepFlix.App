import 'dart:convert';

class Profile {
  final String id;
  final String name;
  final String avatar;
  final DateTime createdAt;

  Profile({
    required this.id,
    required this.name,
    required this.avatar,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'avatar': avatar,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  factory Profile.fromMap(Map<String, dynamic> map) {
    return Profile(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      avatar: map['avatar'] ?? '🍿',
      createdAt: DateTime.tryParse(map['createdAt'] ?? '') ?? DateTime.now(),
    );
  }

  String toJson() => json.encode(toMap());
  factory Profile.fromJson(String source) => Profile.fromMap(json.decode(source));
}
