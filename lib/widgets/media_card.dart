import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/media_item.dart';
import 'tv_focusable.dart';

class MediaCard extends StatelessWidget {
  final MediaItem item;
  final VoidCallback onTap;

  const MediaCard({
    super.key,
    required this.item,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return TvFocusable(
      onPressed: onTap,
      borderRadius: BorderRadius.circular(10),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Container(
          width: 140,
          color: const Color(0xFF1E2230),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: item.poster != null && item.poster!.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: item.poster!,
                        fit: BoxFit.cover,
                        width: double.infinity,
                        memCacheWidth: 280, // Otimização de RAM crítica para TV Boxes antigas
                        maxHeightDiskCache: 400,
                        placeholder: (context, url) => Container(
                          color: const Color(0xFF161922),
                          child: const Center(
                            child: Icon(Icons.movie_outlined, color: Colors.white24, size: 30),
                          ),
                        ),
                        errorWidget: (context, url, error) => _buildPlaceholder(),
                      )
                    : _buildPlaceholder(),
              ),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: const Color(0xFF161922),
      child: const Center(
        child: Icon(Icons.movie, size: 40, color: Colors.white30),
      ),
    );
  }
}
