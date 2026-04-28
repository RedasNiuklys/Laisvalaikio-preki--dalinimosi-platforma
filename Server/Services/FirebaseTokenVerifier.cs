namespace Server.Services;

public class FirebaseTokenVerifier : IFirebaseTokenVerifier
{
    private readonly FirebaseAuthService _firebaseAuthService;

    public FirebaseTokenVerifier(FirebaseAuthService firebaseAuthService)
    {
        _firebaseAuthService = firebaseAuthService;
    }

    public async Task<string> VerifyUidAsync(string idToken)
    {
        var token = await _firebaseAuthService.VerifyTokenAsync(idToken);
        return token.Uid;
    }
}
