class ApiResponse<T> {
  final bool success;
  final String? message;
  final T? data;
  final int? totalPages;
  final int? currentPage;
  final int? totalItems;

  const ApiResponse({
    required this.success,
    this.message,
    this.data,
    this.totalPages,
    this.currentPage,
    this.totalItems,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse(
      success: json['success'] as bool? ?? true,
      message: json['message'] as String?,
      data: json['data'] != null && fromJsonT != null ? fromJsonT(json['data']) : json['data'] as T?,
      totalPages: json['total_pages'] as int?,
      currentPage: json['current_page'] as int?,
      totalItems: json['total_items'] as int?,
    );
  }

  factory ApiResponse.error(String message) {
    return ApiResponse(
      success: false,
      message: message,
    );
  }
}
