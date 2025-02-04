using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using LearningAPI.Models;
using LearningAPI;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly MyDbContext _context;

        public PaymentController(MyDbContext context)
        {
            _context = context;
        }

        // 🛒 Create Payment for Shopping Cart
        [HttpPost, Authorize]
        public async Task<IActionResult> CreatePayment(Payment paymentRequest)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Ensure user has a shopping cart
            var cartItems = await _context.ShoppingCarts
                .Where(c => c.UserID == paymentRequest.UserID)
                .Include(c => c.Product)
                .ToListAsync();

            if (!cartItems.Any())
                return BadRequest("Your shopping cart is empty.");

            // Get first ShoppingCart ID (assuming one cart per user)
            int shoppingCartID = cartItems.First().ShoppingCartID;

            // Check if a payment already exists for this ShoppingCartID
            var existingPayment = await _context.Payments
                .FirstOrDefaultAsync(p => p.ShoppingCartID == shoppingCartID);

            if (existingPayment != null)
                return Conflict("A payment already exists for this cart.");

            // Calculate total price from cart items
            decimal grandTotal = cartItems.Sum(c => c.Quantity * c.Product.Price);

            // Create new Payment
            var newPayment = new Payment
            {
                UserID = paymentRequest.UserID,
                ShoppingCartID = shoppingCartID, // Link to shopping cart
                Address = paymentRequest.Address,
                PhoneNumber = paymentRequest.PhoneNumber,
                PaymentMethod = paymentRequest.PaymentMethod,
                AmountPaid = grandTotal, // Ensure AmountPaid matches ShoppingCart GrandTotal
                PaymentStatus = PaymentStatus.Pending, // Default to Pending
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(newPayment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPaymentById), new { id = newPayment.PaymentID }, newPayment);
        }

        // 📋 Get All Payments
        [HttpGet, Authorize]
        public async Task<IActionResult> GetAllPayments()
        {
            var payments = await _context.Payments
                .Include(p => p.User)
                .Include(p => p.ShoppingCart)
                .ToListAsync();

            var result = payments.Select(p => new
            {
                p.PaymentID,
                p.UserID,
                User = new { p.User.FirstName, p.User.LastName },
                p.ShoppingCartID,
                CartItems = _context.ShoppingCarts
                    .Where(c => c.ShoppingCartID == p.ShoppingCartID)
                    .Select(c => new
                    {
                        c.Product.ProductName,
                        c.Quantity,
                        c.Product.Price
                    }).ToList(),
                p.Address,
                p.PhoneNumber,
                p.PaymentMethod,
                p.AmountPaid,
                PaymentStatus = p.PaymentStatus.ToString()
            });

            return Ok(result);
        }

        // 🔍 Get Payment by ID
        [HttpGet("{id}"), Authorize]
        public async Task<IActionResult> GetPaymentById(int id)
        {
            var payment = await _context.Payments
                .Include(p => p.User)
                .Include(p => p.ShoppingCart)
                .SingleOrDefaultAsync(p => p.PaymentID == id);

            if (payment == null)
                return NotFound();

            var data = new
            {
                payment.PaymentID,
                payment.UserID,
                User = new { payment.User.FirstName, payment.User.LastName },
                payment.ShoppingCartID,
                CartItems = _context.ShoppingCarts
                    .Where(c => c.ShoppingCartID == payment.ShoppingCartID)
                    .Select(c => new
                    {
                        c.Product.ProductName,
                        c.Quantity,
                        c.Product.Price
                    }).ToList(),
                payment.Address,
                payment.PhoneNumber,
                payment.PaymentMethod,
                payment.AmountPaid,
                PaymentStatus = payment.PaymentStatus.ToString()
            };

            return Ok(data);
        }

        // 💰 Confirm Payment (Change Status → Create Order)
        [HttpPut("confirm-payment/{paymentId}"), Authorize]
        public async Task<IActionResult> ConfirmPayment(int paymentId)
        {
            var payment = await _context.Payments.FindAsync(paymentId);
            if (payment == null)
                return NotFound("Payment not found.");

            if (payment.PaymentStatus == PaymentStatus.Completed)
                return BadRequest("Payment is already completed.");

            // Update Payment Status
            payment.PaymentStatus = PaymentStatus.Completed;
            payment.UpdatedAt = DateTime.UtcNow;

            // Retrieve Shopping Cart Items
            var cartItems = await _context.ShoppingCarts
                .Where(c => c.ShoppingCartID == payment.ShoppingCartID)
                .Include(c => c.Product)
                .ToListAsync();

            if (!cartItems.Any())
                return BadRequest("No items found in cart for this user.");

            // Calculate Grand Total (ensure accuracy)
            decimal grandTotal = cartItems.Sum(c => c.Quantity * c.Product.Price);

            // ✅ Create Order from Shopping Cart
            var newOrder = new Order
            {
                UserID = payment.UserID,
                OrderDate = DateTime.UtcNow,
                GrandTotal = grandTotal,
                OrderStatus = OrderStatus.Completed, // Payment is done, order is confirmed
                OrderSummaryItems = cartItems.Select(c => new OrderSummaryItem
                {
                    ProductID = c.ProductID,
                    Quantity = c.Quantity,
                    PriceAtPurchase = c.Product.Price
                }).ToList()
            };

            _context.Orders.Add(newOrder);

            // 🗑️ Clear Shopping Cart
            _context.ShoppingCarts.RemoveRange(cartItems);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Payment successful, Order created!", OrderID = newOrder.OrderID });
        }

        // ✏️ Update Payment
        [HttpPut("{id}"), Authorize]
        public async Task<IActionResult> UpdatePayment(int id, Payment payment)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var existingPayment = await _context.Payments.FindAsync(id);
            if (existingPayment == null)
                return NotFound();

            existingPayment.Address = payment.Address.Trim();
            existingPayment.PhoneNumber = payment.PhoneNumber.Trim();
            existingPayment.PaymentMethod = payment.PaymentMethod.Trim();
            existingPayment.PaymentStatus = payment.PaymentStatus;
            existingPayment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Payment ID {id} updated successfully." });
        }

        // 🗑️ Delete Payment
        [HttpDelete("{id}"), Authorize]
        public async Task<IActionResult> DeletePayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
                return NotFound();

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
