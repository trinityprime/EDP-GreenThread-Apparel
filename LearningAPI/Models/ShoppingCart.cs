using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LearningAPI.Models
{
    public class ShoppingCart
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ShoppingCartID { get; set; } // Unique identifier for the shopping cart

        // Foreign Key for User
        [Required]
        public int UserID { get; set; } // User owning the shopping cart
        [ForeignKey("UserID")]
        public virtual User? User { get; set; } // Navigation property for the User

        // Collection of items in the cart
        public virtual ICollection<ShoppingCartItem> ShoppingCartItems { get; set; } = new List<ShoppingCartItem>(); 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; 
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow; 

        public bool IsActive { get; set; } = false;
    }

}
