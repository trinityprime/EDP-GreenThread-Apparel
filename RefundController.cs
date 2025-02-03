using EDP_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EDP_API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class RefundController : ControllerBase
    {
        private readonly MyDbContext _context;

        public RefundController(MyDbContext context)
        {
            _context = context;
        }

        // Get all refunds
        [HttpGet]
        public IActionResult GetAll()
        {
            var refunds = _context.Refunds.Include(r => r.User).Include(r => r.Order).ToList();
            var data = refunds.Select(r => new
            {
                r.RefundID,
                r.RefundAmount,
                r.RefundDate,
                r.RefundStatus,
                r.UserID,
                User = new
                {
                    r.User?.FirstName,
                    r.User?.LastName
                },
                r.OrderID,
                OrderDetails = new
                {
                    r.Order.OrderDate,
                    TotalAmount = _context.OrderSummaryItems
                        .Where(osi => osi.OrderID == r.OrderID)
                        .Sum(osi => osi.Subtotal)
                },
            });
            return Ok(data);
        }

        // Get a specific refund by ID
        [HttpGet("{id}")]
        public IActionResult GetRefund(int id)
        {
            var refund = _context.Refunds.Include(r => r.User).Include(r => r.Order).SingleOrDefault(r => r.RefundID == id);
            if (refund == null) return NotFound();

            var data = new
            {
                refund.RefundID,
                refund.RefundAmount,
                refund.RefundDate,
                refund.RefundStatus,
                refund.UserID,
                User = new
                {
                    refund.User?.FirstName,
                    refund.User?.LastName
                },
                refund.OrderID,
                OrderDetails = new
                {
                    refund.Order.OrderDate,
                    TotalAmount = _context.OrderSummaryItems
                        .Where(osi => osi.OrderID == refund.OrderID)
                        .Sum(osi => osi.Subtotal)
                },
            };
            return Ok(data);
        }

        // Create a new refund
        [HttpPost, Authorize]
        public IActionResult CreateRefund(Refund refund)
        {
            int userId = GetUserId();
            var now = DateTime.Now;

            var newRefund = new Refund
            {
                RefundAmount = refund.RefundAmount,
                RefundDate = now,
                RefundStatus = Refund.Refund_Status.Pending,
                OrderID = refund.OrderID,
                UserID = userId
            };

            _context.Refunds.Add(newRefund);
            _context.SaveChanges();
            return Ok(newRefund);
        }

        // Update a refund
        [HttpPut("{id}"), Authorize]
        public IActionResult UpdateRefund(int id, Refund refund)
        {
            var existingRefund = _context.Refunds.Find(id);
            if (existingRefund == null) return NotFound();

            int userId = GetUserId();
            if (existingRefund.UserID != userId) return Forbid();

            existingRefund.RefundAmount = refund.RefundAmount;
            existingRefund.RefundStatus = refund.RefundStatus;
            existingRefund.RefundDate = DateTime.Now;

            _context.SaveChanges();
            return Ok(new { message = $"Refund ID {id} updated successfully." });
        }

        // Delete a refund
        [HttpDelete("{id}"), Authorize]
        public IActionResult DeleteRefund(int id)
        {
            var refund = _context.Refunds.Find(id);
            if (refund == null) return NotFound();

            int userId = GetUserId();
            if (refund.UserID != userId) return Forbid();

            _context.Refunds.Remove(refund);
            _context.SaveChanges();
            return Ok();
        }

        // Helper method to get the current user's ID from claims
        private int GetUserId()
        {
            return Convert.ToInt32(User.Claims
                .FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
        }
    }
}
