using Microsoft.AspNetCore.Mvc;
using LearningAPI.Models;
using OtpNet;
using QRCoder;
using System.Drawing;
using System.Drawing.Imaging;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Identity;

namespace LearningAPI.Controllers
{
    [Route("api/2fa")]
    [ApiController]
    [Authorize]
    public class _2FAController : ControllerBase
    {
        private readonly MyDbContext _context;
        private readonly IConfiguration _configuration;

        public _2FAController(MyDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // Generate 2FA secret and QR code
        [HttpPost("enable")]
        public IActionResult Enable2FA([FromBody] Enable2FARequest request)
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            var user = _context.Users.FirstOrDefault(u => u.Email == userEmail);
            if (user == null) return Unauthorized();

            // Verify Password
            bool verified = BCrypt.Net.BCrypt.Verify(request.Password, user.Password);
            if (!verified)
            {
                return BadRequest(new { message = "Invalid password." });
            }

            // Generate new secret key
            var secretKey = KeyGeneration.GenerateRandomKey(20);
            user.TwoFactorSecret = Base32Encoding.ToString(secretKey);

<<<<<<< HEAD
			var issuer = _configuration["Jwt:Issuer"] ?? "GreenThreadApparel";
			var qrCodeUri = $"otpauth://totp/{issuer}:{user.Email}?secret={user.TwoFactorSecret}&issuer={issuer}";
=======
            var issuer = _configuration["Jwt:Issuer"] ?? "GreenThreadApparel";
            var qrCodeUri = $"otpauth://totp/{issuer}:{user.Email}?secret={user.TwoFactorSecret}&issuer={issuer}";
>>>>>>> ed2b8b8fd94982ca6f2784e3fce26029c529dd6d

            // Generate QR code image
            QRCodeGenerator qrGenerator = new QRCodeGenerator();
            QRCodeData qrCodeData = qrGenerator.CreateQrCode(qrCodeUri, QRCodeGenerator.ECCLevel.Q);
            PngByteQRCode qrCode = new PngByteQRCode(qrCodeData);
            byte[] qrCodeImage = qrCode.GetGraphic(20);

            _context.SaveChanges();

            return Ok(new
            {
                Secret = user.TwoFactorSecret,
                QrCodeUri = qrCodeUri,
                QrCodeImage = Convert.ToBase64String(qrCodeImage)
            });
        }

        // Verify 2FA setup code
        [HttpPost("verify")]
        public IActionResult Verify2FASetup([FromBody] Enable2FARequest request)
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            var user = _context.Users.FirstOrDefault(u => u.Email == userEmail);
            if (user == null) return Unauthorized();

            var totp = new Totp(Base32Encoding.ToBytes(user.TwoFactorSecret));
            bool isValid = totp.VerifyTotp(request.Code, out _);

            if (isValid)
            {
                user.IsTwoFactorEnabled = true;
                user.RecoveryCodes = GenerateRecoveryCodes();
                _context.SaveChanges();
                return Ok(new { RecoveryCodes = user.RecoveryCodes });
            }

            return BadRequest("Invalid verification code");
        }

        // verify 2fa during login
        [HttpPost("verify-login")]
        [AllowAnonymous]
        public IActionResult Verify2FALogin([FromBody] Verify2FALoginRequest request)
        {
            var user = _context.Users.FirstOrDefault(u => u.Email == request.Email);
            if (user == null) return NotFound();

            if (!user.IsTwoFactorEnabled)
                return BadRequest("2FA is not enabled for this account");

<<<<<<< HEAD
			// Check if the code is a recovery code
			if (user.RecoveryCodes.Contains(request.Code))
			{
				user.RecoveryCodes.Remove(request.Code);
				_context.SaveChanges();
			}
			else
			{
				// Verify TOTP code
				var totp = new Totp(Base32Encoding.ToBytes(user.TwoFactorSecret));
				if (!totp.VerifyTotp(request.Code, out _))
					return BadRequest("Invalid 2FA code or recovery code");
			}
=======
            // Check if the code is a recovery code
            if (user.RecoveryCodes.Contains(request.Code))
            {
                user.RecoveryCodes.Remove(request.Code);
                _context.SaveChanges();
            }
            else
            {
                // Verify TOTP code
                var totp = new Totp(Base32Encoding.ToBytes(user.TwoFactorSecret));
                if (!totp.VerifyTotp(request.Code, out _))
                    return BadRequest("Invalid 2FA code or recovery code");
            }
>>>>>>> ed2b8b8fd94982ca6f2784e3fce26029c529dd6d

            var accessToken = CreateToken(user);

            // Return the user object properly
            return Ok(new
            {
                user = new
                {
                    user.UserID,
                    user.Email,
                    user.FirstName,
                    user.LastName,
                    user.PostalCode,
                    user.Role,
                    user.IsTwoFactorEnabled
                },
                accessToken
            });
        }


<<<<<<< HEAD
		// disable 2fa
		[HttpPost("disable")]
		[Authorize]
		public IActionResult Disable2FA([FromBody] Enable2FARequest request)
		{
			var userEmail = User.FindFirstValue(ClaimTypes.Email);
			var user = _context.Users.FirstOrDefault(u => u.Email == userEmail);
			if (user == null) return Unauthorized();
=======
        // disable 2fa
        [HttpPost("disable")]
        [Authorize]
        public IActionResult Disable2FA([FromBody] Enable2FARequest request)
        {
            var userEmail = User.FindFirstValue(ClaimTypes.Email);
            var user = _context.Users.FirstOrDefault(u => u.Email == userEmail);
            if (user == null) return Unauthorized();

            // Verify Password
            bool verified = BCrypt.Net.BCrypt.Verify(request.Password, user.Password);
            if (!verified)
            {
                return BadRequest(new { message = "Invalid password." });
            }

            // Reset 2FA settings
            user.TwoFactorSecret = null;
            user.IsTwoFactorEnabled = false;
            user.RecoveryCodes = new List<string>();
>>>>>>> ed2b8b8fd94982ca6f2784e3fce26029c529dd6d

            _context.SaveChanges();

            return Ok(new { Success = true });
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

        private List<string> GenerateRecoveryCodes()
        {
            var codes = new HashSet<string>();
            var random = new Random();

            while (codes.Count < 8)
            {
                codes.Add(random.Next(100000, 999999).ToString());
            }

            return codes.ToList();
        }
    }
}