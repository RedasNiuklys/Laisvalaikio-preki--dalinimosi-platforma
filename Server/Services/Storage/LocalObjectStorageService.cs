using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;

namespace Server.Services.Storage;

public class LocalObjectStorageService : IObjectStorageService
{
    private readonly string _rootPath;
    private readonly FileExtensionContentTypeProvider _contentTypeProvider = new();

    public LocalObjectStorageService(IWebHostEnvironment env, IOptions<StorageOptions> options)
    {
        _rootPath = options.Value.LocalRootPath
            ?? Path.Combine(env.ContentRootPath, "storage-data", "uploads");

        Directory.CreateDirectory(_rootPath);
    }

    public async Task SaveAsync(string objectKey, Stream content, string contentType, CancellationToken cancellationToken = default)
    {
        var filePath = GetSafePhysicalPath(objectKey);
        var directory = Path.GetDirectoryName(filePath);
        if (!string.IsNullOrWhiteSpace(directory))
        {
            Directory.CreateDirectory(directory);
        }

        using var output = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
        content.Position = 0;
        await content.CopyToAsync(output, cancellationToken);
    }

    public Task<StoredObject?> OpenReadAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var filePath = GetSafePhysicalPath(objectKey);
        if (!File.Exists(filePath))
        {
            return Task.FromResult<StoredObject?>(null);
        }

        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        var contentType = ResolveContentType(filePath);

        return Task.FromResult<StoredObject?>(new StoredObject
        {
            Stream = stream,
            ContentType = contentType
        });
    }

    public Task<bool> DeleteIfExistsAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        var filePath = GetSafePhysicalPath(objectKey);
        if (!File.Exists(filePath))
        {
            return Task.FromResult(false);
        }

        File.Delete(filePath);
        return Task.FromResult(true);
    }

    private string GetSafePhysicalPath(string objectKey)
    {
        var safeKey = StorageKeyHelper.StripLegacyUploadsPrefix(objectKey).Replace('/', Path.DirectorySeparatorChar);
        var combined = Path.GetFullPath(Path.Combine(_rootPath, safeKey));
        var root = Path.GetFullPath(_rootPath);

        if (!combined.StartsWith(root, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid storage key path.");
        }

        return combined;
    }

    private string ResolveContentType(string path)
    {
        if (_contentTypeProvider.TryGetContentType(path, out var contentType))
        {
            return contentType;
        }

        return "application/octet-stream";
    }
}
