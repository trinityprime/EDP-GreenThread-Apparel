using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace LearningAPI.Models
{
	public class CustomerService
	{
		public int CustomerServiceID { get; set; }

		[Required, MinLength(3), MaxLength(1000)]
		public string Comment { get; set; } = string.Empty;

		[Required]
		public CustomerServiceStatus Status { get; set; }

		[Column(TypeName = "datetime")]
		public DateTime CreatedAt { get; set; }

		[Column(TypeName = "datetime")]
		public DateTime UpdatedAt { get; set; }



		[Required]
		public bool NeedReply { get; set; }



		[MaxLength(1000)]
		public string AdminNote { get; set; } = string.Empty;

		[Required]
		[ForeignKey("User")]
		public int UserID { get; set; } // Foreign Key to User
		public virtual User? User { get; set; } // Navigation to User model
	}

	public enum CustomerServiceStatus
	{
		Pending,
		Completed
	}
}