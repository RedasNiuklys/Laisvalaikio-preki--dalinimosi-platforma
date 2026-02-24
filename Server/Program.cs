using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Server.Services;
using Microsoft.AspNetCore.SignalR;
using Server.Models;
using Server.Hubs;
using Microsoft.Extensions.Logging;
var builder = WebApplication.CreateBuilder(args);

// Configure logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
builder.Logging.SetMinimumLevel(LogLevel.Debug);

var dbPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "database.db");
Console.WriteLine("Database path: " + dbPath);

// Use SQLite instead of SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlite($"Data Source={dbPath}");
    options.EnableSensitiveDataLogging();
    options.EnableDetailedErrors();
});

// Identity + EF Core
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Configure URLs - Listen on both HTTP (mobile) and HTTPS (web)
// Using port 8000 to avoid FortiClient blocking common ports
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.ListenAnyIP(8000, listenOptions =>
    {
        // HTTP for mobile dev (Expo Go doesn't trust self-signed certs)
        // HTTPS for web (where cert is trusted)
        listenOptions.UseHttps(); // HTTPS on 8000
    });
    serverOptions.ListenAnyIP(8001, listenOptions =>
    {
        // HTTP fallback for mobile
    });
});

var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddSingleton<FirebaseAuthService>();

System.Console.WriteLine("JWT Key: " + jwtKey);
System.Console.WriteLine("JWT Issuer: " + jwtIssuer);
System.Console.WriteLine("JWT Audience: " + jwtAudience);

// Configure authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        // Disable all validation - let Firebase verification handle it in OnTokenValidated
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = false,
        ValidateIssuerSigningKey = false,
        RequireSignedTokens = false,
        // Skip signature validation entirely
        SignatureValidator = (token, parameters) => new Microsoft.IdentityModel.JsonWebTokens.JsonWebToken(token)
    };

    // Configure for SignalR and Firebase tokens
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chatHub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        },
        OnTokenValidated = async context =>
        {
            // Check if this is a Firebase token by attempting to verify it
            var token = context.SecurityToken as Microsoft.IdentityModel.JsonWebTokens.JsonWebToken;
            if (token != null)
            {
                var firebaseService = context.HttpContext.RequestServices.GetService<FirebaseAuthService>();
                var userManager = context.HttpContext.RequestServices.GetService<UserManager<ApplicationUser>>();

                if (firebaseService != null && userManager != null)
                {
                    try
                    {
                        // Try to verify as Firebase token
                        var firebaseToken = await firebaseService.VerifyTokenAsync(token.EncodedToken);
                        var firebaseUid = firebaseToken.Uid;

                        // Find ASP.NET Identity user by Firebase UID
                        var aspNetUser = userManager.Users.FirstOrDefault(u => u.FirebaseUid == firebaseUid);

                        if (aspNetUser != null)
                        {
                            // Map Firebase token to ASP.NET Identity user
                            var claims = new List<System.Security.Claims.Claim>
                            {
                                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, aspNetUser.Id),
                                new System.Security.Claims.Claim("firebase_uid", firebaseUid),
                                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Email, firebaseToken.Claims["email"].ToString()),
                                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, aspNetUser.UserName ?? aspNetUser.Email)
                            };

                            var identity = new System.Security.Claims.ClaimsIdentity(claims, "Firebase");
                            context.Principal = new System.Security.Claims.ClaimsPrincipal(identity);
                        }
                        else
                        {
                            Console.WriteLine($"Firebase user {firebaseUid} not found in ASP.NET Identity");
                            context.Fail("User not found in database");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Firebase token validation error: {ex.Message}");
                        // Not a Firebase token, continue with JWT validation
                    }
                }
            }
        }
    };
});

// Add SignalR services
System.Console.WriteLine("Adding SignalR services");
builder.Services.AddSignalR();

// Configure CORS
System.Console.WriteLine("Configuring CORS");
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", builder =>
    {
        builder
            .SetIsOriginAllowed(origin => true) // Allow all origins during development
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .WithExposedHeaders("Content-Disposition");
    });
});

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(Program));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Equipment Sharing API", Version = "v1" });

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

System.Console.WriteLine("Building app");
var app = builder.Build();
System.Console.WriteLine("Building app done");

// Use CORS before any other middleware
app.UseCors("CorsPolicy");

// // Add request logging middleware
// app.Use(async (context, next) =>
// {
//     Console.WriteLine($"=== INCOMING REQUEST ===");
//     Console.WriteLine($"Method: {context.Request.Method}");
//     Console.WriteLine($"Path: {context.Request.Path}");
//     Console.WriteLine($"From: {context.Connection.RemoteIpAddress}");
//     Console.WriteLine($"Headers: {string.Join(", ", context.Request.Headers.Select(h => $"{h.Key}={h.Value}"))}");
//     await next();
//     Console.WriteLine($"Response Status: {context.Response.StatusCode}");
//     Console.WriteLine("======================");
// });

app.UseSwagger();
app.UseSwaggerUI();

// Enable static file serving
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Add health check endpoint (no auth required)
app.MapGet("/health", () => new
{
    status = "healthy",
    timestamp = DateTime.UtcNow,
    environment = builder.Environment.EnvironmentName,
    version = "1.0.0"
}).WithName("HealthCheck").WithOpenApi();

// Add info endpoint (no auth required)
app.MapGet("/", () => new
{
    message = "Equipment Sharing API",
    docs = "/swagger",
    health = "/health"
}).WithName("ApiInfo").WithOpenApi();

// Map SignalR hub
System.Console.WriteLine("Mapping SignalR hub");
app.MapHub<ChatHub>("/chatHub");

// Add this after app.Build()

System.Console.WriteLine("Running app");
app.Run();
System.Console.WriteLine("Running app done");
