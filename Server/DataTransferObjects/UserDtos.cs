using System.ComponentModel.DataAnnotations;

namespace Server.DataTransferObjects;

public class UserDto
{
    public string Id { get; set; }
    public string Email { get; set; }
    public string UserName { get; set; }
    public string Name { get; set; }
    public string Theme { get; set; }
    public string AvatarUrl { get; set; }
    public IList<string> Roles { get; set; }
}

public class UpdateUserDto
{
    public string Name { get; set; }
    public string Theme { get; set; }
    [EmailAddress]
    public string Email { get; set; }
    public string AvatarUrl { get; set; }
}

public class UserSearchResultDto
{
    public string Id { get; set; }
    public string UserName { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string AvatarUrl { get; set; }
}

public class ErrorResponseDto
{
    public string Message { get; set; }
}

public class AdminOperationResponseDto
{
    public string Message { get; set; }
}

public class DeleteUserResponseDto
{
    public string Message { get; set; }
}

public class ThemePreferenceDto
{
    public string ThemePreference { get; set; }
}