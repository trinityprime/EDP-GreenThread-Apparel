using System.ComponentModel.DataAnnotations;

namespace LearningAPI.Models
{
	public class AdminLoginRequest
	{
		[Required, MaxLength(50)]
		[EmailAddress]
		public string Email { get; set; } = string.Empty;

		[Required, MinLength(8), MaxLength(50)]
		public string Password { get; set; } = string.Empty;
	}

	public class AdminRegisterRequest
	{
		[Required, MaxLength(50)]
		[EmailAddress]
		public string Email { get; set; } = string.Empty;

		[Required, MinLength(8), MaxLength(50)]
		[RegularExpression(@"^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$",
			ErrorMessage = "Password must contain at least one letter and one number.")]
		public string Password { get; set; } = string.Empty;
	}

	public class AdminUpdateRequest
	{
		[Required, MaxLength(50)]
		[EmailAddress]
		public string Email { get; set; } = string.Empty;
	}
}
