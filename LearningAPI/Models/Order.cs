using System;
using System.Collections.Generic;
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
        [ForeignKey("ShoppingCart")]
        public int ShoppingCartID { get; set; } // Foreign Key to ShoppingCart
        public virtual ShoppingCart? ShoppingCart { get; set; } // Navigation to ShoppingCart model

        [Required]
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        [Required]
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public OrderStatus OrderStatus { get; set; } = OrderStatus.Pending; // Default: Pending

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal GrandTotal { get; set; } // Total price of all products in the order

        // Navigation to the items included in this order
        public virtual List<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum OrderStatus
    {
        Pending,   // "Pending" (Before Payment)
        Completed, // "Completed" (After Payment)
        Cancelled  // "Cancelled"
    }

    public class OrderItem
    {
        [Key]
        public int OrderItemID { get; set; } // Primary Key

        [Required]
        [ForeignKey("Order")]
        public int OrderID { get; set; } // Foreign Key to Order
        public virtual Order? Order { get; set; } // Navigation to Order

        [Required]
        public string ProductName { get; set; } // Name of the product

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; } // Price of the product

        [Required]
        public int Quantity { get; set; } // Quantity of the product

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal Total { get; set; } // Total = Price * Quantity

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public decimal DiscountPercentage { get; internal set; }
    }
}
