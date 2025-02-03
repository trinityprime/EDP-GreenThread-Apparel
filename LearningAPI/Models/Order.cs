using EDP_API.Models;
using LearningAPI.Models;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EDP_API.Models
{
    public class Order
    {
        public int OrderID { get; set; } // Primary Key

        [Required]
        public int UserID { get; set; } // Foreign Key to User

        [JsonIgnore] // Prevent serializing the User property
        public virtual User? User { get; set; } // Navigation to User model

        [Required]
        public int ShoppingCartID { get; set; } 

        [JsonIgnore] // Prevent serializing the shopping cart property
        public virtual ShoppingCart? ShoppingCart { get; set; }

        [Required]
        public DateTime OrderDate { get; set; }

        [Required]
        [JsonConverter(typeof(JsonStringEnumConverter))] // Converts enum to string during serialization/deserialization
        public Order_Status OrderStatus { get; set; }

        public enum Order_Status
        {
            Pending,   // "Pending"
            Completed, // "Completed"
            Cancelled  // "Cancelled"
        }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Nullable one-to-many relationship
        [JsonIgnore]
        public List<OrderSummaryItem>? OrderSummaryItems { get; set; }

        // Nullable Payment Navigation Property
        [JsonIgnore]
        public virtual Payment? Payments { get; set; }

        // Nullable Refund Navigation Property
        [JsonIgnore]
        public virtual Refund? Refunds { get; set; }
    }
}