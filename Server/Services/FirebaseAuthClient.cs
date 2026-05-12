using FirebaseAdmin.Auth;

namespace Server.Services
{
    public interface IFirebaseAuthClient
    {
        Task<FirebaseToken> VerifyIdTokenAsync(string idToken);
        Task<UserRecord> GetUserAsync(string uid);
        Task<UserRecord> UpdateUserAsync(UserRecordArgs args);
        Task DeleteUserAsync(string uid);
    }

    internal sealed class FirebaseAuthClient : IFirebaseAuthClient
    {
        private readonly FirebaseAuth _firebaseAuth;

        public FirebaseAuthClient(FirebaseAuth firebaseAuth)
        {
            _firebaseAuth = firebaseAuth;
        }

        public Task<FirebaseToken> VerifyIdTokenAsync(string idToken) => _firebaseAuth.VerifyIdTokenAsync(idToken);

        public Task<UserRecord> GetUserAsync(string uid) => _firebaseAuth.GetUserAsync(uid);

        public Task<UserRecord> UpdateUserAsync(UserRecordArgs args) => _firebaseAuth.UpdateUserAsync(args);

        public Task DeleteUserAsync(string uid) => _firebaseAuth.DeleteUserAsync(uid);
    }
}