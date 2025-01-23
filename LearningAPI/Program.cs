using LearningAPI;
using LearningAPI.Controllers;
using LearningAPI.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddDbContext<MyDbContext>();

// Add CORS policy
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
if (allowedOrigins == null || allowedOrigins.Length == 0)
{
	throw new Exception("AllowedOrigins is required for CORS policy.");
}
builder.Services.AddCors(options =>
{
	options.AddDefaultPolicy(
		policy =>
		{
			policy.WithOrigins(allowedOrigins)
				  .AllowAnyMethod()
				  .AllowAnyHeader()
				  .AllowCredentials(); // Allow credentials if needed (e.g., cookies, authorization headers)
		});
});

// Authentication
var secret = builder.Configuration.GetValue<string>("Authentication:Secret");
if (string.IsNullOrEmpty(secret))
{
	throw new Exception("Secret is required for JWT authentication.");
}
builder.Services
	.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(options =>
	{
		options.TokenValidationParameters = new TokenValidationParameters()
		{
			ValidateIssuer = false,
			ValidateAudience = false,
			ValidateLifetime = true,
			ValidateIssuerSigningKey = true,
			IssuerSigningKey = new SymmetricSecurityKey(
				Encoding.UTF8.GetBytes(secret)
			),
		};
		// Use ILogger to log messages
		options.Events = new JwtBearerEvents
		{
			OnAuthenticationFailed = context =>
			{
				var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
				logger.LogError($"Authentication failed: {context.Exception.Message}");
				return Task.CompletedTask;
			},
			OnTokenValidated = context =>
			{
				var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
				logger.LogInformation("Token validated successfully.");
				return Task.CompletedTask;
			},
			OnMessageReceived = context =>
			{
				var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
				logger.LogInformation($"Received Token: {context.Request.Headers["Authorization"]}");
				return Task.CompletedTask;
			}
		};
	});

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
	var securityScheme = new OpenApiSecurityScheme
	{
		In = ParameterLocation.Header,
		Description = "Token",
		Name = "Authorization",
		Type = SecuritySchemeType.Http,
		BearerFormat = "JWT",
		Scheme = "Bearer",
		Reference = new OpenApiReference
		{
			Type = ReferenceType.SecurityScheme,
			Id = "Bearer"
		}
	};
	options.AddSecurityDefinition("Bearer", securityScheme);
	options.AddSecurityRequirement(new OpenApiSecurityRequirement
	{
		{ securityScheme, new List<string>() }
	});
});

var app = builder.Build();

// Initialize the super admin
using (var scope = app.Services.CreateScope())
{
	var context = scope.ServiceProvider.GetRequiredService<MyDbContext>();
	context.Database.EnsureCreated(); // Ensure the database is created
	InitializeSuperAdmin(context); // Call the method
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	app.UseSwagger();
	app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS before other middleware
app.UseCors();

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

void InitializeSuperAdmin(MyDbContext context)
{
	var superAdminEmail = "superadmin@greenthread.com";
	var superAdmin = context.Admins.FirstOrDefault(a => a.Email == superAdminEmail);
	if (superAdmin == null)
	{
		string passwordHash = BCrypt.Net.BCrypt.HashPassword("superadmin@123");
		context.Admins.Add(new Admin
		{
			Email = superAdminEmail,
			Password = passwordHash,
			CreatedAt = DateTime.Now,
			UpdatedAt = DateTime.Now
		});
		context.SaveChanges();
	}
}