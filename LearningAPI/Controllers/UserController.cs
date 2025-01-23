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
	public class UserController : ControllerBase
	{
		private readonly MyDbContext _context;
		private readonly IConfiguration _configuration;

		public UserController(MyDbContext context, IConfiguration configuration)
		{
			_context = context;
			_configuration = configuration;
		}

		[HttpPost("register")]
		public IActionResult Register(RegisterRequest request)
		{
			// Trim string values
			request.FirstName = request.FirstName.Trim();
			request.LastName = request.LastName.Trim();
			request.Email = request.Email.Trim().ToLower();
			request.Password = request.Password.Trim();
			request.PostalCode = request.PostalCode.Trim();

			// Check email
			var foundUser = _context.Users.Where(x => x.Email == request.Email).FirstOrDefault();
			if (foundUser != null)
			{
				string message = "Email already exists.";
				return BadRequest(new { message });
			}

			// Create user object
			var now = DateTime.Now;
			string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
			var user = new User()
			{
				FirstName = request.FirstName,
				LastName = request.LastName,
				Email = request.Email,
				Password = passwordHash,
				PostalCode = request.PostalCode,
				CreatedAt = now,
				UpdatedAt = now,
				IsDeactivated = false, 
				Role = "User"
			};

			// Add user
			_context.Users.Add(user);
			_context.SaveChanges();
			return Ok();
		}

		[HttpPost("login")]
		public IActionResult Login(LoginRequest request)
		{
			// Trim string values
			request.Email = request.Email.Trim().ToLower();
			request.Password = request.Password.Trim();

			// Check email and password
			string message = "Email or password is incorrect, or your account may be deactivated.";
			var foundUser = _context.Users.Where(x => x.Email == request.Email).FirstOrDefault();
			if (foundUser == null || foundUser.IsDeactivated)
			{
				return BadRequest(new { message });
			}

			bool verified = BCrypt.Net.BCrypt.Verify(request.Password, foundUser.Password);
			if (!verified)
			{
				return BadRequest(new { message });
			}

			// Return user info
			var user = new
			{
				foundUser.UserID,
				foundUser.Email,
				foundUser.FirstName,
				foundUser.LastName,
				foundUser.PostalCode,
				foundUser.Role
			};
			string accessToken = CreateToken(foundUser);
			return Ok(new { user, accessToken });
		}


		[HttpGet("auth"), Authorize]
		public IActionResult Auth()
		{
			var id = Convert.ToInt32(User.Claims.Where(c => c.Type == ClaimTypes.NameIdentifier)
				.Select(c => c.Value).SingleOrDefault());
			var firstName = User.Claims.Where(c => c.Type == ClaimTypes.GivenName)
				.Select(c => c.Value).SingleOrDefault();
			var lastName = User.Claims.Where(c => c.Type == ClaimTypes.Surname)
				.Select(c => c.Value).SingleOrDefault();
			var email = User.Claims.Where(c => c.Type == ClaimTypes.Email)
				.Select(c => c.Value).SingleOrDefault();
			var postalCode = User.Claims.Where(c => c.Type == "PostalCode")
				.Select(c => c.Value).SingleOrDefault();
			var role = User.Claims.Where(c => c.Type == ClaimTypes.Role) 
				.Select(c => c.Value).SingleOrDefault();

			if (id != 0 && firstName != null && lastName != null && email != null && postalCode != null && role != null)
			{
				var user = new
				{
					id,
					email,
					firstName,
					lastName,
					postalCode,
					role // Include the user's role
				};
				return Ok(new { user });
			}
			else
			{
				return Unauthorized();
			}
		}

		// Get all users
		[HttpGet("all")]
		public IActionResult GetAllUsers()
		{
			var users = _context.Users
				.Select(u => new
				{
					u.UserID,
					u.FirstName,
					u.LastName,
					u.Email,
					u.PostalCode,
					u.IsDeactivated, // Include deactivation status
					u.CreatedAt,
					u.UpdatedAt,
					u.Role
				}).ToList();

			if (users.Count == 0)
			{
				return NotFound(new { message = "No users found." });
			}

			return Ok(users);
		}


		// Get individual user by ID
		[HttpGet("{id}")]
		public IActionResult Read(int id)
		{
			// Retrieve user by ID, include deactivation status
			var user = _context.Users
				.Where(u => u.UserID == id) // Do not exclude deactivated users
				.Select(u => new
				{
					u.UserID,
					u.FirstName,
					u.LastName,
					u.Email,
					u.PostalCode,
					u.IsDeactivated, // Include deactivation status
					u.CreatedAt,
					u.UpdatedAt,
					u.Role
				}).FirstOrDefault();

			if (user == null)
			{
				return NotFound(new { message = "User not found." });
			}

			return Ok(user);
		}

		[HttpPut("{id}")]
		public IActionResult Update(int id, UpdateRequest request)
		{
			// Retrieve user by ID
			var user = _context.Users.FirstOrDefault(u => u.UserID == id && !u.IsDeactivated); 
			if (user == null)
			{
				return NotFound(new { message = "User not found or account deactivated." });
			}

			// Update user details
			user.FirstName = request.FirstName.Trim();
			user.LastName = request.LastName.Trim();
			user.Email = request.Email.Trim().ToLower();
			user.PostalCode = request.PostalCode.Trim();
			user.UpdatedAt = DateTime.Now;

			// Save changes
			_context.Users.Update(user);
			_context.SaveChanges();

			return Ok(new { message = "User updated successfully." });
		}

		// Deactivate and reactivate user
		[HttpPut("deactivate/{id}")]
		public async Task<IActionResult> DeactivateUser(int id)
		{
			var user = await _context.Users.FindAsync(id);
			if (user == null)
			{
				return NotFound("User not found.");
			}

			user.IsDeactivated = true;
			await _context.SaveChangesAsync();
			return Ok("User has been deactivated.");
		}

		[HttpPut("activate/{id}")]
		public async Task<IActionResult> ActivateUser(int id)
		{
			var user = await _context.Users.FindAsync(id);
			if (user == null)
			{
				return NotFound("User not found.");
			}

			user.IsDeactivated = false;
			await _context.SaveChangesAsync();
			return Ok("User has been activated.");
		}

		private string CreateToken(User user)
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
				new Claim(ClaimTypes.NameIdentifier, user.UserID.ToString()),
				new Claim(ClaimTypes.GivenName, user.FirstName),
				new Claim(ClaimTypes.Surname, user.LastName),
				new Claim(ClaimTypes.Email, user.Email),
				new Claim("PostalCode", user.PostalCode),
				new Claim(ClaimTypes.Role, user.Role)
				}),
				Expires = DateTime.UtcNow.AddDays(tokenExpiresDays),
				SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
			};
			var securityToken = tokenHandler.CreateToken(tokenDescriptor);
			string token = tokenHandler.WriteToken(securityToken);

			return token;
		}
	}
}
