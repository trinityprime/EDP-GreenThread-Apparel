using Microsoft.AspNetCore.Mvc;
using EDP_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace EDP_API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly MyDbContext _context;

        public PaymentController(MyDbContext context)
        {
            _context = context;
        }

        // Create Payment
        [HttpPost, Authorize]
        public async Task<IActionResult> CreatePayment(Payment payment)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if a payment already exists for the given OrderID
            var existingPayment = await _context.Payments
                .FirstOrDefaultAsync(p => p.OrderID == payment.OrderID);

            if (existingPayment != null)
            {
                return Conflict("A payment already exists for this order.");
            }

            // Add the new payment if it does not exist
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPaymentById), new { id = payment.PaymentID }, payment);
        }


        // Get All Payments
        [HttpGet, Authorize]
        public IActionResult GetAllPayments()
        {
            var result = _context.Payments
                .Include(p => p.User)
                .Include(p => p.Order)
                .ToList();

            var data = result.Select(p => new
            {
                p.PaymentID,
                p.UserID,
                User = new
                {
                    p.User.FirstName,
                    p.User.LastName
                },
                p.OrderID,
                Order = new
                {
                    p.Order.OrderDate,
                    TotalAmount = _context.OrderSummaryItems
                        .Where(osi => osi.OrderID == p.OrderID)
                        .Sum(osi => osi.Subtotal)
                },
                p.Address,
                p.PhoneNumber,
                p.PaymentMethod,
                PaymentStatus = p.PaymentStatus.ToString()
            });

            return Ok(data);
        }

        // Get Payment by ID
        [HttpGet("{id}"), Authorize]
        public IActionResult GetPaymentById(int id)
        {
            var payment = _context.Payments
                .Include(p => p.User)
                .Include(p => p.Order)
                .SingleOrDefault(p => p.PaymentID == id);

            if (payment == null)
            {
                return NotFound();
            }

            var data = new
            {
                payment.PaymentID,
                payment.UserID,
                User = new
                {
                    payment.User.FirstName,
                    payment.User.LastName
                },
                payment.OrderID,
                Order = new
                {
                    payment.Order.OrderDate,
                    TotalAmount = _context.OrderSummaryItems
                        .Where(osi => osi.OrderID == payment.OrderID)
                        .Sum(osi => osi.Subtotal)
                },
                payment.Address,
                payment.PhoneNumber,
                payment.PaymentMethod,
                PaymentStatus = payment.PaymentStatus.ToString()
            };

            return Ok(data);
        }

        // Update Payment
        [HttpPut("{id}"), Authorize]
        public async Task<IActionResult> UpdatePayment(int id, Payment payment)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingPayment = await _context.Payments.FindAsync(id);
            if (existingPayment == null)
            {
                return NotFound();
            }

            // Update properties
            existingPayment.Address = payment.Address.Trim();
            existingPayment.PhoneNumber = payment.PhoneNumber.Trim();
            existingPayment.PaymentMethod = payment.PaymentMethod.Trim();
            existingPayment.PaymentStatus = payment.PaymentStatus;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymentExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { message = $"Payment ID {id} updated successfully." });
        }


        // Delete Payment
        [HttpDelete("{id}"), Authorize]
        public async Task<IActionResult> DeletePayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound();
            }

            try
            {
                _context.Payments.Remove(payment);
                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (DbUpdateException)
            {
                return BadRequest("Error occurred while deleting the payment.");
            }
        }

        private bool PaymentExists(int id)
        {
            return _context.Payments.Any(e => e.PaymentID == id);
        }
    }
}