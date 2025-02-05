using LearningAPI.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;

namespace LearningAPI.Services
{
	public class OtpService
	{
		private readonly MyDbContext _context;
		private readonly IConfiguration _configuration;

		public OtpService(MyDbContext context, IConfiguration configuration)
		{
			_context = context;
			_configuration = configuration;
		}

		// Generate a random OTP code
		public string GenerateOtpCode()
		{
			var random = new Random();
			return random.Next(100000, 999999).ToString();
		}

		// Store OTP in the database
		public void StoreOtp(string email, string otpCode)
		{
			var user = _context.Users.FirstOrDefault(u => u.Email == email);
			if (user != null)
			{
				user.OtpCode = otpCode;
				user.OtpExpiry = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["OtpExpiryMinutes"]));
				_context.SaveChanges();
			}
		}

		// Validate OTP
		public bool ValidateOtp(string email, string otpCode)
		{
			var user = _context.Users.FirstOrDefault(u => u.Email == email);
			if (user != null && user.OtpCode == otpCode && user.OtpExpiry > DateTime.UtcNow)
			{
				return true;
			}
			return false;
		}
	}
}