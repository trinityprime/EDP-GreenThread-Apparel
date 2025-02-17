using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LearningAPI.Models;
using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using static LearningAPI.Controllers.OrderController;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly MyDbContext _context;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(MyDbContext context, ILogger<PaymentController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // 🛒 Create Payment for Shopping Cart
        [HttpPost]
        public async Task<IActionResult> CreatePayment([FromBody] Payment paymentRequest)
        {
            try
            {
                _logger.LogInformation($"Starting payment creation for UserID: {paymentRequest.UserID}");

                var shoppingCart = await _context.ShoppingCarts
                    .Include(c => c.ShoppingCartItems)
                    .ThenInclude(i => i.Product)
                    .FirstOrDefaultAsync(c => c.UserID == paymentRequest.UserID);

                if (shoppingCart == null || !shoppingCart.ShoppingCartItems.Any())
                {
                    _logger.LogError($"Shopping cart does not exist for UserID: {paymentRequest.UserID}");
                    return BadRequest("The shopping cart is empty or does not exist.");
                }

                decimal grandTotal = shoppingCart.ShoppingCartItems.Sum(i =>
                    i.Quantity * (i.Product.Price * (1 - i.Product.DiscountPercentage / 100)));
                _logger.LogInformation($"Calculated GrandTotal for UserID {paymentRequest.UserID}: {grandTotal}");

                var newPayment = new Payment
                {
                    UserID = paymentRequest.UserID,
                    ShoppingCartID = shoppingCart.ShoppingCartID,
                    Address = paymentRequest.Address.Trim(),
                    PhoneNumber = paymentRequest.PhoneNumber.Trim(),
                    PaymentMethod = paymentRequest.PaymentMethod.Trim(),
                    AmountPaid = grandTotal,
                    PaymentStatus = PaymentStatus.Completed,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Payments.Add(newPayment);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Payment created successfully. PaymentID: {newPayment.PaymentID}");

                return Ok(new
                {
                    message = "Payment created successfully.",
                    paymentID = newPayment.PaymentID,
                    amountPaid = grandTotal
                });
            }


            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating payment");
                return StatusCode(500, $"An error occurred while creating the payment: {ex.Message}");
            }
        }

        // 📋 Get All Payments
        [HttpGet]
        public async Task<IActionResult> GetAllPayments()
        {
            try
            {
                var payments = await _context.Payments
                    .Include(p => p.User)
                    .Include(p => p.ShoppingCart)
                    .ThenInclude(c => c.ShoppingCartItems)
                    .ThenInclude(i => i.Product)
                    .ToListAsync();

                var result = payments.Select(p => new
                {
                    p.PaymentID,
                    p.UserID,
                    User = new { p.User.FirstName, p.User.LastName },
                    p.ShoppingCartID,
                    CartItems = p.ShoppingCart.ShoppingCartItems.Select(i => new
                    {
                        i.Product.ProductName,
                        i.Quantity,
                        i.GrandTotal
                    }),
                    p.Address,
                    p.PhoneNumber,
                    p.PaymentMethod,
                    p.AmountPaid,
                    PaymentStatus = p.PaymentStatus.ToString(),
                    p.CreatedAt,
                    p.UpdatedAt
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while retrieving the payments: {ex.Message}");
            }
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] PaymentRequest paymentRequest)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (paymentRequest.UserID <= 0)
                return BadRequest("Invalid UserID.");

            try
            {
                _logger.LogInformation($"Fetching shopping cart for UserID: {paymentRequest.UserID}");
                var shoppingCart = await _context.ShoppingCarts
                    .Include(c => c.ShoppingCartItems)
                    .ThenInclude(i => i.Product)
                    .FirstOrDefaultAsync(c => c.UserID == paymentRequest.UserID);

                if (shoppingCart == null || !shoppingCart.ShoppingCartItems.Any())
                {
                    _logger.LogWarning($"No shopping cart found with items for UserID: {paymentRequest.UserID}");
                    return BadRequest("No items in the shopping cart. Please add items before proceeding to checkout.");
                }


                // Rest of the payment and order creation logic
                decimal grandTotal = shoppingCart.ShoppingCartItems.Sum(i =>
                    i.Quantity * (i.Product.Price * (1 - i.Product.DiscountPercentage / 100)));

                var newPayment = new Payment
                {
                    UserID = paymentRequest.UserID,
                    ShoppingCartID = shoppingCart.ShoppingCartID,
                    Address = paymentRequest.Address.Trim(),
                    PhoneNumber = paymentRequest.PhoneNumber.Trim(),
                    PaymentMethod = paymentRequest.PaymentMethod.Trim(),
                    AmountPaid = grandTotal,
                    PaymentStatus = PaymentStatus.Completed,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Payments.Add(newPayment);
                await _context.SaveChangesAsync();

                var newOrder = new Order
                {
                    UserID = paymentRequest.UserID,
                    PaymentID = newPayment.PaymentID,
                    ShoppingCartID = shoppingCart.ShoppingCartID,
                    OrderDate = DateTime.UtcNow,
                    GrandTotal = grandTotal,
                    OrderStatus = OrderStatus.Completed,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    OrderItems = shoppingCart.ShoppingCartItems.Select(cartItem => new OrderItem
                    {
                        ProductName = cartItem.Product.ProductName,
                        Price = cartItem.Product.Price,
                        Quantity = cartItem.Quantity,
                        DiscountPercentage = cartItem.Product.DiscountPercentage, // Add this field
                        Total = cartItem.Quantity * (cartItem.Product.Price * (1 - cartItem.Product.DiscountPercentage / 100)),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }).ToList()
                };

                _context.Orders.Add(newOrder);

                // Clear shopping cart items and mark cart as inactive
                shoppingCart.IsActive = false;
                _context.ShoppingCartItems.RemoveRange(shoppingCart.ShoppingCartItems);

                await _context.SaveChangesAsync();


                return Ok(new
                {
                    message = "Payment and order created successfully.",
                    paymentID = newPayment.PaymentID,
                    orderID = newOrder.OrderID,
                    amountPaid = grandTotal
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during checkout");
                return StatusCode(500, "An error occurred during checkout.");
            }
        }


        public class PaymentRequest
        {
            public int UserID { get; set; }
            public string Address { get; set; }
            public string PhoneNumber { get; set; }
            public string PaymentMethod { get; set; }
        }

        [HttpGet("user-payments/{userID}")]
        public async Task<IActionResult> GetPaymentsByUserID(int userID)
        {
            try
            {
                // Check if the user exists
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserID == userID);
                if (user == null)
                {
                    return NotFound("User not found.");
                }

                // Retrieve payments for the user
                var payments = await _context.Payments
                    .Where(p => p.UserID == userID)
                    .ToListAsync();

                if (!payments.Any())
                {
                    return NotFound("No payments found for this user.");
                }

                // Project the payments into a simplified result
                var result = payments.Select(p => new
                {
                    p.PaymentID,
                    p.UserID,
                    User = new { user.FirstName, user.LastName }, // Include user details
                    p.Address,
                    p.PhoneNumber,
                    p.PaymentMethod,
                    p.AmountPaid,
                    PaymentStatus = p.PaymentStatus.ToString(),
                    p.CreatedAt,
                    p.UpdatedAt
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while retrieving the payments: {ex.Message}");
            }
        }

        // ✏️ Update Payment
        [HttpPut("{paymentId}")]
        public async Task<IActionResult> UpdatePayment(int paymentId, [FromBody] PaymentUpdateRequest request)
        {
            if (request == null)
            {
                return BadRequest("Request body is missing.");
            }

            var payment = await _context.Payments.FindAsync(paymentId);
            if (payment == null)
            {
                return NotFound("Payment not found.");
            }

            // Update payment status if provided
            if (!string.IsNullOrWhiteSpace(request.PaymentStatus))
            {
                if (!Enum.TryParse<PaymentStatus>(request.PaymentStatus, true, out var status))
                {
                    return BadRequest("Invalid payment status.");
                }
                payment.PaymentStatus = status;
            }

            payment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment updated successfully." });
        }

        // DTO class for update request
        public class PaymentUpdateRequest
        {
            public string PaymentStatus { get; set; }
        }



        // 🗑️ Delete Payment
        [HttpDelete("{paymentId}")]
        public async Task<IActionResult> DeletePayment(int paymentId)
        {
            try
            {
                _logger.LogInformation($"Attempting to delete payment with ID: {paymentId}");

                // Check if the payment exists
                var payment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.PaymentID == paymentId);

                if (payment == null)
                {
                    _logger.LogWarning($"Payment with ID {paymentId} not found.");
                    return NotFound("Payment not found.");
                }

                // Check if an order exists for the given payment
                var linkedOrder = await _context.Orders.FirstOrDefaultAsync(o => o.PaymentID == paymentId);
                if (linkedOrder != null)
                {
                    _logger.LogWarning($"Payment ID {paymentId} is associated with Order ID {linkedOrder.OrderID}. Cannot delete.");
                    return BadRequest($"Cannot delete Payment ID {paymentId} because it is associated with Order ID {linkedOrder.OrderID}. Please delete the Order first.");
                }

                // If no order exists, delete the payment
                _logger.LogInformation($"Deleting Payment ID: {paymentId}");
                _context.Payments.Remove(payment);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Payment ID {paymentId} deleted successfully.");
                return Ok(new { message = $"Payment ID {paymentId} deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while deleting payment with ID {paymentId}");
                return StatusCode(500, $"An error occurred while deleting the payment: {ex.Message}");
            }
        }
    }
}
