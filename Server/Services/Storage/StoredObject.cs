namespace Server.Services.Storage;

public sealed class StoredObject
{
    public required Stream Stream { get; init; }
    public required string ContentType { get; init; }
}
