using LearningAPI.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearningAPI.Models
{
    public class OrderSummaryItem
    {
        [Key]
        public int OrderSummaryItemID { get; set; }

        [Required]
        [ForeignKey("Order")]
        public int OrderID { get; set; }
        public virtual Order Order { get; set; } // Navigation to Order model

        [Required]
        [ForeignKey("Product")]
        public int ProductID { get; set; }
        public virtual Product Product { get; set; } // Navigation to Product model

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
        public int Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal PriceAtPurchase { get; set; } // Stores price at the time of purchase

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
