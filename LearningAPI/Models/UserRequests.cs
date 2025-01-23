using System.ComponentModel.DataAnnotations;

namespace LearningAPI.Models
{
	public class RegisterRequest
	{
		[Required, MinLength(3), MaxLength(50)]
		// Regular expression to enforce name format
		[RegularExpression(@"^[a-zA-Z '-,.]+$",
			ErrorMessage = "Only allow letters, spaces and characters: ' - , .")]
		public string FirstName { get; set; } = string.Empty;

		[Required, MinLength(3), MaxLength(50)]
		// Regular expression to enforce name format
		[RegularExpression(@"^[a-zA-Z '-,.]+$",
			ErrorMessage = "Only allow letters, spaces and characters: ' - , .")]
		public string LastName { get; set; } = string.Empty;

		[Required, EmailAddress, MaxLength(50)]
		public string Email { get; set; } = string.Empty;

		[Required, MinLength(8), MaxLength(50)]
		// Regular expression to enforce password complexity
		[RegularExpression(@"^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$",
			ErrorMessage = "At least 1 letter and 1 number")]
		public string Password { get; set; } = string.Empty;

		[Required, RegularExpression(@"^\d{6}$", ErrorMessage = "Postal code must be a 6-digit number.")]
		public string PostalCode { get; set; } = string.Empty;
	}

	public class LoginRequest
	{
		[Required, EmailAddress, MaxLength(50)]
		public string Email { get; set; } = string.Empty;

		[Required, MinLength(8), MaxLength(50)]
		public string Password { get; set; } = string.Empty;
	}

	public class UpdateRequest
	{
		[Required, MinLength(3), MaxLength(50)]
		[RegularExpression(@"^[a-zA-Z '-,.]+$",
			ErrorMessage = "Only allow letters, spaces and characters: ' - , .")]
		public string FirstName { get; set; } = string.Empty;

		[Required, MinLength(3), MaxLength(50)]
		[RegularExpression(@"^[a-zA-Z '-,.]+$",
			ErrorMessage = "Only allow letters, spaces and characters: ' - , .")]
		public string LastName { get; set; } = string.Empty;

		[Required, EmailAddress, MaxLength(50)]
		public string Email { get; set; } = string.Empty;

		[Required, RegularExpression(@"^\d{6}$", ErrorMessage = "Postal code must be a 6-digit number.")]
		public string PostalCode { get; set; } = string.Empty;
	}
}
