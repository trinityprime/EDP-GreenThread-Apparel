using Microsoft.AspNetCore.Mvc;
using LearningAPI.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShoppingCartController : ControllerBase
    {
        private readonly MyDbContext _context;

        public ShoppingCartController(MyDbContext context)
        {
            _context = context;
        }

        // 📋 GET All Shopping Cart Items
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var shoppingCarts = await _context.ShoppingCarts
                    .Include(c => c.Product)
                    .Include(c => c.User)
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();

                return Ok(shoppingCarts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        // 📌 GET Shopping Cart by ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var shoppingCart = await _context.ShoppingCarts
                .Include(c => c.Product)
                .Include(c => c.User)
                .FirstOrDefaultAsync(x => x.ShoppingCartID == id);

            if (shoppingCart == null)
                return NotFound($"Shopping cart with ID {id} not found.");

            return Ok(shoppingCart);
        }

        // ➕ POST Add Product to Shopping Cart
        [HttpPost]
        public async Task<IActionResult> AddToCart([FromBody] ShoppingCart shoppingCart)
        {
            if (shoppingCart == null)
                return BadRequest("ShoppingCart data is required.");

            var userExists = await _context.Users.AnyAsync(u => u.UserID == shoppingCart.UserID);
            if (!userExists)
                return BadRequest("Invalid UserID. User does not exist.");

            var product = await _context.Products.FindAsync(shoppingCart.ProductID);
            if (product == null)
                return BadRequest("Invalid ProductID. Product does not exist.");

            // Prevent ShoppingCartID from being set manually
            var newShoppingCart = new ShoppingCart
            {
                UserID = shoppingCart.UserID,
                ProductID = shoppingCart.ProductID,
                Quantity = shoppingCart.Quantity,
                GrandTotal = shoppingCart.Quantity * product.Price,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.ShoppingCarts.Add(newShoppingCart);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = newShoppingCart.ShoppingCartID }, newShoppingCart);
        }


        // 🔄 PUT Update Quantity in Shopping Cart
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuantity(int id, [FromBody] int newQuantity)
        {
            if (newQuantity < 1)
                return BadRequest("Quantity must be at least 1.");

            var cartItem = await _context.ShoppingCarts.Include(c => c.Product).FirstOrDefaultAsync(c => c.ShoppingCartID == id);
            if (cartItem == null)
                return NotFound("Shopping cart item not found.");

            // Update quantity and total price
            cartItem.UpdateQuantity(newQuantity, cartItem.Product.Price);
            cartItem.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(cartItem);
        }

        // 🗑️ DELETE Remove Product from Shopping Cart
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFromCart(int id)
        {
            var cartItem = await _context.ShoppingCarts.FindAsync(id);
            if (cartItem == null)
                return NotFound($"Shopping cart item with ID {id} not found.");

            _context.ShoppingCarts.Remove(cartItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Checkout
        [HttpPost("{userId}/checkout")]
        public async Task<IActionResult> Checkout(int userId, [FromBody] Payment paymentRequest)
        {
            var cartItems = await _context.ShoppingCarts
                .Where(c => c.UserID == userId)
                .Include(c => c.Product)
                .ToListAsync();

            if (!cartItems.Any())
                return BadRequest("Your shopping cart is empty.");

            // Get the first cart item to store its ID (assuming 1 cart per user)
            int shoppingCartID = cartItems.First().ShoppingCartID;

            // Calculate Grand Total
            decimal grandTotal = cartItems.Sum(c => c.Quantity * c.Product.Price);

            // Create a new Payment with "Pending" status
            var newPayment = new Payment
            {
                UserID = userId,
                ShoppingCartID = shoppingCartID, // Save which cart is being paid for
                Address = paymentRequest.Address,
                PhoneNumber = paymentRequest.PhoneNumber,
                PaymentMethod = paymentRequest.PaymentMethod,
                AmountPaid = grandTotal, // Must match GrandTotal
                PaymentStatus = PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(newPayment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment initiated. Proceed to complete payment.", PaymentID = newPayment.PaymentID });
        }

    }
}
