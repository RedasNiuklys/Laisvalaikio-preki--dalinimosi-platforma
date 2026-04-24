namespace Server.Services.Storage;

public static class StorageKeyHelper
{
    public static string Build(params string[] segments)
    {
        var normalized = segments
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim().Trim('/').Replace('\\', '/'));

        return string.Join('/', normalized);
    }

    public static string StripLegacyUploadsPrefix(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        var normalized = value.Replace('\\', '/').TrimStart('/');
        return normalized.StartsWith("uploads/")
            ? normalized["uploads/".Length..]
            : normalized;
    }
}
