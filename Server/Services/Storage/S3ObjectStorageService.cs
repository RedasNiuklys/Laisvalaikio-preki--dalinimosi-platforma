using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;

namespace Server.Services.Storage;

public class S3ObjectStorageService : IObjectStorageService
{
    private readonly IAmazonS3 _s3;
    private readonly StorageOptions _options;

    public S3ObjectStorageService(IAmazonS3 s3, IOptions<StorageOptions> options)
    {
        _s3 = s3;
        _options = options.Value;

        if (string.IsNullOrWhiteSpace(_options.S3BucketName))
        {
            throw new InvalidOperationException("Storage:S3BucketName is required for S3 provider.");
        }
    }

    public async Task SaveAsync(string objectKey, Stream content, string contentType, CancellationToken cancellationToken = default)
    {
        var request = new PutObjectRequest
        {
            BucketName = _options.S3BucketName,
            Key = BuildPrefixedKey(objectKey),
            InputStream = content,
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType
        };

        content.Position = 0;
        await _s3.PutObjectAsync(request, cancellationToken);
    }

    public async Task<StoredObject?> OpenReadAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _s3.GetObjectAsync(new GetObjectRequest
            {
                BucketName = _options.S3BucketName,
                Key = BuildPrefixedKey(objectKey)
            }, cancellationToken);

            return new StoredObject
            {
                Stream = response.ResponseStream,
                ContentType = string.IsNullOrWhiteSpace(response.Headers.ContentType)
                    ? "application/octet-stream"
                    : response.Headers.ContentType
            };
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<bool> DeleteIfExistsAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        try
        {
            await _s3.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _options.S3BucketName,
                Key = BuildPrefixedKey(objectKey)
            }, cancellationToken);

            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    private string BuildPrefixedKey(string objectKey)
    {
        var normalized = StorageKeyHelper.StripLegacyUploadsPrefix(objectKey);
        if (string.IsNullOrWhiteSpace(_options.S3KeyPrefix))
        {
            return normalized;
        }

        return StorageKeyHelper.Build(_options.S3KeyPrefix, normalized);
    }
}
