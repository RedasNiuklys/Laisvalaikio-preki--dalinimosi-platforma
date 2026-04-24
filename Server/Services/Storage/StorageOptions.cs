namespace Server.Services.Storage;

public class StorageOptions
{
    public string Provider { get; set; } = "Local";
    public string? LocalRootPath { get; set; }
    public string? S3BucketName { get; set; }
    public string? S3Region { get; set; }
    public string? S3KeyPrefix { get; set; }
    public string? S3PublicBaseUrl { get; set; }
}
