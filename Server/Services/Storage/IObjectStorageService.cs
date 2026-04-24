namespace Server.Services.Storage;

public interface IObjectStorageService
{
    Task SaveAsync(string objectKey, Stream content, string contentType, CancellationToken cancellationToken = default);
    Task<StoredObject?> OpenReadAsync(string objectKey, CancellationToken cancellationToken = default);
    Task<bool> DeleteIfExistsAsync(string objectKey, CancellationToken cancellationToken = default);
}
