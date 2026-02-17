using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;
using System.IO;

namespace Server.Services
{
    public class FirebaseAuthService
    {
        private readonly FirebaseAuth _firebaseAuth;

        public FirebaseAuthService()
        {
            // Initialize Firebase Admin SDK
            if (FirebaseApp.DefaultInstance == null)
            {
                // Look for Firebase service account JSON file
                var possiblePaths = new[]
                {
                    Path.Combine(Directory.GetCurrentDirectory(), "firebase-service-account.json"),
                    Path.Combine(Directory.GetCurrentDirectory(), "bakis-aea6d-firebase-adminsdk-fbsvc-9964ba365b.json")
                };

                string serviceAccountPath = null;
                foreach (var path in possiblePaths)
                {
                    if (File.Exists(path))
                    {
                        serviceAccountPath = path;
                        Console.WriteLine($"Found Firebase service account: {path}");
                        break;
                    }
                }

                if (!string.IsNullOrEmpty(serviceAccountPath))
                {
                    FirebaseApp.Create(new AppOptions()
                    {
                        Credential = GoogleCredential.FromFile(serviceAccountPath)
                    });
                    Console.WriteLine("Firebase Admin SDK initialized successfully");
                }
                else
                {
                    // For development, you can also use environment variable
                    var serviceAccountJson = Environment.GetEnvironmentVariable("FIREBASE_SERVICE_ACCOUNT_JSON");
                    if (!string.IsNullOrEmpty(serviceAccountJson))
                    {
                        FirebaseApp.Create(new AppOptions()
                        {
                            Credential = GoogleCredential.FromJson(serviceAccountJson)
                        });
                        Console.WriteLine("Firebase Admin SDK initialized from environment variable");
                    }
                    else
                    {
                        throw new FileNotFoundException("Firebase service account JSON not found. " +
                            "Please add firebase-service-account.json (or bakis-aea6d-firebase-adminsdk-fbsvc-9964ba365b.json) to the Server directory or set FIREBASE_SERVICE_ACCOUNT_JSON environment variable.");
                    }
                }
            }

            _firebaseAuth = FirebaseAuth.DefaultInstance;
        }

        /// <summary>
        /// Verify Firebase ID token and return the decoded token
        /// </summary>
        public async Task<FirebaseToken> VerifyTokenAsync(string idToken)
        {
            try
            {
                var decodedToken = await _firebaseAuth.VerifyIdTokenAsync(idToken);
                return decodedToken;
            }
            catch (FirebaseAuthException ex)
            {
                throw new UnauthorizedAccessException($"Invalid Firebase token: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Get Firebase user by UID
        /// </summary>
        public async Task<UserRecord> GetUserAsync(string uid)
        {
            try
            {
                return await _firebaseAuth.GetUserAsync(uid);
            }
            catch (FirebaseAuthException ex)
            {
                throw new Exception($"Error fetching user: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Update Firebase user
        /// </summary>
        public async Task<UserRecord> UpdateUserAsync(string uid, UserRecordArgs args)
        {
            try
            {
                return await _firebaseAuth.UpdateUserAsync(args);
            }
            catch (FirebaseAuthException ex)
            {
                throw new Exception($"Error updating user: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Delete Firebase user
        /// </summary>
        public async Task DeleteUserAsync(string uid)
        {
            try
            {
                await _firebaseAuth.DeleteUserAsync(uid);
            }
            catch (FirebaseAuthException ex)
            {
                throw new Exception($"Error deleting user: {ex.Message}", ex);
            }
        }
    }
}
