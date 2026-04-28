namespace Server.Services;

public interface IFirebaseTokenVerifier
{
    Task<string> VerifyUidAsync(string idToken);
}
