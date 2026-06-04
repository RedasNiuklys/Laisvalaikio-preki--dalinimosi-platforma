using System.ComponentModel.DataAnnotations;

namespace Server.DataTransferObjects;

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Theme { get; set; }
    public string? AvatarUrl { get; set; }
    public IList<string>? Roles { get; set; }
    // Reputation fields
    public int CompletedBookingsCount { get; set; }
    public int LentOutCount { get; set; }
    public double AverageRatingAsOwner { get; set; }
    public DateTime? MemberSince { get; set; }
    // Notification count (profile endpoint only)
    public int UnreadNotificationsCount { get; set; }
}

public class PushTokenDto
{
    public required string PushToken { get; set; }
}

public class UpdateUserDto
{
    public string? UserName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Theme { get; set; }
    [EmailAddress]
    public required string Email { get; set; }
    public string? AvatarUrl { get; set; }
}

public class UserSearchResultDto
{
    public string? Id { get; set; }
    public string? UserName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
}

public class ErrorResponseDto
{
    public required string Message { get; set; }
}

public class AdminOperationResponseDto
{
    public required string Message { get; set; }
}

public class DeleteUserResponseDto
{
    public required string Message { get; set; }
}

public class ThemePreferenceDto
{
    public required string ThemePreference { get; set; }
}

public class UserResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}