using LearningAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace LearningAPI.Controllers
{
	[ApiController]
	[Route("[controller]")]
	public class AdminController(MyDbContext context, IConfiguration configuration) : ControllerBase
	{
		private readonly MyDbContext _context = context;
		private readonly IConfiguration _configuration = configuration;

		// Login for admin
		[HttpPost("login")]
		public IActionResult Login(AdminLoginRequest request)
		{
			// Trim and format input
			request.Email = request.Email.Trim().ToLower();
			request.Password = request.Password.Trim();

			// Check email and password
			string message = "Email or password is not correct.";
			var foundAdmin = _context.Admins.FirstOrDefault(x => x.Email == request.Email);
			if (foundAdmin == null) return BadRequest(new { message });

			if (foundAdmin.IsDeactivated)
			{
				return BadRequest(new { message = "Your account has been deactivated." });
			}

			bool verified = BCrypt.Net.BCrypt.Verify(request.Password, foundAdmin.Password);
			if (!verified) return BadRequest(new { message });

			// Create JWT token
			string accessToken = CreateToken(foundAdmin);
			var admin = new
			{
				foundAdmin.AdminID,
				foundAdmin.Email,
				Role = "Admin"
			};
			return Ok(new { admin, accessToken });
		}

		// Register a new admin
		[HttpPost("register")]
		public IActionResult Register(AdminRegisterRequest request)
		{
			// Trim string values
			request.Email = request.Email.Trim().ToLower();
			request.Password = request.Password.Trim();

			// Check if email already exists
			var foundAdmin = _context.Admins.FirstOrDefault(x => x.Email == request.Email);
			if (foundAdmin != null) return BadRequest(new { message = "Email already exists." });

			// Create admin object
			string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
			var admin = new Admin
			{
				Email = request.Email,
				Password = passwordHash,
				CreatedAt = DateTime.Now,
				UpdatedAt = DateTime.Now,
				Role = "Admin"
			};

			// Add and save admin
			_context.Admins.Add(admin);
			_context.SaveChanges();
			return Ok(new { message = "Admin registered successfully." });
		}

		// Get all admins
		[HttpGet("all")]
		public IActionResult GetAllAdmins()
		{
			var admins = _context.Admins
				.Select(a => new
				{
					a.AdminID,
					a.Email,
					a.IsDeactivated,
					a.CreatedAt,
					a.UpdatedAt,
					a.Role
				}).ToList();

			if (admins.Count == 0)
			{
				return NotFound(new { message = "No admins found." });
			}

			return Ok(admins);
		}

		// Get an admin by ID
		[HttpGet("{id}")]
		public IActionResult GetAdminById(int id)
		{
			var admin = _context.Admins
				.Where(a => a.AdminID == id) // Do not exclude deactivated admins
				.Select(a => new
				{
					a.AdminID,
					a.Email,
					a.IsDeactivated, // Include deactivation status
					a.CreatedAt,
					a.UpdatedAt,
					a.Role
				})
				.FirstOrDefault();

			if (admin == null)
			{
				return NotFound(new { message = "Admin not found." });
			}

			return Ok(admin);
		}

		// Update an admin
		[HttpPut("{id}")]
		public IActionResult UpdateAdmin(int id, AdminUpdateRequest request)
		{
			var admin = _context.Admins.FirstOrDefault(x => x.AdminID == id && !x.IsDeactivated);  // Check for deactivated admin
			if (admin == null) return NotFound(new { message = "Admin not found or has been deactivated." });

			// Ensure super admin is not updatable
			if (admin.Email == "superadmin@greenthread.com")
			{
				return BadRequest(new { message = "Super admin cannot be updated." });
			}

			// Update admin details
			admin.Email = request.Email.Trim().ToLower();
			admin.UpdatedAt = DateTime.Now;

			_context.SaveChanges();
			return Ok(new { message = "Admin updated successfully." });
		}

		// Deactivate & Reactivate Admin
		[HttpPut("deactivate/{id}")]
		public async Task<IActionResult> DeactivateAdmin(int id)
		{
			var admin = await _context.Admins.FindAsync(id);
			if (admin == null)
			{
				return NotFound("Admin not found.");
			}

			// Ensure super admin cannot be deactivated
			if (admin.Email == "superadmin@greenthread.com")
			{
				return BadRequest("Super admin cannot be deactivated.");
			}

			admin.IsDeactivated = true;
			await _context.SaveChangesAsync();
			return Ok("Admin has been deactivated.");
		}

		[HttpPut("activate/{id}")]
		public async Task<IActionResult> ActivateAdmin(int id)
		{
			var admin = await _context.Admins.FindAsync(id);
			if (admin == null)
			{
				return NotFound("Admin not found.");
			}

			admin.IsDeactivated = false;
			await _context.SaveChangesAsync();
			return Ok("Admin has been activated.");
		}

		// Admin authentication
		[HttpGet("auth"), Authorize(Roles = "Admin")]
		public IActionResult AdminAuth()
		{
			var adminId = Convert.ToInt32(User.Claims.Where(c => c.Type == ClaimTypes.NameIdentifier)
				.Select(c => c.Value).SingleOrDefault());
			var email = User.Claims.Where(c => c.Type == ClaimTypes.Email)
				.Select(c => c.Value).SingleOrDefault();

			if (adminId != 0 && email != null)
			{
				var admin = new
				{
					adminId,
					email
				};
				return Ok(new { admin });
			}
			else
			{
				return Unauthorized();
			}
		}

		// Create the super admin on startup
		public static void InitializeSuperAdmin(MyDbContext context)
		{
			var superAdmin = context.Admins.FirstOrDefault(a => a.Email == "superadmin@greenthread.com");
			if (superAdmin == null)
			{
				string passwordHash = BCrypt.Net.BCrypt.HashPassword("superadmin@123");
				context.Admins.Add(new Admin
				{
					Email = "superadmin@greenthread.com",
					Password = passwordHash,
					CreatedAt = DateTime.Now,
					UpdatedAt = DateTime.Now,
					Role = "Admin"
				});
				context.SaveChanges();
			}
		}

		// Helper to create JWT token
		private string CreateToken(Admin admin)
		{
			string? secret = _configuration.GetValue<string>("Authentication:Secret");
			if (string.IsNullOrEmpty(secret))
			{
				throw new Exception("Secret is required for JWT authentication.");
			}

			int tokenExpiresDays = _configuration.GetValue<int>("Authentication:TokenExpiresDays");
			var tokenHandler = new JwtSecurityTokenHandler();
			var key = Encoding.ASCII.GetBytes(secret);

			var tokenDescriptor = new SecurityTokenDescriptor
			{
				Subject = new ClaimsIdentity(
				new[]
				{
				new Claim(ClaimTypes.NameIdentifier, admin.AdminID.ToString()),
				new Claim(ClaimTypes.Email, admin.Email),
				new Claim(ClaimTypes.Role, "Admin")
				}),
				Expires = DateTime.UtcNow.AddDays(tokenExpiresDays),
				SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
			};

			var securityToken = tokenHandler.CreateToken(tokenDescriptor);
			return tokenHandler.WriteToken(securityToken);
		}
	}

}

