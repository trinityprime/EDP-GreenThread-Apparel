using LearningAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace LearningAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RefundController : ControllerBase
    {
        private readonly MyDbContext _context;

        public RefundController(MyDbContext context)
        {
            _context = context;
        }

        // 📋 GET Refunds for Logged-in User
        [HttpGet("user-refunds/{userId}"), Authorize]
        public async Task<IActionResult> GetUserRefunds(int userId)
        {
            var refunds = await _context.Refunds
                .Include(r => r.Order)
                .Where(r => r.UserID == userId)
                .OrderByDescending(r => r.RefundDate)
                .ToListAsync();

            return Ok(refunds);
        }

        // ➕ POST Request a Refund
        [HttpPost, Authorize]
        public async Task<IActionResult> CreateRefund([FromBody] Refund refundRequest)
        {
            int userId = GetUserId();

            var order = await _context.Orders.FindAsync(refundRequest.OrderID);
            if (order == null)
                return BadRequest("Order not found.");

            // Ensure only completed orders can be refunded
            if (order.OrderStatus != OrderStatus.Completed)
                return BadRequest("Only completed orders can be refunded.");

            // Ensure user owns the order
            if (order.UserID != userId)
                return Forbid("Unauthorized request.");

            // Prevent duplicate refund requests
            var existingRefund = await _context.Refunds.FirstOrDefaultAsync(r => r.OrderID == refundRequest.OrderID);
            if (existingRefund != null)
                return BadRequest("Refund already requested for this order.");

            var newRefund = new Refund
            {
                UserID = userId,
                OrderID = refundRequest.OrderID,
                RefundAmount = order.GrandTotal,
                RefundDate = DateTime.UtcNow,
                RefundStatus = Refund.Refund_Status.Pending
            };

            _context.Refunds.Add(newRefund);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUserRefunds), new { userId = userId }, newRefund);
        }

        // 🔄 PUT Approve or Reject Refund (Admin Only)
        [HttpPut("{id}/status"), Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateRefundStatus(int id, [FromBody] Refund.Refund_Status newStatus)
        {
            var refund = await _context.Refunds.FindAsync(id);
            if (refund == null)
                return NotFound("Refund not found.");

            refund.RefundStatus = newStatus;
            refund.RefundDate = DateTime.UtcNow;

            // ✅ If refund is completed, auto-cancel order
            if (newStatus == Refund.Refund_Status.Completed)
            {
                var order = await _context.Orders.FindAsync(refund.OrderID);
                if (order != null)
                {
                    order.OrderStatus = OrderStatus.Cancelled;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Refund status updated to {newStatus}." });
        }

        // 🗑️ DELETE Refund (Only If Pending)
        [HttpDelete("{id}"), Authorize]
        public async Task<IActionResult> DeleteRefund(int id)
        {
            var refund = await _context.Refunds.FindAsync(id);
            if (refund == null) return NotFound();

            if (refund.RefundStatus != Refund.Refund_Status.Pending)
                return BadRequest("Only pending refunds can be deleted.");

            _context.Refunds.Remove(refund);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // 🔍 Helper method to get the current user's ID
        private int GetUserId()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out int userId) ? userId : 0;
        }
    }
}
