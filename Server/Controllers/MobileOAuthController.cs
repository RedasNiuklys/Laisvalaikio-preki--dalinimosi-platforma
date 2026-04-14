using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Server.Models;
using Server.Services;
using System.Security.Claims;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MobileOAuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _configuration;

        public MobileOAuthController(
            UserManager<ApplicationUser> userManager,
            ITokenService tokenService,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _configuration = configuration;
        }

        /// <summary>
        /// Mobile Google OAuth callback - Handles authorization code from Google
        /// URL: https://10.233.192.135:8000/api/MobileOAuth/google-callback?code=xxx
        /// Note: Device ID and name required for private IP testing
        /// </summary>
        [HttpGet("google-callback")]
        public async Task<IActionResult> GoogleCallback([FromQuery] string code, [FromQuery] string? error, [FromQuery] string? platform, [FromQuery] string? state)
        {
            try
            {
                if (!string.IsNullOrEmpty(error))
                {
                    return Content(GetErrorHtml($"OAuth Error: {error}"), "text/html");
                }

                if (string.IsNullOrEmpty(code))
                {
                    return Content(GetErrorHtml("No authorization code received"), "text/html");
                }

                Console.WriteLine($"=== MOBILE GOOGLE CALLBACK === Code: {code}");

                // Exchange authorization code for tokens
                var callbackRedirectUri = $"{Request.Scheme}://{Request.Host}/api/MobileOAuth/google-callback";
                var tokenResponse = await ExchangeGoogleCodeForTokens(code, callbackRedirectUri);
                if (tokenResponse == null)
                {
                    return Content(GetErrorHtml("Failed to exchange code for tokens"), "text/html");
                }

                // Get user info from Google
                var userInfo = await GetGoogleUserInfo(tokenResponse.AccessToken);
                if (userInfo == null)
                {
                    return Content(GetErrorHtml("Failed to get user info from Google"), "text/html");
                }

                // Find or create user
                var user = await _userManager.FindByEmailAsync(userInfo.Email);
                bool isNewUser = false;

                if (user == null)
                {
                    isNewUser = true;
                    user = new ApplicationUser
                    {
                        UserName = userInfo.Email,
                        Email = userInfo.Email,
                        EmailConfirmed = true,
                        FirstName = userInfo.GivenName,
                        LastName = userInfo.FamilyName,
                        AvatarUrl = userInfo.Picture
                    };

                    var result = await _userManager.CreateAsync(user);
                    if (!result.Succeeded)
                    {
                        return Content(GetErrorHtml("Failed to create user"), "text/html");
                    }
                }

                // Generate JWT token
                var jwtToken = await _tokenService.CreateTokenAsync(user);

                Console.WriteLine($"✅ Mobile Google OAuth success - User: {user.Email}");

                // For web testing, return HTML page with token
                // For mobile/native, redirect to app's custom scheme
                var isWebFlow = string.Equals(platform, "web", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(state, "web", StringComparison.OrdinalIgnoreCase);

                if (isWebFlow)
                {
                    return Content(GetSuccessHtml(jwtToken, isNewUser, "google"), "text/html");
                }
                else
                {
                    var redirectUrl = $"laisvalaikio://oauth-callback?token={Uri.EscapeDataString(jwtToken)}&isNewUser={isNewUser}&provider=google";
                    return Redirect(redirectUrl);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Mobile Google OAuth error: {ex.Message}");
                return Content(GetErrorHtml($"Authentication failed: {ex.Message}"), "text/html");
            }
        }

        /// <summary>
        /// Mobile Facebook OAuth callback - Handles authorization code from Facebook
        /// URL: https://10.233.192.135:8000/api/MobileOAuth/facebook-callback?code=xxx
        /// </summary>
        [HttpGet("facebook-callback")]
        public async Task<IActionResult> FacebookCallback([FromQuery] string code, [FromQuery] string? error, [FromQuery] string? platform, [FromQuery] string? state)
        {
            try
            {
                if (!string.IsNullOrEmpty(error))
                {
                    return Content(GetErrorHtml($"OAuth Error: {error}"), "text/html");
                }

                if (string.IsNullOrEmpty(code))
                {
                    return Content(GetErrorHtml("No authorization code received"), "text/html");
                }

                Console.WriteLine($"=== MOBILE FACEBOOK CALLBACK === Code: {code}");

                // Exchange authorization code for tokens
                var callbackRedirectUri = $"{Request.Scheme}://{Request.Host}/api/MobileOAuth/facebook-callback";
                var tokenResponse = await ExchangeFacebookCodeForTokens(code, callbackRedirectUri);
                if (tokenResponse == null)
                {
                    return Content(GetErrorHtml("Failed to exchange code for tokens"), "text/html");
                }

                // Get user info from Facebook
                var userInfo = await GetFacebookUserInfo(tokenResponse.AccessToken);
                if (userInfo == null)
                {
                    return Content(GetErrorHtml("Failed to get user info from Facebook"), "text/html");
                }

                // Find or create user
                var user = await _userManager.FindByEmailAsync(userInfo.Email);
                bool isNewUser = false;

                if (user == null)
                {
                    isNewUser = true;
                    user = new ApplicationUser
                    {
                        UserName = userInfo.Email,
                        Email = userInfo.Email,
                        EmailConfirmed = true,
                        FirstName = userInfo.FirstName,
                        LastName = userInfo.LastName,
                        AvatarUrl = userInfo.Picture?.Data?.Url
                    };

                    var result = await _userManager.CreateAsync(user);
                    if (!result.Succeeded)
                    {
                        return Content(GetErrorHtml("Failed to create user"), "text/html");
                    }
                }

                // Generate JWT token
                var jwtToken = await _tokenService.CreateTokenAsync(user);

                Console.WriteLine($"✅ Mobile Facebook OAuth success - User: {user.Email}");

                // For web testing, return HTML page with token
                // For mobile/native, redirect to app's custom scheme
                var isWebFlow = string.Equals(platform, "web", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(state, "web", StringComparison.OrdinalIgnoreCase);

                if (isWebFlow)
                {
                    return Content(GetSuccessHtml(jwtToken, isNewUser, "facebook", tokenResponse.AccessToken), "text/html");
                }
                else
                {
                    var redirectUrl = $"laisvalaikio://oauth-callback?token={Uri.EscapeDataString(jwtToken)}&isNewUser={isNewUser}&provider=facebook&facebookAccessToken={Uri.EscapeDataString(tokenResponse.AccessToken)}";
                    return Redirect(redirectUrl);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Mobile Facebook OAuth error: {ex.Message}");
                return Content(GetErrorHtml($"Authentication failed: {ex.Message}"), "text/html");
            }
        }

        // Helper methods for OAuth token exchange
        private async Task<GoogleTokenResponse?> ExchangeGoogleCodeForTokens(string code, string redirectUri)
        {
            try
            {
                using var client = new HttpClient();
                var clientId = _configuration["Authentication:Google:ClientId"] ?? "";
                var clientSecret = _configuration["Authentication:Google:ClientSecret"] ?? "";

                var tokenRequest = new Dictionary<string, string>
                {
                    { "code", code },
                    { "client_id", clientId },
                    { "client_secret", clientSecret },
                    { "redirect_uri", redirectUri },
                    { "grant_type", "authorization_code" }
                };

                Console.WriteLine("🔗 === GOOGLE TOKEN EXCHANGE ===");
                Console.WriteLine($"  Client ID: {clientId}");
                Console.WriteLine($"  Client Secret: {(string.IsNullOrEmpty(clientSecret) ? "❌ NOT SET" : "✓ SET")}");
                Console.WriteLine($"  Redirect URI: {tokenRequest["redirect_uri"]}");
                Console.WriteLine($"  Code: {code.Substring(0, Math.Min(20, code.Length))}...");

                var response = await client.PostAsync("https://oauth2.googleapis.com/token", new FormUrlEncodedContent(tokenRequest));
                var responseContent = await response.Content.ReadAsStringAsync();

                Console.WriteLine($"📡 Status: {response.StatusCode}");
                Console.WriteLine($"📡 Response: {responseContent}");

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"❌ Google token exchange failed!");
                    return null;
                }

                var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var tokenResponse = System.Text.Json.JsonSerializer.Deserialize<GoogleTokenResponse>(responseContent, options);
                Console.WriteLine("✅ Google token exchange successful");
                return tokenResponse;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Exception during Google token exchange: {ex.Message}");
                return null;
            }
        }

        private async Task<GoogleUserInfo?> GetGoogleUserInfo(string accessToken)
        {
            try
            {
                using var client = new HttpClient();
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

                Console.WriteLine("🔗 Fetching Google User Info...");
                var response = await client.GetAsync("https://www.googleapis.com/oauth2/v2/userinfo");
                var responseContent = await response.Content.ReadAsStringAsync();

                Console.WriteLine($"📡 Status: {response.StatusCode}");
                Console.WriteLine($"📡 Response: {responseContent}");

                if (!response.IsSuccessStatusCode) return null;

                var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                return System.Text.Json.JsonSerializer.Deserialize<GoogleUserInfo>(responseContent, options);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Exception getting Google user info: {ex.Message}");
                return null;
            }
        }

        private async Task<FacebookTokenResponse?> ExchangeFacebookCodeForTokens(string code, string redirectUri)
        {
            try
            {
                using var client = new HttpClient();
                var appId = _configuration["Authentication:Facebook:ClientId"] ?? "";
                var appSecret = _configuration["Authentication:Facebook:ClientSecret"] ?? "";

                var tokenUrl = $"https://graph.facebook.com/v12.0/oauth/access_token?" +
                    $"client_id={appId}&" +
                    $"client_secret={appSecret}&" +
                    $"redirect_uri={Uri.EscapeDataString(redirectUri)}&" +
                    $"code={code}";

                Console.WriteLine("🔗 === FACEBOOK TOKEN EXCHANGE ===");
                Console.WriteLine($"  Client ID: {appId}");
                Console.WriteLine($"  Client Secret: {(string.IsNullOrEmpty(appSecret) ? "❌ NOT SET" : "✓ SET")}");
                Console.WriteLine($"  Redirect URI: {redirectUri}");
                Console.WriteLine($"  Code: {code.Substring(0, Math.Min(20, code.Length))}...");

                var response = await client.GetAsync(tokenUrl);
                var responseContent = await response.Content.ReadAsStringAsync();

                Console.WriteLine($"📡 Status: {response.StatusCode}");
                Console.WriteLine($"📡 Response: {responseContent}");

                if (!response.IsSuccessStatusCode) return null;

                var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var tokenResponse = System.Text.Json.JsonSerializer.Deserialize<FacebookTokenResponse>(responseContent, options);
                Console.WriteLine("✅ Facebook token exchange successful");
                return tokenResponse;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Exception during Facebook token exchange: {ex.Message}");
                return null;
            }
        }

        private async Task<FacebookUserInfo?> GetFacebookUserInfo(string accessToken)
        {
            try
            {
                using var client = new HttpClient();
                var url = $"https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token={accessToken}";

                Console.WriteLine("🔗 Fetching Facebook User Info...");
                var response = await client.GetAsync(url);
                var responseContent = await response.Content.ReadAsStringAsync();

                Console.WriteLine($"📡 Status: {response.StatusCode}");
                Console.WriteLine($"📡 Response: {responseContent}");

                if (!response.IsSuccessStatusCode) return null;

                var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                return System.Text.Json.JsonSerializer.Deserialize<FacebookUserInfo>(responseContent, options);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Exception getting Facebook user info: {ex.Message}");
                return null;
            }
        }

        // HTML templates for mobile OAuth response
        private string GetSuccessHtml(string token, bool isNewUser, string provider, string? facebookAccessToken = null)
        {
            var facebookAccessTokenScript = string.IsNullOrEmpty(facebookAccessToken)
                ? ""
                : $",\n                facebookAccessToken: '{facebookAccessToken}'";

            return $@"
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Successful</title>
    <meta name=""viewport"" content=""width=device-width, initial-scale=1"">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }}
        .container {{
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }}
        .success-icon {{
            font-size: 64px;
            margin-bottom: 20px;
        }}
        h1 {{
            color: #2d3748;
            margin-bottom: 10px;
        }}
        p {{
            color: #718096;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""success-icon"">✅</div>
        <h1>Authentication Successful!</h1>
        <p>Logged in with {provider}</p>
        <p><small>Token: {token.Substring(0, Math.Min(50, token.Length))}...</small></p>
        <p><small>New User: {isNewUser}</small></p>
        <p>You can now close this window.</p>
    </div>
    <script>
        console.log('🔍 OAuth callback page loaded');
        console.log('🔍 window.opener exists:', !!window.opener);
        
        // For web: send token back to parent window via postMessage
        if (window.opener) {{
            console.log('✅ window.opener found, sending postMessage...');
            window.opener.postMessage({{
                type: 'oauth-success',
                token: '{token}',
                isNewUser: {isNewUser.ToString().ToLower()},
                provider: '{provider}'{facebookAccessTokenScript}
            }}, '*');
            
            console.log('✅ postMessage sent, closing in 500ms...');
            
            // Close after sending message
            setTimeout(() => {{
                console.log('🔒 Closing popup...');
                window.close();
            }}, 500);
        }} else {{
            console.log('⚠️ window.opener not found, using fallback...');
            // Fallback: Store in window and close
            window.authToken = '{token}';
            window.isNewUser = {isNewUser.ToString().ToLower()};
            setTimeout(() => {{
                window.close();
            }}, 2000);
        }}
    </script>
</body>
</html>";
        }

        private string GetErrorHtml(string error)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <title>Authentication Failed</title>
    <meta name=""viewport"" content=""width=device-width, initial-scale=1"">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }}
        .container {{
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }}
        .error-icon {{
            font-size: 64px;
            margin-bottom: 20px;
        }}
        h1 {{
            color: #c53030;
            margin-bottom: 10px;
        }}
        p {{
            color: #718096;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""error-icon"">❌</div>
        <h1>Authentication Failed</h1>
        <p>{error}</p>
        <p><small>Please close this window and try again.</small></p>
    </div>
</body>
</html>";
        }

        // Response models
        public class GoogleTokenResponse
        {
            [System.Text.Json.Serialization.JsonPropertyName("access_token")]
            public string AccessToken { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("id_token")]
            public string? IdToken { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("expires_in")]
            public int ExpiresIn { get; set; }
        }

        public class GoogleUserInfo
        {
            [System.Text.Json.Serialization.JsonPropertyName("email")]
            public string Email { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("given_name")]
            public string GivenName { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("family_name")]
            public string FamilyName { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("picture")]
            public string Picture { get; set; }
        }

        public class FacebookTokenResponse
        {
            [System.Text.Json.Serialization.JsonPropertyName("access_token")]
            public string AccessToken { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("token_type")]
            public string TokenType { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("expires_in")]
            public int ExpiresIn { get; set; }
        }

        public class FacebookUserInfo
        {
            [System.Text.Json.Serialization.JsonPropertyName("id")]
            public string Id { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("email")]
            public string Email { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("first_name")]
            public string FirstName { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("last_name")]
            public string LastName { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("picture")]
            public FacebookPicture Picture { get; set; }
        }

        public class FacebookPicture
        {
            [System.Text.Json.Serialization.JsonPropertyName("data")]
            public FacebookPictureData Data { get; set; }
        }

        public class FacebookPictureData
        {
            [System.Text.Json.Serialization.JsonPropertyName("url")]
            public string? Url { get; set; }
        }
    }
}
