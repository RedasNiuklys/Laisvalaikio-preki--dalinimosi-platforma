using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Server.Services;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
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

// Configure URLs
builder.WebHost.UseUrls("http://10.151.26.44:5000");

var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
builder.Services.AddScoped<ITokenService, TokenService>();

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
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };

    // Configure for SignalR
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
        }
    };
})
.AddOpenIdConnect("Google", options =>
{
    options.Authority = "https://accounts.google.com";
    options.ClientId = builder.Configuration["Authentication:Google:ClientId"];
    options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
    options.ResponseType = "code";
    options.CallbackPath = "/api/login/google-callback";
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("email");
    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = "name",
        RoleClaimType = "role"
    };
    options.SaveTokens = true;
    options.Events = new OpenIdConnectEvents
    {
        OnRedirectToIdentityProvider = context =>
        {
            context.ProtocolMessage.RedirectUri = $"{builder.Configuration["Client:Url"]}/api/login/google-callback";
            return Task.CompletedTask;
        }
    };
})
.AddFacebook(options =>
{
    options.AppId = builder.Configuration["Authentication:Facebook:ClientId"];
    options.AppSecret = builder.Configuration["Authentication:Facebook:ClientSecret"];
    options.CallbackPath = "/signin-facebook";
    options.SaveTokens = true;
    options.Fields.Add("name");
    options.Fields.Add("email");
});

// Add SignalR services
System.Console.WriteLine("Adding SignalR services");
builder.Services.AddSignalR();

// Configure CORS
System.Console.WriteLine("Configuring CORS");
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", builder =>
        builder
            .WithOrigins(
                "http://10.151.26.44:5000",    // Server
                "http://10.151.26.44:8081",    // Client web
                "http://10.151.26.44:19000",   // Expo dev client
                "http://10.151.26.44:19006",   // Expo web
                "http://localhost:8081",        // Local client web
                "http://localhost:19000",       // Local Expo dev client
                "http://localhost:19006",       // Local Expo web
                "exp://10.151.26.44:19000",    // Expo dev client
                "exp://10.151.26.44:8081",     // Expo web
                "exp://localhost:19000",        // Local Expo dev client
                "exp://localhost:8081"          // Local Expo web
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .WithExposedHeaders("Content-Disposition"));
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

System.Console.WriteLine("Building app");
var app = builder.Build();
System.Console.WriteLine("Building app done");
app.UseSwagger();
app.UseSwaggerUI();

// Disable HTTPS redirection
// app.UseHttpsRedirection();

// Enable static file serving
app.UseStaticFiles();

// Use CORS before authentication and authorization
app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map SignalR hub
System.Console.WriteLine("Mapping SignalR hub");
app.MapHub<ChatHub>("/chatHub");

// Add this after app.Build()

System.Console.WriteLine("Running app");
app.Run();
System.Console.WriteLine("Running app done");
