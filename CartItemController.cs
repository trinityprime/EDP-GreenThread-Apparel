using Microsoft.AspNetCore.Mvc;
using EDP_API.Models;
using System.Linq;
using System;
using Microsoft.EntityFrameworkCore;

namespace EDP_API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CartItemController : ControllerBase
    {
        private readonly MyDbContext _context;

        public CartItemController(MyDbContext context)
        {
            _context = context;
        }
        // GET: /CartItem
        [HttpGet]
        public IActionResult GetAll()
        {
            IQueryable<CartItem> result = _context.CartItems;
            var list = result.OrderByDescending(x => x.CreatedAt).ToList();
            return Ok(list);
        }

        // GET: /CartItem/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var cartItem = _context.CartItems.FirstOrDefault(x => x.CartItemID == id);
            if (cartItem == null)
            {
                return NotFound($"Cart item with ID {id} not found.");
            }
            return Ok(cartItem);
        }
        // POST: /CartItem
        [HttpPost]
        public IActionResult AddCartItem([FromBody] CartItem cartItem)
        {
            if (cartItem == null)
            {
                return BadRequest("CartItem data is required.");
            }

            // Validate the fields
            if (cartItem.ProductID == 0 || cartItem.Quantity <= 0)
            {
                return BadRequest("ProductID and Quantity must be valid.");
            }

            // Ensure the Product exists
            var product = _context.Products.Find(cartItem.ProductID);
            if (product == null)
            {
                return BadRequest("Product with the specified ProductID does not exist.");
            }

            // Set the timestamps
            var now = DateTime.UtcNow;
            // Create a new CartItem
            var newCartItem = new CartItem
            {
                ProductID = cartItem.ProductID,
                Quantity = cartItem.Quantity,
                CreatedAt = now,
                UpdatedAt = now
            };

            // Add the new CartItem to the context
            _context.CartItems.Add(newCartItem);
            _context.SaveChanges();

            // Return the newly created CartItem
            return CreatedAtAction(nameof(GetById), new { id = newCartItem.CartItemID }, newCartItem);
        }
        // PUT: /CartItem/{id}
        [HttpPut("{id}")]
        public IActionResult UpdateCartItem(int id, [FromBody] CartItem cartItem)
        {
            if (cartItem == null || id != cartItem.CartItemID)
            {
                return BadRequest(new { Message = "Invalid data or ID mismatch." });
            }

            var existingCartItem = _context.CartItems.FirstOrDefault(x => x.CartItemID == id);
            if (existingCartItem == null)
            {
                return NotFound(new { Message = $"Cart item with ID {id} not found." });
            }

            existingCartItem.ProductID = cartItem.ProductID;
            existingCartItem.Quantity = cartItem.Quantity;
            existingCartItem.UpdatedAt = DateTime.UtcNow;

            _context.SaveChanges();

            return NoContent();
        }

        // DELETE: /CartItem/{id}
        [HttpDelete("{id}")]
        public IActionResult DeleteCartItem(int id)
        {
            var cartItem = _context.CartItems.FirstOrDefault(x => x.CartItemID == id);
            if (cartItem == null)
            {
                return NotFound(new { Message = $"Cart item with ID {id} not found." });
            }

            _context.CartItems.Remove(cartItem);
            _context.SaveChanges();

            return NoContent();
        }
    }
}