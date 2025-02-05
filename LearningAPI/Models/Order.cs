using LearningAPI.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace LearningAPI.Models
{
    public class Order
    {
        [Key]
        public int OrderID { get; set; } // Primary Key

        [Required]
        [ForeignKey("User")]
        public int UserID { get; set; } // Foreign Key to User
        public virtual User? User { get; set; } // Navigation to User model

        [Required]
        [ForeignKey("Payment")]
        public int PaymentID { get; set; } // Foreign Key to Payment
        public virtual Payment? Payment { get; set; } // Navigation to Payment model

        [Required]
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        [Required]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public OrderStatus OrderStatus { get; set; } = OrderStatus.Pending; // Default: Pending

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal GrandTotal { get; set; } // Order total amount

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Order items (from Shopping Cart)
        public virtual List<OrderSummaryItem>? OrderSummaryItems { get; set; }

        //// Refunds (if applicable)
        //public virtual List<Refund>? Refunds { get; set; }
    }

    public enum OrderStatus
    {
        Pending,   // "Pending" (Before Payment)
        Completed, // "Completed" (After Payment)
        Cancelled  // "Cancelled"
    }
}
